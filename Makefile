.PHONY: help build up down restart logs shell migrate createsuperuser test test-coverage lint clean

help:
	@echo "Available commands:"
	@echo "  make build          - Build all Docker images"
	@echo "  make up             - Start all services"
	@echo "  make down           - Stop all services"
	@echo "  make restart        - Restart all services"
	@echo "  make logs           - View logs"
	@echo "  make shell          - Open Django shell"
	@echo "  make migrate        - Run migrations"
	@echo "  make createsuperuser - Create Django superuser"
	@echo "  make test           - Run backend tests"
	@echo "  make test-coverage  - Run tests with coverage"
	@echo "  make lint           - Run frontend linter"
	@echo "  make clean          - Remove all containers and volumes"

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

shell:
	docker-compose exec backend python manage.py shell

migrate:
	docker-compose exec backend python manage.py migrate

createsuperuser:
	docker-compose exec backend python manage.py createsuperuser

test:
	docker-compose exec backend python manage.py test

test-coverage:
	docker-compose exec backend coverage run --source='.' manage.py test
	docker-compose exec backend coverage report

lint:
	docker-compose exec frontend npm run lint

clean:
	docker-compose down -v
	docker system prune -f
