"""
Django settings for config project.
Modified for Production-Level E-Commerce Architecture.
"""

from pathlib import Path
from corsheaders.defaults import default_headers, default_methods
import os
import environ
from datetime import timedelta
from django.core.exceptions import ImproperlyConfigured

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Initialize Environment Variables
env = environ.Env(
    DEBUG=(bool, False),
)

# Load backend/.env if present
env_file = BASE_DIR / ".env"
if env_file.exists():
    environ.Env.read_env(str(env_file))

# --- SECURITY CONFIGURATION ---
SECRET_KEY = env("SECRET_KEY")
DEBUG = env.bool("DEBUG", default=False)

ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=["localhost", "127.0.0.1", "testserver"])

# Security Settings
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_BROWSER_XSS_FILTER = True
    X_FRAME_OPTIONS = 'DENY'

SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_AGE = 86400  # 24 hours


# --- APPLICATION DEFINITION ---
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party apps
    "rest_framework",
    "rest_framework_simplejwt",
    'rest_framework_simplejwt.token_blacklist',
    "django_filters",
    "corsheaders",
    "drf_spectacular",
    "django_elasticsearch_dsl", 
    # Channels for WebSocket support
    "channels",

    # Project apps
    "core",
    "accounts",
    "catalog",
    "cart",
    "orders",
    "payments",
    "shipping",
    "wishlist",
    "reviews",
    "coupons",
    "notifications",
    "sellers",
    "analytics",
    "wallet",
    "returns",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",           
    "django.middleware.security.SecurityMiddleware",   
    "whitenoise.middleware.WhiteNoiseMiddleware",      
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "core.middleware.DisableThrottlingMiddleware",
    "core.middleware.ErrorHandlingMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "core.middleware.RequestLoggingMiddleware",
]

ROOT_URLCONF = 'config.urls'
AUTH_USER_MODEL = "accounts.User"

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'


# --- DATABASE ---
DATABASES = {
    "default": env.db(
        "DATABASE_URL",
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
    )
}

# Add connection pooling for PostgreSQL
if 'postgresql' in DATABASES['default']['ENGINE']:
    DATABASES['default']['CONN_MAX_AGE'] = 600
    DATABASES['default']['OPTIONS'] = {
        'connect_timeout': 10,
    }

# --- CACHING (Redis) ---
try:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': env('REDIS_URL', default='redis://127.0.0.1:6379/1'),
            'KEY_PREFIX': 'ecommerce',
            'TIMEOUT': 300,
        }
    }
except:
    # Fallback to dummy cache if Redis not available
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
        }
    }


# --- PASSWORD VALIDATION ---
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# --- INTERNATIONALIZATION ---
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC' 
USE_I18N = True
USE_TZ = True


# --- STATIC & MEDIA ---
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

if (BASE_DIR / "static").exists():
    STATICFILES_DIRS = [BASE_DIR / "static"]

if not DEBUG:
    STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
else:
    STATICFILES_STORAGE = "django.contrib.staticfiles.storage.StaticFilesStorage"

# --- MEDIA STORAGE (AWS S3 for production) ---
USE_S3 = env.bool('USE_S3', default=False)

if USE_S3:
    AWS_ACCESS_KEY_ID = env('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = env('AWS_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = env('AWS_STORAGE_BUCKET_NAME')
    AWS_S3_REGION_NAME = env('AWS_S3_REGION_NAME', default='us-east-1')
    AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'
    AWS_S3_OBJECT_PARAMETERS = {'CacheControl': 'max-age=86400'}
    AWS_DEFAULT_ACL = 'public-read'
    AWS_QUERYSTRING_AUTH = False
    
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/'
else:
    MEDIA_URL = "/media/"
    MEDIA_ROOT = BASE_DIR / "media"


# --- REST FRAMEWORK CONFIG ---
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
    ),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    
    'DEFAULT_PAGINATION_CLASS': 'core.pagination.StandardResultsSetPagination',
    'PAGE_SIZE': 20,
    'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler',
    
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '1000/hour',
        'user': '5000/hour',
        'burst': '100/minute',
        'login': '20/minute',
        'register': '10/hour',
        'password_reset': '10/hour',
    }
}

# --- JWT SETTINGS ---
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# --- SWAGGER/OPENAPI ---
SPECTACULAR_SETTINGS = {
    "TITLE": "TechParts Pro API",
    "DESCRIPTION": "Enterprise-grade Mobile Parts E-Commerce Backend",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

# --- CORS SETTINGS ---
# WARNING: In production, set DEBUG=False and list specific origins below
CORS_ALLOW_ALL_ORIGINS = DEBUG

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",    
    "http://127.0.0.1:5173",    
    "http://localhost:3000",    
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://frontend:3000",     
    "http://frontend:5173",
    "http://0.0.0.0:3000",
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = list(default_headers) + [
    "content-type",
    "authorization",
    "x-csrftoken",
    "x-requested-with",
]

CORS_ALLOW_METHODS = list(default_methods) + [
    "PATCH",
    "DELETE",
]

# --- EXTERNAL SERVICES ---
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# --- CELERY CONFIGURATION ---
CELERY_BROKER_URL = env("CELERY_BROKER_URL", default="redis://127.0.0.1:6379/0")
CELERY_RESULT_BACKEND = CELERY_BROKER_URL
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "UTC"
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 minutes
CELERY_TASK_SOFT_TIME_LIMIT = 25 * 60  # 25 minutes
CELERY_WORKER_PREFETCH_MULTIPLIER = 1
CELERY_TASK_ACKS_LATE = True
CELERY_WORKER_DISABLE_RATE_LIMITS = False
CELERY_TASK_REJECT_ON_WORKER_LOST = True

# Task routing
CELERY_TASK_ROUTES = {
    'catalog.tasks.*': {'queue': 'catalog'},
    'notifications.tasks.*': {'queue': 'notifications'},
    'payments.tasks.*': {'queue': 'payments'},
    'sellers.tasks.*': {'queue': 'sellers'},
    'shipping.tasks.*': {'queue': 'shipping'},
}

# Only use eager mode in tests, not in dev/prod
CELERY_TASK_ALWAYS_EAGER = env.bool('CELERY_TASK_ALWAYS_EAGER', default=False)
CELERY_TASK_EAGER_PROPAGATES = CELERY_TASK_ALWAYS_EAGER

if DEBUG:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
else:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = env('EMAIL_HOST', default='smtp.gmail.com')
    EMAIL_PORT = env.int('EMAIL_PORT', default=587)
    EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=True)
    EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
    EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')

DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default='noreply@techparts.pro')

FRONTEND_URL = env('FRONTEND_URL', default='http://localhost:5173')

RAZORPAY_KEY_ID = env('RAZORPAY_KEY_ID', default='rzp_test_placeholder')
RAZORPAY_KEY_SECRET = env('RAZORPAY_KEY_SECRET', default='secret_placeholder')

# Razorpay Payout API (X-Account for payouts)
RAZORPAY_PAYOUT_ACCOUNT_NUMBER = env('RAZORPAY_PAYOUT_ACCOUNT_NUMBER', default='')
RAZORPAY_PAYOUT_KEY_ID = env('RAZORPAY_PAYOUT_KEY_ID', default='')
RAZORPAY_PAYOUT_KEY_SECRET = env('RAZORPAY_PAYOUT_KEY_SECRET', default='')

# Shiprocket API Credentials
SHIPROCKET_EMAIL = env('SHIPROCKET_EMAIL', default='')
SHIPROCKET_PASSWORD = env('SHIPROCKET_PASSWORD', default='')

# --- EXTERNAL API KEYS (Centralized) ---
# KYC Verification APIs
UIDAI_API_KEY = env('UIDAI_API_KEY', default='')  # Aadhaar verification
IT_API_KEY = env('IT_API_KEY', default='')  # PAN verification (Income Tax)
KARZA_API_KEY = env('KARZA_API_KEY', default='')  # Third-party KYC

# Payment Gateway APIs
STRIPE_PUBLIC_KEY = env('STRIPE_PUBLIC_KEY', default='')
STRIPE_SECRET_KEY = env('STRIPE_SECRET_KEY', default='')

# SMS Gateway APIs
SMS_API_KEY = env('SMS_API_KEY', default='')  # MSG91 or Twilio
TWILIO_ACCOUNT_SID = env('TWILIO_ACCOUNT_SID', default='')
TWILIO_AUTH_TOKEN = env('TWILIO_AUTH_TOKEN', default='')

# Email Service APIs
SENDGRID_API_KEY = env('SENDGRID_API_KEY', default='')

# Other Third-Party APIs
GOOGLE_MAPS_API_KEY = env('GOOGLE_MAPS_API_KEY', default='')
CLOUDINARY_CLOUD_NAME = env('CLOUDINARY_CLOUD_NAME', default='')
CLOUDINARY_API_KEY = env('CLOUDINARY_API_KEY', default='')
CLOUDINARY_API_SECRET = env('CLOUDINARY_API_SECRET', default='')

# --- LOGGING CONFIGURATION ---
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'file': {
            'level': 'ERROR',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# --- Production sanity checks ---
if not DEBUG:
    # Ensure SECRET_KEY is set and not a placeholder
    if not SECRET_KEY or SECRET_KEY.startswith('dev'):
        raise ImproperlyConfigured('SECRET_KEY must be set to a secure value in production')

    # Disallow default sqlite database in production
    try:
        db_name = DATABASES['default'].get('NAME', '')
        if db_name and str(db_name).endswith('db.sqlite3'):
            raise ImproperlyConfigured('Sqlite is not supported in production. Configure DATABASE_URL for Postgres.')
    except Exception:
        raise ImproperlyConfigured('Database configuration invalid for production')

    # Ensure payment gateway secrets are configured
    if not RAZORPAY_KEY_SECRET or RAZORPAY_KEY_SECRET in ('', 'secret_placeholder'):
        raise ImproperlyConfigured('RAZORPAY_KEY_SECRET must be set in production environment')

# --- SENTRY ERROR TRACKING ---
SENTRY_DSN = env('SENTRY_DSN', default='')
if SENTRY_DSN and not DEBUG:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    from sentry_sdk.integrations.celery import CeleryIntegration
    from sentry_sdk.integrations.redis import RedisIntegration
    
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[
            DjangoIntegration(),
            CeleryIntegration(),
            RedisIntegration(),
        ],
        traces_sample_rate=0.1,
        send_default_pii=False,
        environment='production' if not DEBUG else 'development',
    )

# --- ELASTICSEARCH ---
ELASTICSEARCH_ENABLED = env.bool('ELASTICSEARCH_ENABLED', default=False)

if ELASTICSEARCH_ENABLED:
    ELASTICSEARCH_DSL = {
        'default': {
            'hosts': env('ELASTICSEARCH_HOST', default='http://localhost:9200')
        },
    }
    ELASTICSEARCH_DSL_AUTOSYNC = not env.bool('TESTING', default=False)
    ELASTICSEARCH_DSL_SIGNAL_PROCESSOR = 'django_elasticsearch_dsl.signals.BaseSignalProcessor'
else:
    # Disable Elasticsearch if not available
    ELASTICSEARCH_DSL = {
        'default': {
            'hosts': []
        },
    }
    ELASTICSEARCH_DSL_AUTOSYNC = False

# --- BUSINESS LOGIC ---
PLATFORM_COMMISSION_RATE = 0.10

# Account Security
ACCOUNT_LOCKOUT_THRESHOLD = 5
ACCOUNT_LOCKOUT_DURATION = 1800  # 30 minutes
PASSWORD_RESET_TIMEOUT = 3600  # 1 hour

# File Upload Security
FILE_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 5242880
ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
MAX_IMAGE_SIZE = 2097152  # 2MB