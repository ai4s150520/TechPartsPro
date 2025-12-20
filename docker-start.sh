#!/bin/bash
set -e

echo "Starting E-Commerce Marketplace..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker."
    exit 1
fi

# Copy environment files if they don't exist
[ ! -f .env ] && cp .env.example .env
[ ! -f backend/.env ] && cp backend/.env.example backend/.env
[ ! -f frontend/.env.development ] && cp frontend/.env.example frontend/.env.development

# Build and start services
echo "Building Docker images..."
docker-compose build

echo "Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 15

# Run migrations
echo "Running database migrations..."
docker-compose exec backend python manage.py migrate

# Create superuser if it doesn't exist
echo "Creating superuser..."
docker-compose exec backend python manage.py shell -c "
from django.contrib.auth import get_user_model;
User = get_user_model();
if not User.objects.filter(email='admin@example.com').exists():
    User.objects.create_superuser('admin@example.com', 'admin123', role='ADMIN')
    print('Superuser created: admin@example.com / admin123')
else:
    print('Superuser already exists')
"

echo ""
echo "========================================"
echo "Application is ready!"
echo "========================================"
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:8000"
echo "Admin:    http://localhost:8000/admin"
echo ""
echo "Login credentials:"
echo "Admin: admin@example.com / admin123"
echo "========================================"