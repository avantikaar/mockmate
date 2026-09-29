from django.db import models


class PracticeSession(models.Model):
    """One interview practice session with 3 questions."""
    ROLE_CHOICES = [
        ('swe_intern', 'Software Engineer Intern'),
        ('swe_full', 'Software Engineer Full-Time'),
        ('pm_intern', 'Product Manager Intern'),
        ('data_intern', 'Data Analyst Intern'),
    ]
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]

    session_key = models.CharField(max_length=64, unique=True, db_index=True)
    role = models.CharField(max_length=30, choices=ROLE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')

    # Aggregated scores (set when session completes)
    overall_score = models.FloatField(null=True, blank=True)
    summary = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Session {self.id} — {self.get_role_display()} ({self.status})"


class Question(models.Model):
    """A question asked within a session."""
    session = models.ForeignKey(PracticeSession, on_delete=models.CASCADE, related_name='questions')
    order = models.IntegerField()  # 1, 2, 3...
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']
        unique_together = [['session', 'order']]

    def __str__(self):
        return f"Q{self.order}: {self.text[:50]}"


class Answer(models.Model):
    """A user's answer to a question + AI evaluation."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    question = models.OneToOneField(Question, on_delete=models.CASCADE, related_name='answer')
    audio = models.FileField(upload_to='answers/%Y/%m/', null=True, blank=True)
    transcript = models.TextField(blank=True)

    # Scores (0-10)
    structure_score = models.FloatField(null=True, blank=True)
    specificity_score = models.FloatField(null=True, blank=True)
    impact_score = models.FloatField(null=True, blank=True)
    clarity_score = models.FloatField(null=True, blank=True)
    overall_score = models.FloatField(null=True, blank=True)

    # AI feedback
    strengths = models.JSONField(default=list, blank=True)
    improvements = models.JSONField(default=list, blank=True)
    summary = models.TextField(blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['question__order']

    def __str__(self):
        return f"Answer to Q{self.question.order} ({self.status})"