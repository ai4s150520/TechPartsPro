import logging
import time
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)

class RequestLoggingMiddleware(MiddlewareMixin):
    """Log all API requests for security auditing"""
    
    def process_request(self, request):
        request.start_time = time.time()
        return None
    
    def process_response(self, request, response):
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
            
            # Log API requests
            if request.path.startswith('/api/'):
                user = getattr(request, 'user', None)
                user_id = user.id if user and user.is_authenticated else 'anonymous'
                
                logger.info(
                    f"API Request: {request.method} {request.path} | "
                    f"User: {user_id} | Status: {response.status_code} | "
                    f"Duration: {duration:.2f}s"
                )
        
        return response
