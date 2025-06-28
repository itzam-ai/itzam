from fastapi import APIRouter

from ..config import settings
from ..schemas import HealthResponse

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/", response_model=HealthResponse)
def health_check():
    """Health check endpoint."""
    try:
        missing_vars = settings.required_vars_missing

        if missing_vars:
            return HealthResponse(
                status="degraded",
                message=f"Missing environment variables: {', '.join(missing_vars)}",
            )

        return HealthResponse(status="healthy", message="All systems operational")
    except Exception as e:
        return HealthResponse(
            status="unhealthy", message=f"Health check failed: {str(e)}"
        )
