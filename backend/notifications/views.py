from rest_framework import generics, permissions, status, views
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer

class NotificationListView(generics.ListAPIView):
    """
    GET: List all notifications for the logged-in user.
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

class UnreadCountView(views.APIView):
    """
    GET: Return number of unread messages (for the Red Badge on UI).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({"unread_count": count})

class MarkReadView(views.APIView):
    """
    POST: Mark a specific notification (or all) as read.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk=None):
        if pk:
            # Mark single
            try:
                notif = Notification.objects.get(id=pk, user=request.user)
                notif.is_read = True
                notif.save()
            except Notification.DoesNotExist:
                return Response(status=status.HTTP_404_NOT_FOUND)
        else:
            # Mark all
            Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
            
        return Response({"status": "success"}, status=status.HTTP_200_OK)