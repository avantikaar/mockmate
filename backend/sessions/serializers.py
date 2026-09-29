from rest_framework import serializers
from .models import PracticeSession, Question, Answer


class AnswerSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='question.text', read_only=True)
    question_order = serializers.IntegerField(source='question.order', read_only=True)

    class Meta:
        model = Answer
        fields = [
            'id', 'question_text', 'question_order', 'transcript',
            'structure_score', 'specificity_score', 'impact_score',
            'clarity_score', 'overall_score',
            'strengths', 'improvements', 'summary',
            'status', 'created_at',
        ]


class QuestionSerializer(serializers.ModelSerializer):
    answer = AnswerSerializer(read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'order', 'text', 'created_at', 'answer']


class PracticeSessionSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = PracticeSession
        fields = [
            'id', 'session_key', 'role', 'status',
            'overall_score', 'summary',
            'questions', 'created_at', 'completed_at',
        ]
        read_only_fields = ['session_key', 'status', 'overall_score', 'summary']


class CreateSessionSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=[
        'swe_intern', 'swe_full', 'pm_intern', 'data_intern',
    ])


class SubmitAnswerSerializer(serializers.Serializer):
    audio = serializers.FileField()