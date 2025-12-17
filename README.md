# E-Commerce Marketplace Platform

A full-stack, production-ready multi-vendor e-commerce marketplace built with Django REST Framework and React.

## 🚀 Features

### For Sellers
- Complete seller onboarding and profile management
- Product catalog with bulk upload (CSV/Excel)
- Real-time inventory tracking
- Order management with automated workflows
- Analytics dashboard with sales insights
- Automated payout system
- Review and rating management

### For Customers
- Advanced product browsing and search
- Shopping cart with real-time calculations
- Wishlist functionality
- Multiple payment options (Stripe, Razorpay)
- Digital wallet system
- Order tracking with shipping updates
- Returns and exchange system
- Product reviews and ratings

### For Administrators
- Platform-wide analytics
- Seller verification and management
- Coupon and promotion management
- System monitoring

## 🛠️ Tech Stack

### Backend
- **Framework**: Django 6.0, Django REST Framework
- **Database**: PostgreSQL
- **Cache**: Redis
- **Task Queue**: Celery
- **Authentication**: JWT
- **API Docs**: DRF Spectacular (OpenAPI/Swagger)

### Frontend
- **Framework**: React 19 with TypeScript
- **State Management**: Zustand, TanStack Query
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **3D Graphics**: Three.js
- **Forms**: React Hook Form + Zod

### DevOps
- **Containerization**: Docker, Docker Compose
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions
- **Infrastructure**: Terraform (GCP)
- **Web Server**: Nginx

### Integrations
- **Payments**: Stripe, Razorpay
- **Shipping**: Shiprocket API
- **Notifications**: Email (Celery tasks)

## 🐳 Quick Start with Docker (Recommended)

### Prerequisites
- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2.0+
- 4GB+ RAM allocated to Docker

### Windows
```bash
# Double-click docker-start.bat
# OR run in terminal:
docker-start.bat
```

### Linux/Mac
```bash
chmod +x docker-start.sh
./docker-start.sh
```

### Manual Docker Setup
```bash
# Build and start all services
docker-compose up --build

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Access the application
# Frontend: http://localhost:5173
# Backend: http://localhost:8000
# Admin: http://localhost:8000/admin
```

### Using Makefile
```bash
make docker-build    # Build images
make docker-up       # Start services
make migrate         # Run migrations
make superuser       # Create admin user
make docker-logs     # View logs
make docker-down     # Stop services
```

## 📦 Manual Installation

### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start server
python manage.py runserver
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.development.example .env.development
# Edit with your API URL

# Start development server
npm run dev
```

### Start Celery (Required for async tasks)
```bash
cd backend

# Start worker
celery -A config worker -l info

# Start beat scheduler (in another terminal)
celery -A config beat -l info
```

## 🔧 Configuration

### Backend Environment Variables
```env
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=postgres://user:pass@localhost:5432/dbname
CELERY_BROKER_URL=redis://localhost:6379/0
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
SHIPROCKET_EMAIL=your_email
SHIPROCKET_PASSWORD=your_password
```

### Frontend Environment Variables
```env
VITE_API_URL=http://localhost:8000/api
VITE_RAZORPAY_KEY_ID=your_public_key
```

## 📚 Documentation

- [Docker Setup Guide](DOCKER_SETUP.md) - Complete Docker documentation
- [CI/CD Guide](CI_CD_GUIDE.md) - GitHub Actions pipeline setup
- [Returns & Exchange Guide](RETURN_EXCHANGE_GUIDE.md) - Returns system documentation
- [API Documentation](http://localhost:8000/api/schema/swagger-ui/) - Interactive API docs (when running)

## 🧪 Testing

### Backend Tests
```bash
cd backend
python manage.py test

# With coverage
coverage run --source='.' manage.py test
coverage report
```

### Frontend Tests
```bash
cd frontend
npm run lint
npm run build
```

### Docker Tests
```bash
docker-compose exec backend python manage.py test
```

## 🚀 Deployment

### Using Docker Compose (Production)
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Using Kubernetes
```bash
kubectl apply -f infra/k8s/deployment.yml
kubectl apply -f infra/k8s/monitoring.yml
```

### Using Terraform (GCP)
```bash
cd infra/terraform
terraform init
terraform plan
terraform apply
```

## 📊 CI/CD Pipeline

The project includes a complete GitHub Actions pipeline:

1. **Test Stage**: Runs backend and frontend tests
2. **Build Stage**: Builds Docker images
3. **Push Stage**: Pushes to GitHub Container Registry
4. **Deploy Stage**: Deploys to GCP/GKE (optional)

See [CI/CD Guide](CI_CD_GUIDE.md) for setup instructions.

## 🏗️ Project Structure

```
ecommerce-marketplace/
├── backend/                 # Django backend
│   ├── accounts/           # User authentication
│   ├── catalog/            # Product management
│   ├── cart/               # Shopping cart
│   ├── orders/             # Order processing
│   ├── payments/           # Payment integration
│   ├── shipping/           # Shipping integration
│   ├── sellers/            # Seller management
│   ├── reviews/            # Product reviews
│   ├── wallet/             # Digital wallet
│   ├── notifications/      # Notification system
│   ├── analytics/          # Analytics & reporting
│   └── config/             # Django settings
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── store/         # State management
│   │   └── lib/           # Utilities
├── infra/                  # Infrastructure
│   ├── docker/            # Dockerfiles
│   ├── k8s/               # Kubernetes configs
│   ├── terraform/         # IaC
│   └── nginx/             # Nginx configs
└── .github/workflows/      # CI/CD pipelines
```

## 🔐 Security Features

- JWT-based authentication
- Data encryption for sensitive fields
- Role-based access control (RBAC)
- CORS configuration
- SQL injection protection
- XSS protection
- CSRF protection
- Secure payment processing
- Image validation and sanitization

## 🌟 Key Features Implementation

### Multi-Vendor System
- Independent seller accounts
- Seller-specific product management
- Automated commission calculation
- Payout management system

### Payment Processing
- Multiple payment gateways
- Secure transaction handling
- Refund management
- Wallet system for quick checkout

### Shipping Integration
- Real-time shipping rates
- Order tracking
- Automated label generation
- Multi-carrier support

### Analytics
- Sales trends and insights
- Revenue tracking
- Customer behavior analysis
- Inventory reports

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Support

For issues and questions:
- Create an issue on GitHub
- Check documentation in `/docs`
- Review API documentation at `/api/schema/swagger-ui/`

## 🎯 Roadmap

- [ ] AI-powered product recommendations
- [ ] Multi-language support
- [ ] Multi-currency support
- [ ] Mobile applications (React Native)
- [ ] Real-time chat support
- [ ] Social commerce features
- [ ] Advanced fraud detection
- [ ] Marketplace analytics dashboard

## 📈 Performance

- Redis caching for improved response times
- Database query optimization
- Lazy loading and code splitting
- CDN integration ready
- Horizontal scaling support

## 🔗 Links

- [Live Demo](#) - Coming soon
- [API Documentation](http://localhost:8000/api/schema/swagger-ui/)
- [Docker Hub](#) - Coming soon
- [GitHub Container Registry](https://github.com/YOUR_USERNAME?tab=packages)

---

Built with ❤️ using Django and React
