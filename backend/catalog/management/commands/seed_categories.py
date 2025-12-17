from django.core.management.base import BaseCommand
from django.utils.text import slugify
from catalog.models import Category

class Command(BaseCommand):
    help = 'Populates the database with standard Mobile Parts categories'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('Starting Category Seeding...'))

        # Data Structure: Parent -> Children
        data = [
            {
                "name": "Mobile Spare Parts",
                "slug": "spare-parts",
                "children": [
                    {"name": "LCD & OLED Displays", "slug": "displays-screens"},
                    {"name": "Replacement Batteries", "slug": "batteries"},
                    {"name": "Charging Port Boards", "slug": "charging-ports"},
                    {"name": "Back Glass & Housing", "slug": "housing-back-glass"},
                    {"name": "Camera Modules", "slug": "cameras"},
                    {"name": "Camera Lens Glass", "slug": "camera-lens"},
                    {"name": "Flex Cables", "slug": "flex-cables"},
                    {"name": "Biometrics & Sensors", "slug": "biometrics"},
                    {"name": "Speakers & Buzzers", "slug": "speakers"},
                    {"name": "SIM Trays & Holders", "slug": "sim-trays"},
                    {"name": "Motherboards", "slug": "motherboards"},
                    {"name": "IC Chips & Components", "slug": "ic-chips"},
                ]
            },
            {
                "name": "Repair Tools & Equipment",
                "slug": "repair-tools",
                "children": [
                    {"name": "Repair Tool Kits", "slug": "tool-kits"},
                    {"name": "Adhesives & Glues", "slug": "adhesives"},
                    {"name": "Soldering Equipment", "slug": "soldering-supplies"},
                    {"name": "Machines & Equipment", "slug": "repair-machines"},
                ]
            },
            {
                "name": "Mobile Accessories",
                "slug": "accessories",
                "children": [
                    {"name": "Tempered Glass & Protectors", "slug": "screen-protectors"},
                    {"name": "Protective Cases & Covers", "slug": "cases-covers"},
                    {"name": "Chargers & Cables", "slug": "chargers-cables"},
                    {"name": "Audio Accessories", "slug": "audio-accessories"},
                ]
            }
        ]

        counter = 0

        for parent_data in data:
            # 1. Create Parent
            parent, created = Category.objects.get_or_create(
                slug=parent_data['slug'],
                defaults={'name': parent_data['name']}
            )
            
            if created:
                self.stdout.write(f"Created Parent: {parent.name}")
            
            # 2. Create Children
            for child_data in parent_data['children']:
                child, child_created = Category.objects.get_or_create(
                    slug=child_data['slug'],
                    defaults={
                        'name': child_data['name'],
                        'parent': parent  # Link to Parent
                    }
                )
                
                if child_created:
                    counter += 1
                    self.stdout.write(f"  - Added: {child.name}")

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {counter} categories!'))