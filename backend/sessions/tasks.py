import os
import logging
from celery import shared_task, chain
from django.utils import timezone

from .models import PracticeSession, Question, Answer
from .genai import (
    transcribe_and_evaluate,
    generate_next_question,
    generate_session_summary,
)

logger = logging.getLogger(__name__)
USE_CELERY = os.environ.get('USE_CELERY', 'false').lower() == 'true'
MAX_QUESTIONS = 3


@shared_task
def process_answer_pipeline(answer_id: int):
    pipeline = chain(
        transcribe_and_score.s(answer_id),
        save_answer_results.s(),
        prepare_next_step.s(),
    )
    return pipeline.apply_async()


@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def transcribe_and_score(self, answer_id: int):
    answer = Answer.objects.get(id=answer_id)
    answer.status = 'processing'
    answer.save(update_fields=['status'])

    try:
        result = transcribe_and_evaluate(
            question=answer.question.text,
            audio_path=answer.audio.path,
        )
    except Exception as e:
        logger.exception(f"Transcription/eval failed for answer {answer_id}: {e}")
        answer.status = 'failed'
        answer.save(update_fields=['status'])
        raise

    return {'answer_id': answer_id, 'result': result}


@shared_task
def save_answer_results(data: dict):
    answer = Answer.objects.get(id=data['answer_id'])
    r = data['result'] or {}
    scores = r.get('scores', {}) or {}

    structure = float(scores.get('structure', 0))
    specificity = float(scores.get('specificity', 0))
    impact = float(scores.get('impact', 0))
    clarity = float(scores.get('clarity', 0))

    answer.transcript = r.get('transcript', '')
    answer.structure_score = structure
    answer.specificity_score = specificity
    answer.impact_score = impact
    answer.clarity_score = clarity
    answer.overall_score = round((structure + specificity + impact + clarity) / 4, 1)
    answer.strengths = r.get('strengths', [])
    answer.improvements = r.get('improvements', [])
    answer.summary = r.get('summary', '')
    answer.status = 'completed'
    answer.processed_at = timezone.now()
    answer.save()

    return {'answer_id': answer.id, 'session_id': answer.question.session_id}


@shared_task
def prepare_next_step(data: dict):
    session = PracticeSession.objects.get(id=data['session_id'])
    answered_count = session.questions.filter(answer__status='completed').count()

    # All questions answered → wrap up
    if answered_count >= MAX_QUESTIONS:
        _finish_session(session)
        return session.id

    # Otherwise, generate next adaptive question
    prior_qa = []
    for q in session.questions.filter(answer__status='completed'):
        prior_qa.append({
            'question': q.text,
            'transcript': q.answer.transcript,
            'summary': q.answer.summary,
        })

    next_text = generate_next_question(session.role, prior_qa)
    Question.objects.create(
        session=session,
        order=answered_count + 1,
        text=next_text,
    )
    return session.id


def _finish_session(session: PracticeSession):
    answers = list(
        session.questions.filter(answer__status='completed').values(
            'overall_score', 'strengths', 'improvements', 'summary'
        )
    )
    result = generate_session_summary(answers)
    session.overall_score = result['overall_score']
    session.summary = result['summary']
    session.status = 'completed'
    session.completed_at = timezone.now()
    session.save()