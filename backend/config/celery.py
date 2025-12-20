import os
from celery import Celery
from celery.schedules import crontab
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('config')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Celery Beat Schedule for periodic tasks
app.conf.beat_schedule = {
    'sync-tracking-every-30-minutes': {
        'task': 'shipping.tasks.sync_tracking_updates',
        'schedule': 1800.0,  # 30 minutes in seconds
    },
    'cleanup-expired-carts': {
        'task': 'cart.tasks.cleanup_expired_carts',
        'schedule': crontab(hour=2, minute=0),  # Daily at 2 AM
    },
}

# Task result expiration
app.conf.result_expires = 3600  # 1 hour

# Task routing
app.conf.task_routes = {
    'catalog.tasks.*': {'queue': 'catalog'},
    'notifications.tasks.*': {'queue': 'notifications'},
    'payments.tasks.*': {'queue': 'payments'},
}

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')