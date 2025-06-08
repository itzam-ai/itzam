import logging
from fastapi import FastAPI
from typing import Union

from .config import settings
from .routers import health, resources, rescrape
from .schemas import HealthResponse

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title=settings.API_TITLE,
    description=settings.API_DESCRIPTION,
    version=settings.API_VERSION
)

# Include routers
app.include_router(health.router)
app.include_router(resources.router)
app.include_router(rescrape.router)

# Root endpoint
@app.get("/", response_model=HealthResponse)
def read_root():
    """Root endpoint returning API status."""
    return HealthResponse(
        status="healthy",
        message="Itzam Processing API is running"
    )