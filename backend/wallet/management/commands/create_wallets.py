from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from wallet.models import Wallet

User = get_user_model()

class Command(BaseCommand):
    help = 'Create wallets for all existing users'

    def handle(self, *args, **options):
        users = User.objects.all()
        created_count = 0
        existing_count = 0
        
        for user in users:
            wallet, created = Wallet.objects.get_or_create(user=user)
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'[+] Created wallet for {user.email}'))
            else:
                existing_count += 1
                self.stdout.write(f'[-] Wallet already exists for {user.email}')
        
        self.stdout.write(self.style.SUCCESS(f'\nSummary:'))
        self.stdout.write(self.style.SUCCESS(f'   Created: {created_count}'))
        self.stdout.write(f'   Already existed: {existing_count}')
        self.stdout.write(f'   Total users: {users.count()}')
