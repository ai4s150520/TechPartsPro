import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from payments.tasks import refund_order_task

def main():
    test_rr_id = '00000000-0000-0000-0000-000000000000'
    res = refund_order_task.apply_async(args=[test_rr_id])
    print('Enqueued refund_order_task, task id:', res.id)

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print('Failed to enqueue refund task:', e)
        sys.exit(1)
