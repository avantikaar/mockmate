from django.contrib import admin
from .models import PracticeSession, Question, Answer


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 0


@admin.register(PracticeSession)
class PracticeSessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'role', 'status', 'overall_score', 'created_at']
    list_filter = ['role', 'status']
    inlines = [QuestionInline]


@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ['id', 'question', 'status', 'overall_score', 'created_at']
    list_filter = ['status']