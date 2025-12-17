from django.urls import path
from .views import NotificationListView, MarkReadView, UnreadCountView

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification-list'),
    path('unread-count/', UnreadCountView.as_view(), name='notification-unread-count'),
    path('mark-all-read/', MarkReadView.as_view(), name='mark-all-read'),
    path('<int:pk>/mark-read/', MarkReadView.as_view(), name='mark-one-read'),
]