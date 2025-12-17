from django.urls import path
from .views import ReviewListCreateView, MarkHelpfulView

urlpatterns = [
    path('', ReviewListCreateView.as_view(), name='review-list-create'),
    path('<int:pk>/helpful/', MarkHelpfulView.as_view(), name='review-mark-helpful'),
]