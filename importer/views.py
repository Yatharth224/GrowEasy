from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .serializers import ImportRequestSerializer
from .services import process_all_rows


@api_view(['GET'])
def check_server(request):
    # Simple health check endpoint to confirm the server is running
    data = {
        "status": "ok",
        "message": "Server is running"
    }
    return Response(data)


@api_view(['POST'])
def import_csv(request):
    """
    Main endpoint - called by the frontend after the user clicks "Confirm".
    Takes raw CSV rows, sends them through the AI mapping service,
    and returns the cleaned CRM records.
    """

    # Step 1: validate the incoming data shape
    serializer = ImportRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {"error": "Invalid data received", "details": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

    rows = serializer.validated_data['rows']

    # Step 2: basic safety limit so one request can't overload the AI calls
    if len(rows) > 2000:
        return Response(
            {"error": "Cannot process more than 2000 rows at once"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Step 3: the actual work - AI extraction + cleaning
    result = process_all_rows(rows)

    # Step 4: send the result back to the frontend
    return Response(result, status=status.HTTP_200_OK)