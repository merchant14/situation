from rest_framework import status
from rest_framework.views import exception_handler


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return response
    messages = {400: "Please correct the highlighted fields.", 401: "Authentication is required or has expired.", 403: "You do not have permission to do that.", 404: "The requested resource was not found.", 429: "Too many requests. Please try again shortly."}
    response.data = {"success": False, "message": messages.get(response.status_code, "Unable to process this request."), "errors": response.data}
    return response
