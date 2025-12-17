#!/bin/bash
# Production Deployment Script

set -e

echo "🚀 Starting deployment..."

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Backend deployment
echo "🔧 Deploying backend..."
cd backend

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate --noinput

# Collect static files
python manage.py collectstatic --noinput

# Restart services
echo "🔄 Restarting services..."
sudo systemctl restart gunicorn
sudo systemctl restart celery
sudo systemctl restart celery-beat

cd ..

# Frontend deployment
echo "🎨 Deploying frontend..."
cd frontend

# Install dependencies
npm install

# Build production bundle
npm run build

# Copy to nginx directory
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/

# Restart nginx
sudo systemctl restart nginx

cd ..

echo "✅ Deployment completed successfully!"
echo "🔍 Check logs: sudo journalctl -u gunicorn -f"
