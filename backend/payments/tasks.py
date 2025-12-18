from datetime import datetime
import logging

from django.utils import timezone

from config.celery import app

from .models import RefundRequest, Transaction
from .services import PaymentService

logger = logging.getLogger(__name__)


@app.task(bind=True, max_retries=3, default_retry_delay=60)
def refund_order_task(self, refund_request_id: str):
    """Celery task to process a refund asynchronously.
    Uses PaymentService.refund_order to call gateway and updates RefundRequest + Transaction records.
    """
    try:
        rr = RefundRequest.objects.select_for_update().get(id=refund_request_id)
    except RefundRequest.DoesNotExist:
        logger.error(f"RefundRequest not found: {refund_request_id}")
        return

    if rr.status == RefundRequest.Status.SUCCESS:
        logger.info(f"RefundRequest {refund_request_id} already succeeded")
        return

    rr.status = RefundRequest.Status.PROCESSING
    rr.attempt_count += 1
    rr.save()

    try:
        # Attempt refund via existing PaymentService which handles transaction lookup
        refund_resp = PaymentService.refund_order(rr.order)

        # Update related transaction if present
        txn = Transaction.objects.filter(order=rr.order, status=Transaction.Status.REFUNDED).order_by('-created_at').first()
        if txn:
            rr.transaction = txn

        rr.gateway_response = refund_resp or {}
        rr.status = RefundRequest.Status.SUCCESS
        rr.processed_at = timezone.now()
        rr.error_message = ''
        rr.save()

        logger.info(f"RefundRequest {refund_request_id} processed successfully")
        return refund_resp

    except Exception as exc:
        logger.exception(f"RefundRequest {refund_request_id} failed: {exc}")
        rr.status = RefundRequest.Status.FAILED
        rr.error_message = str(exc)
        rr.processed_at = timezone.now()
        rr.save()

        # Retry with exponential backoff
        try:
            raise self.retry(exc=exc)
        except self.MaxRetriesExceededError:
            logger.error(f"Max retries exceeded for refund {refund_request_id}")
            return