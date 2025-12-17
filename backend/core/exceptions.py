from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    """
    Standardizes error responses across the entire application.
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    if response is not None:
        # Default data structure
        custom_data = {
            "status": "error",
            "code": response.status_code,
            "message": "An error occurred.",
            "errors": {}
        }

        # If it's a list (e.g. ["Invalid credentials"])
        if isinstance(response.data, list):
            custom_data["message"] = response.data[0]
        
        # If it's a dict (e.g. {"email": ["This field is required."]})
        elif isinstance(response.data, dict):
            # Extract the first error message to show in the UI toast
            first_key = next(iter(response.data))
            first_error = response.data[first_key]
            
            if isinstance(first_error, list):
                custom_data["message"] = f"{first_key.title()}: {first_error[0]}"
            else:
                custom_data["message"] = str(first_error)
            
            custom_data["errors"] = response.data

        response.data = custom_data

    return response