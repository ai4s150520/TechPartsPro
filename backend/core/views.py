from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import connection

class HealthCheckView(APIView):
    """
    Checks if the Application and Database are running.
    Used by AWS Load Balancers / Kubernetes.
    """
    permission_classes = [] # Public access

    def get(self, request):
        try:
            # Check DB connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            
            return Response({
                "status": "healthy",
                "database": "connected",
                "service": "techparts-api"
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                "status": "unhealthy",
                "error": str(e)
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)