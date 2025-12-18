from django.core.management.base import BaseCommand
from django.utils.text import slugify
from catalog.models import Category

class Command(BaseCommand):
    help = 'Populates the database with standard Mobile Parts categories'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('Starting Category Seeding...'))

        # Categories from CSV file
        categories = [
            "LCD & OLED Displays",
            "Audio Components",
            "Repair Tools & Equipment",
            "Replacement Batteries",
            "Cables & Connectors",
            "Screen Protectors",
            "Back Glass & Housing",
            "Charging Port Boards",
            "Logic Boards & Flex",
            "Camera Parts",
        ]

        counter = 0

        for cat_name in categories:
            cat_slug = slugify(cat_name)
            category, created = Category.objects.get_or_create(
                slug=cat_slug,
                defaults={'name': cat_name}
            )
            
            if created:
                counter += 1
                self.stdout.write(f"Created: {category.name}")
            else:
                self.stdout.write(f"Exists: {category.name}")

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {counter} new categories!'))