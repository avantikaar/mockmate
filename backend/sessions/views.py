import os
import uuid
import logging
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import PracticeSession, Question, Answer
from .serializers import (
    PracticeSessionSerializer,
    CreateSessionSerializer,
    SubmitAnswerSerializer,
)
from .genai import generate_first_question
from .tasks import (
    process_answer_pipeline,
    transcribe_and_score,
    save_answer_results,
    prepare_next_step,
)

logger = logging.getLogger(__name__)
USE_CELERY = os.environ.get('USE_CELERY', 'false').lower() == 'true'


@api_view(['POST'])
def create_session(request):
    """Start a new practice session and generate the opening question."""
    serializer = CreateSessionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    session = PracticeSession.objects.create(
        session_key=uuid.uuid4().hex,
        role=serializer.validated_data['role'],
    )

    # Generate the first question synchronously (fast)
    first_q = generate_first_question(session.role)
    Question.objects.create(session=session, order=1, text=first_q)

    return Response(
        PracticeSessionSerializer(session).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(['GET'])
def session_detail(request, session_id):
    """Retrieve a session with all its questions and answers."""
    try:
        session = PracticeSession.objects.get(id=session_id)
    except PracticeSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=404)
    return Response(PracticeSessionSerializer(session).data)


@api_view(['POST'])
def submit_answer(request, session_id, question_id):
    """Upload audio for a question and trigger the AI pipeline."""
    try:
        question = Question.objects.get(id=question_id, session_id=session_id)
    except Question.DoesNotExist:
        return Response({'error': 'Question not found'}, status=404)

    serializer = SubmitAnswerSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    # Replace any existing answer for this question (retry case)
    Answer.objects.filter(question=question).delete()
    answer = Answer.objects.create(
        question=question,
        audio=serializer.validated_data['audio'],
        status='pending',
    )

    if USE_CELERY:
        process_answer_pipeline.delay(answer.id)
    else:
        # Synchronous fallback for free-tier deployments
        try:
            data = transcribe_and_score.run(answer.id)
            data = save_answer_results.run(data)
            prepare_next_step.run(data)
        except Exception as e:
            logger.exception(f"Sync pipeline failed for answer {answer.id}: {e}")

    session = PracticeSession.objects.get(id=session_id)
    return Response(PracticeSessionSerializer(session).data)