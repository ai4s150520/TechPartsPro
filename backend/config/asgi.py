import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
try:
    from core.jwt_auth_middleware import JwtAuthMiddlewareStack
    middleware_stack = JwtAuthMiddlewareStack
except Exception:
    from channels.auth import AuthMiddlewareStack
    middleware_stack = AuthMiddlewareStack

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

django_asgi_app = get_asgi_application()

try:
    from core.routing import websocket_urlpatterns
    
    application = ProtocolTypeRouter({
        "http": django_asgi_app,
        "websocket": AllowedHostsOriginValidator(
            middleware_stack(
                URLRouter(websocket_urlpatterns)
            )
        ),
    })
except ImportError:
    # Fallback if channels not installed
    application = django_asgi_app
