from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

@shared_task
def send_email_notification_task(subject, message, recipient_list):
    """
    Async task to send emails without blocking the main thread.
    """
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipient_list,
            fail_silently=False,
        )
        logger.info(f"Email sent successfully to {recipient_list}")
    except Exception as e:
        logger.error(f"Failed to send email to {recipient_list}: {str(e)}")

@shared_task
def send_sms_notification_task(phone_number, message):
    """
    Placeholder for SMS logic (Twilio/AWS SNS).
    """
    # client = Client(settings.TWILIO_SID, settings.TWILIO_TOKEN)
    # client.messages.create(body=message, from_=..., to=phone_number)
    logger.info(f"SMS sent to {phone_number}: {message}")