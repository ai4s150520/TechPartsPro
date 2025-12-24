from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
import logging
import time

logger = logging.getLogger(__name__)

class RequestLoggingMiddleware(MiddlewareMixin):
    """Log all requests for debugging"""
    def process_request(self, request):
        request.start_time = time.time()
        logger.info(f"Request: {request.method} {request.path} - User: {getattr(request.user, 'id', 'Anonymous')}")
        return None
    
    def process_response(self, request, response):
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
            logger.info(f"Response: {request.method} {request.path} - Status: {response.status_code} - Duration: {duration:.2f}s")
        return response

class DisableThrottlingMiddleware(MiddlewareMixin):
    """
    Middleware to disable throttling for authenticated users
    """
    def process_request(self, request):
        # Skip throttling for authenticated users
        if hasattr(request, 'user') and request.user.is_authenticated:
            request._throttle_disabled = True
        return None

class ErrorHandlingMiddleware(MiddlewareMixin):
    """
    Middleware to handle common errors gracefully
    """
    def process_exception(self, request, exception):
        logger.error(f"Unhandled exception: {str(exception)}", exc_info=True)
        
        # Handle specific exceptions
        if "429" in str(exception) or "throttled" in str(exception).lower():
            return JsonResponse({
                'error': 'Too many requests. Please try again later.',
                'code': 'RATE_LIMITED'
            }, status=429)
        
        return None