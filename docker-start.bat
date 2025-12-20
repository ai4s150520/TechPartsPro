@echo off
echo Starting E-Commerce Marketplace...

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo Error: Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)

REM Copy environment files if they don't exist
if not exist .env copy .env.example .env
if not exist backend\.env copy backend\.env.example backend\.env
if not exist frontend\.env.development copy frontend\.env.example frontend\.env.development

REM Build and start services
echo Building Docker images...
docker-compose build

echo Starting services...
docker-compose up -d

REM Wait for services to be ready
echo Waiting for services to start...
timeout /t 10 /nobreak >nul

REM Run migrations
echo Running database migrations...
docker-compose exec backend python manage.py migrate

REM Create superuser if it doesn't exist
echo Creating superuser...
docker-compose exec backend python manage.py shell -c "
from django.contrib.auth import get_user_model;
User = get_user_model();
if not User.objects.filter(email='admin@example.com').exists():
    User.objects.create_superuser('admin@example.com', 'admin123', role='ADMIN')
    print('Superuser created: admin@example.com / admin123')
else:
    print('Superuser already exists')
"

echo.
echo ========================================
echo Application is ready!
echo ========================================
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8000
echo Admin:    http://localhost:8000/admin
echo.
echo Login credentials:
echo Admin: admin@example.com / admin123
echo ========================================

pause