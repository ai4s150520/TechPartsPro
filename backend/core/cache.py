from django.core.cache import cache
from functools import wraps

def cache_view(timeout=300, key_prefix='view'):
    """Cache view results"""
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            cache_key = f"{key_prefix}:{request.path}:{request.GET.urlencode()}"
            result = cache.get(cache_key)
            if result is None:
                result = func(request, *args, **kwargs)
                cache.set(cache_key, result, timeout)
            return result
        return wrapper
    return decorator

def invalidate_cache(pattern):
    """Clear cache by pattern"""
    cache.delete_pattern(f"*{pattern}*")
