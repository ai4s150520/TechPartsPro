from .models import Notification
from .tasks import send_email_notification_task

class NotificationService:
    @staticmethod
    def create_notification(user, title, message, type='INFO', target_url=None):
        """
        Creates an internal DB notification (Bell Icon).
        """
        return Notification.objects.create(
            user=user,
            title=title,
            message=message,
            notification_type=type,
            target_url=target_url
        )

    @staticmethod
    def send_email(user, subject, message):
        """
        Triggers the Async Email Task.
        """
        if user.email:
            # We use .delay() to tell Celery to run this in the background
            send_email_notification_task.delay(
                subject=subject,
                message=message,
                recipient_list=[user.email]
            )

    @staticmethod
    def order_created(user, order):
        """
        Convenience method for Order Confirmation.
        """
        # 1. In-App
        NotificationService.create_notification(
            user=user,
            title="Order Placed Successfully",
            message=f"Order #{order.order_id} has been placed.",
            type='SUCCESS',
            target_url=f"/account/orders/{order.id}"
        )
        
        # 2. Email
        email_body = f"Hi {user.first_name},\n\nThank you for your order #{order.order_id}. We will notify you when it ships."
        NotificationService.send_email(user, f"Order Confirmation #{order.order_id}", email_body)