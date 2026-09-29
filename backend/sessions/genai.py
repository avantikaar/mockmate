import json
import re
import mimetypes
from pathlib import Path
from django.conf import settings

from google import genai
from google.genai import types

client = genai.Client(api_key=settings.GEMINI_API_KEY)
MODEL = "gemini-2.5-flash"


def _extract_json(text: str) -> dict:
    """Extract first JSON object from LLM output."""
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if not match:
        return {}
    try:
        return json.loads(match.group())
    except json.JSONDecodeError:
        return {}


def generate_first_question(role: str) -> str:
    """Generate the opening question for a session."""
    prompt = f"""You are a senior technical interviewer conducting a mock interview 
for a {role.replace('_', ' ')} position.

Generate ONE opening interview question. It should:
- Be open-ended (e.g., "Tell me about a project you're proud of")
- Allow the candidate to talk for 60-90 seconds
- Be appropriate for the role level

Return ONLY a JSON object: {{"question": "your question here"}}
No other text."""

    response = client.models.generate_content(model=MODEL, contents=prompt)
    data = _extract_json(response.text)
    return data.get("question", "Tell me about yourself and why you're interested in this role.")


def transcribe_and_evaluate(question: str, audio_path: str) -> dict:
    """
    One Gemini call that transcribes the audio AND evaluates the answer.
    Returns: {transcript, scores, strengths, improvements, summary}
    """
    # Read audio bytes
    audio_bytes = Path(audio_path).read_bytes()
    mime_type, _ = mimetypes.guess_type(audio_path)
    if not mime_type or not mime_type.startswith('audio'):
        mime_type = 'audio/webm'

    prompt = f"""You are a senior software engineer evaluating a mock interview answer.

Question asked: "{question}"

Listen to the candidate's audio answer. Then:

1. Transcribe what they said (verbatim, in the same language).
2. Evaluate the answer on 4 dimensions, each scored 0-10:
   - structure: Was it organized? (STAR method, chronological, logical flow)
   - specificity: Did they use concrete examples, technologies, numbers?
   - impact: Did they quantify outcomes? Business value?
   - clarity: Was it easy to follow? No rambling, no filler?

3. List 2-3 specific strengths (cite specific moments).
4. List 2-3 specific improvements (be actionable).
5. Write a one-sentence summary of the answer's overall quality.

Return ONLY valid JSON in this exact format:
{{
  "transcript": "full transcription here",
  "scores": {{
    "structure": 0-10,
    "specificity": 0-10,
    "impact": 0-10,
    "clarity": 0-10
  }},
  "strengths": ["...", "..."],
  "improvements": ["...", "..."],
  "summary": "..."
}}

Be honest and specific. Do NOT inflate scores. A score of 5 means average, 8+ means strong."""

    response = client.models.generate_content(
        model=MODEL,
        contents=[
            types.Part.from_bytes(data=audio_bytes, mime_type=mime_type),
            prompt,
        ],
    )
    return _extract_json(response.text)


def generate_next_question(role: str, previous_qa: list) -> str:
    """
    Generate an adaptive follow-up question based on prior Q&A.
    previous_qa: [{"question": ..., "transcript": ..., "summary": ...}]
    """
    context = "\n\n".join([
        f"Q: {qa['question']}\nA: {qa['transcript'][:400]}...\nFeedback: {qa['summary']}"
        for qa in previous_qa
    ])

    prompt = f"""You are a senior interviewer for a {role.replace('_', ' ')} role.

Previous Q&A in this session:
{context}

Generate the NEXT interview question. It should:
- Probe deeper into something the candidate mentioned
- OR move to a related but different topic
- Be open-ended (60-90 seconds of answer expected)
- Feel natural, like a real interviewer following up

Return ONLY a JSON object: {{"question": "your question here"}}
No other text."""

    response = client.models.generate_content(model=MODEL, contents=prompt)
    data = _extract_json(response.text)
    return data.get("question", "Can you tell me about a challenge you faced recently?")


def generate_session_summary(answers: list) -> dict:
    """
    Generate overall session summary + score.
    answers: list of Answer dicts with scores, strengths, improvements.
    """
    if not answers:
        return {"overall_score": 0, "summary": "No answers submitted."}

    scores = [a['overall_score'] for a in answers if a['overall_score'] is not None]
    avg = sum(scores) / len(scores) if scores else 0

    context = "\n".join([
        f"- {a['summary']}" for a in answers
    ])

    prompt = f"""You are a senior interviewer wrapping up a mock interview.

Across 3 questions, the candidate's average score was {avg:.1f}/10.
Individual feedback: {context}

Write a 3-4 sentence closing summary that:
1. Names 2 specific strengths the candidate showed consistently.
2. Names 1-2 specific areas to improve before their real interview.
3. Ends with an encouraging, actionable note.

Return ONLY a JSON object: {{"summary": "your summary here"}}"""

    response = client.models.generate_content(model=MODEL, contents=prompt)
    data = _extract_json(response.text)

    return {
        "overall_score": round(avg, 1),
        "summary": data.get("summary", "Good effort! Keep practicing."),
    }