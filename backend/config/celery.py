import os
from celery import Celery
from celery.schedules import crontab
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('config')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Enhanced Celery Beat Schedule
app.conf.beat_schedule = {
    'sync-tracking-every-30-minutes': {
        'task': 'shipping.tasks.sync_tracking_updates',
        'schedule': 1800.0,  # 30 minutes
        'options': {'queue': 'shipping'}
    },
    'cleanup-expired-carts': {
        'task': 'cart.tasks.cleanup_expired_carts',
        'schedule': crontab(hour=2, minute=0),  # Daily at 2 AM
        'options': {'queue': 'catalog'}
    },
    'process-pending-notifications': {
        'task': 'notifications.tasks.process_pending_notifications',
        'schedule': 300.0,  # Every 5 minutes
        'options': {'queue': 'notifications'}
    },
}

# Enhanced task configuration
app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    result_expires=3600,  # 1 hour
    worker_disable_rate_limits=False,
    task_compression='gzip',
    result_compression='gzip',
)

# Task routing with queues
app.conf.task_routes = {
    'catalog.tasks.*': {'queue': 'catalog'},
    'notifications.tasks.*': {'queue': 'notifications'},
    'payments.tasks.*': {'queue': 'payments'},
    'sellers.tasks.*': {'queue': 'sellers'},
    'shipping.tasks.*': {'queue': 'shipping'},
    'cart.tasks.*': {'queue': 'catalog'},
}

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
    return f'Debug task executed: {self.request.id}'