from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
import redis

def health_check(request):
    """Basic health check endpoint"""
    return JsonResponse({'status': 'healthy'})

def readiness_check(request):
    """Detailed readiness check for load balancers"""
    checks = {
        'database': False,
        'cache': False,
        'overall': False
    }
    
    # Check database
    try:
        connection.ensure_connection()
        checks['database'] = True
    except Exception:
        pass
    
    # Check cache
    try:
        cache.set('health_check', 'ok', 10)
        checks['cache'] = cache.get('health_check') == 'ok'
    except Exception:
        pass
    
    checks['overall'] = checks['database'] and checks['cache']
    status_code = 200 if checks['overall'] else 503
    
    return JsonResponse(checks, status=status_code)
