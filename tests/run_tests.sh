#!/bin/bash
# Comprehensive test runner

echo "Running Django Tests..."
cd backend
python manage.py test --verbosity=2

echo "\nRunning Load Tests..."
locust -f ../tests/locustfile.py --headless -u 100 -r 10 -t 60s --host=http://localhost:8000

echo "\nTest Coverage Report..."
coverage run --source='.' manage.py test
coverage report
coverage html

echo "\nAll tests completed!"
