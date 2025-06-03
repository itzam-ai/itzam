import logging
import asyncio
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks

from ..schemas import (
    CreateResourceRequest, 
    CreateResourceResponse, 
    RescrapeRequest,
)
from ..services import process_resource_embeddings
from ..config import settings

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1",
    tags=["rescrape"],
)

@router.post("/rescrape", response_model=CreateResourceResponse)
async def rescrape_resource(request: RescrapeRequest, background_tasks: BackgroundTasks):
    """
    Rescrape a resource.
    Do basicaly the same as create-resource but checking for the RESCRAPE_CRON_SECRET
    """
    try:
        if request.rescrape_secret != settings.RESCRAPE_CRON_SECRET:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid rescrape secret"
            )
        
        logger.info(f"Processing create-resource request for {len(request.resources)} resources")

        # Queue background tasks for embedding generation
        for resource in request.resources:
            logger.info(f"Queuing embedding generation for resource {resource.id}")
            background_tasks.add_task(process_resource_embeddings, background_tasks=background_tasks, resource=resource, knowledge_id=request.knowledge_id, workflow_id=request.workflow_id, save_to_db=True)
        
        logger.info(f"Queued {len(request.resources)} embedding tasks for background processing")

        return CreateResourceResponse(
            success=True,
            resources=[resource.dict() for resource in request.resources],
        )
        
    except Exception as e:
        logger.error(f"Error in create-resource task: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process resources: {str(e)}"
        )
    
@router.post("/rescrape", response_model=CreateResourceResponse)
async def rescrape_resource(request: CreateResourceRequest, background_tasks: BackgroundTasks):
    """
    Rescrape a resource.
    Do basicaly the same as create-resource but checking for the RESCRAPE_CRON_SECRET
    """
    try:
        logger.info(f"Processing create-resource request for {len(request.resources)} resources")

        # Queue background tasks for embedding generation
        for resource in request.resources:
            logger.info(f"Queuing embedding generation for resource {resource.id}")
            background_tasks.add_task(process_resource_embeddings, background_tasks=background_tasks, resource=resource, knowledge_id=request.knowledge_id, workflow_id=request.workflow_id, save_to_db=True)
        
        logger.info(f"Queued {len(request.resources)} embedding tasks for background processing")

        return CreateResourceResponse(
            success=True,
            resources=[resource.dict() for resource in request.resources],
        )
        
    except Exception as e:
        logger.error(f"Error in create-resource task: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process resources: {str(e)}"
        )