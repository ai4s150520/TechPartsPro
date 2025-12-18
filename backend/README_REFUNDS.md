This file documents steps to create & apply DB migration for `RefundRequest` and how to run a Celery worker for testing refund tasks.

1) Create and apply migrations (local dev)

Run from the `backend` directory (where `manage.py` lives):

```bash
# create migration for payments app (generates migration file)
python manage.py makemigrations payments

# apply migrations
python manage.py migrate
```

If you prefer to create a named migration:

```bash
python manage.py makemigrations payments --name add_refundrequest
python manage.py migrate
```

2) Run Celery worker (local dev)

Make sure Redis is running and `CELERY_BROKER_URL`/`REDIS_URL` are set in your environment or in a `.env` file loaded by your environment.

```bash
# from repository root (or backend dir)
# start worker
celery -A config worker -l info

# start beat if scheduled tasks required
celery -A config beat -l info
```

3) Quick smoke test (enqueue a refund task)

Use Django shell to create a `RefundRequest` and enqueue `refund_order_task`:

```bash
python manage.py shell
```

Then in the shell:

```python
from payments.models import RefundRequest
from payments.tasks import refund_order_task
from orders.models import Order

order = Order.objects.first()  # for testing only
# ensure there is a Transaction linked to the order if your refund task expects it
rr = RefundRequest.objects.create(order=order, requested_by=order.user)
refund_order_task.delay(rr.id)
```

4) Notes and production

- Do NOT run migrations against production DB without testing backups and migration plan.
- Ensure Celery workers are managed by your process manager (systemd, k8s Deployment, or supervisor).
- Monitor `refund_requests` table and logs for failures; Celery retries are configured in the task implementation.
