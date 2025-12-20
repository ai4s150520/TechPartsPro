from django.core.management.base import BaseCommand, CommandError
from catalog.tasks import process_bulk_upload
from accounts.models import User

class Command(BaseCommand):
    help = 'Run bulk import synchronously for testing: python manage.py import_bulk <file_path> <user_id_or_email>'

    def add_arguments(self, parser):
        parser.add_argument('file_path', type=str)
        parser.add_argument('user', type=str, help='User id or email')

    def handle(self, *args, **options):
        file_path = options['file_path']
        user = options['user']
        # Resolve user
        try:
            if user.isdigit():
                u = User.objects.get(id=int(user))
            else:
                u = User.objects.get(email=user)
        except Exception as e:
            raise CommandError(f'User not found: {e}')

        self.stdout.write(f'Running import for user {u.id} file {file_path}...')
        # Call task function directly (synchronous) to avoid needing Celery during testing
        try:
            result = process_bulk_upload.run(None, file_path, u.id)
            self.stdout.write(self.style.SUCCESS(f'Import finished: {result}'))
        except Exception as e:
            raise CommandError(f'Import failed: {e}')
