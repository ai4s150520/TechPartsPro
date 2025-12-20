from urllib.parse import parse_qs
from rest_framework_simplejwt.tokens import UntypedToken
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async


@database_sync_to_async
def get_user(user_id):
    User = get_user_model()
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return AnonymousUser()


class JwtAuthMiddleware:
    """Custom ASGI middleware that reads `token` from query string and authenticates JWT for channels."""
    def __init__(self, inner):
        self.inner = inner

    def __call__(self, scope):
        return JwtAuthMiddlewareInstance(scope, self.inner)


class JwtAuthMiddlewareInstance:
    def __init__(self, scope, inner):
        self.scope = dict(scope)
        self.inner = inner

    async def __call__(self, receive, send):
        query_string = self.scope.get('query_string', b'').decode()
        qs = parse_qs(query_string)
        token = qs.get('token')
        if token:
            try:
                t = UntypedToken(token[0])
                user_id = t.get('user_id') or t.get('user') or t.get('user_id')
                if user_id:
                    self.scope['user'] = await get_user(user_id)
                else:
                    self.scope['user'] = AnonymousUser()
            except Exception:
                self.scope['user'] = AnonymousUser()
        else:
            self.scope['user'] = AnonymousUser()

        return await self.inner(self.scope, receive, send)


def JwtAuthMiddlewareStack(inner):
    return JwtAuthMiddleware(inner)
