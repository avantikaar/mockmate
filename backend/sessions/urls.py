from django.urls import path
from . import views

urlpatterns = [
    path('', views.create_session, name='session-create'),
    path('<int:session_id>/', views.session_detail, name='session-detail'),
    path('<int:session_id>/questions/<int:question_id>/answer/', views.submit_answer, name='submit-answer'),
]