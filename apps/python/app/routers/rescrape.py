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
from ..discord import send_discord_notification

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1",
    tags=["rescrape"],
)


async def track_rescrape_with_stats(
    background_tasks: BackgroundTasks,
    resource,
    workflow_id: str,
    knowledge_id: str
) -> Dict[str, Any]:
    """Wrapper to track rescrape statistics."""
    try:
        result = await rescrape_resource_embeddings(
            background_tasks=background_tasks,
            resource=resource,
            workflow_id=workflow_id,
            knowledge_id=knowledge_id,
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
                knowledge_id=request.knowledge_id
            )
            tasks.append(task)
        
        # Wait for all tasks to complete
        results = await asyncio.gather(*tasks)
        
        # Calculate statistics
        total_resources = len(request.resources)
        cache_hits = sum(1 for r in results if r.get("was_cache_hit", False))
        regenerated = sum(1 for r in results if not r.get("was_cache_hit", False) and "error" not in r)
        failed = sum(1 for r in results if "error" in r)
        
        end_time = datetime.utcnow()
        duration = (end_time - start_time).total_seconds()
        
        logger.info(f"Rescrape completed: {total_resources} total, {cache_hits} cache hits, {regenerated} regenerated, {failed} failed")
        
        # Calculate percentages safely
        cache_hit_pct = (cache_hits / total_resources * 100) if total_resources > 0 else 0
        regenerated_pct = (regenerated / total_resources * 100) if total_resources > 0 else 0
        
        # Send Discord notification
        embed = {
            "title": "📄 Rescrape Job Completed",
            "color": 0x00FF00 if failed == 0 else 0xFFA500,  # Green if no failures, orange otherwise
            "fields": [
                {"name": "Total Resources", "value": str(total_resources), "inline": True},
                {"name": "Cache Hits", "value": f"{cache_hits} ({cache_hit_pct:.1f}%)", "inline": True},
                {"name": "Regenerated", "value": f"{regenerated} ({regenerated_pct:.1f}%)", "inline": True},
                {"name": "Failed", "value": str(failed), "inline": True},
                {"name": "Duration", "value": f"{duration:.2f}s", "inline": True}
            ],
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        # Add failed resources info if any
        if failed > 0:
            failed_resources = [r["resource_id"] for r in results if "error" in r]
            embed["fields"].append({
                "name": "Failed Resources",
                "value": ", ".join(failed_resources[:10]) + ("..." if len(failed_resources) > 10 else ""),
                "inline": False
            })
        
        await send_discord_notification(
            content=f"Rescrape job completed for {total_resources} resources",
            username="Itzam Rescrape Bot",
            embeds=[embed]
        )

        return CreateResourceResponse(
            success=True,
            resources=[resource.dict() for resource in request.resources],
        )
        
    except Exception as e:
        logger.error(f"Error in rescrape task: {str(e)}")
        
        # Send error notification
        error_embed = {
            "title": "❌ Rescrape Job Failed",
            "description": f"Error: {str(e)}",
            "color": 0xFF0000,  # Red
            "fields": [
                {"name": "Resources Count", "value": str(len(request.resources)), "inline": True}
            ],
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        await send_discord_notification(
            content="Rescrape job failed",
            username="Itzam Rescrape Bot",
            embeds=[error_embed]
        )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to rescrape resources: {str(e)}"
        )