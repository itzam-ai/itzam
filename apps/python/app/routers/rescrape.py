import logging
import asyncio
from datetime import datetime
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status, BackgroundTasks

from ..schemas import (
    CreateResourceResponse, 
    RescrapeRequest,
)
from ..services import rescrape_resource_embeddings
from ..config import settings

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1",
    tags=["rescrape"],
)


async def track_rescrape_with_stats(
    background_tasks: BackgroundTasks,
    resource,
    workflow_id: str,
    knowledge_id: str,
    context_id: str
) -> Dict[str, Any]:
    """Wrapper to track rescrape statistics."""
    try:
        result = await rescrape_resource_embeddings(
            background_tasks=background_tasks,
            resource=resource,
            workflow_id=workflow_id,
            knowledge_id=knowledge_id,
            context_id=context_id,
            save_to_db=True
        )
        return {
            "resource_id": resource.id,
            "was_cache_hit": result.get("status") == "skipped",
            "result": result
        }
    except Exception as e:
        logger.error(f"Error processing resource {resource.id}: {str(e)}")
        return {
            "resource_id": resource.id,
            "was_cache_hit": False,
            "error": str(e)
        }

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
        
        logger.info(f"Processing rescrape request for {len(request.resources)} resources")
        start_time = datetime.utcnow()

        # Process all resources and collect statistics
        tasks = []
        for resource in request.resources:
            logger.info(f"Processing resource {resource.id}")
            task = track_rescrape_with_stats(
                background_tasks=background_tasks,
                resource=resource,
                workflow_id=request.workflow_id,
                knowledge_id=request.knowledge_id,
                context_id=request.context_id
            )
            tasks.append(task)
        
        # Wait for all tasks to complete
        results = await asyncio.gather(*tasks)
        
        # Calculate statistics for logging
        total_resources = len(request.resources)
        cache_hits = sum(1 for r in results if r.get("was_cache_hit", False))
        regenerated = sum(1 for r in results if not r.get("was_cache_hit", False) and "error" not in r)
        failed = sum(1 for r in results if "error" in r)
        
        end_time = datetime.utcnow()
        duration = (end_time - start_time).total_seconds()
        
        logger.info(f"Rescrape completed: {total_resources} total, {cache_hits} cache hits, {regenerated} regenerated, {failed} failed in {duration:.2f}s")

        return CreateResourceResponse(
            success=True,
            resources=[resource.dict() for resource in request.resources],
        )
        
    except Exception as e:
        logger.error(f"Error in rescrape task: {str(e)}")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to rescrape resources: {str(e)}"
        )