#!/bin/bash
# Development Environment Setup Script

echo "========================================="
echo "E-Commerce Platform Setup"
echo "========================================="

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed"
    exit 1
fi
echo "✓ Python 3 found"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi
echo "✓ Node.js found"

# Backend setup
echo "\n📦 Setting up backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
echo "✓ Backend dependencies installed"

# Generate SECRET_KEY
SECRET_KEY=$(python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())")
sed -i "s/your-super-secret-key-min-50-chars-long-change-this-immediately/$SECRET_KEY/" .env
echo "✓ SECRET_KEY generated"

# Run migrations
python manage.py migrate
echo "✓ Database migrations applied"

# Create sample data
python manage.py create_sample_data
echo "✓ Sample data created"

# Frontend setup
echo "\n📦 Setting up frontend..."
cd ../frontend
npm install
cp .env.example .env.development
echo "✓ Frontend dependencies installed"

echo "\n========================================="
echo "✅ Setup Complete!"
echo "========================================="
echo "\nTo start the application:"
echo "Backend:  cd backend && python manage.py runserver"
echo "Frontend: cd frontend && npm run dev"
echo "\nDefault credentials:"
echo "Admin:    admin@example.com / admin123"
echo "Seller:   seller@example.com / seller123"
echo "Customer: customer@example.com / customer123"
