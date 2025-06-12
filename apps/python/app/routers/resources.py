import logging
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks

from ..dependencies import verify_auth_token
from ..schemas import (
    CreateResourceRequest, 
    CreateResourceResponse, 
)
from ..services import process_resource_embeddings
from ..database import sync_resource
from ..config import settings

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1",
    tags=["resources"],
    dependencies=[Depends(verify_auth_token)]
)

@router.post("/create-resource", response_model=CreateResourceResponse)
async def create_resource_task(request: CreateResourceRequest, background_tasks: BackgroundTasks):
    """
    Create and process multiple resources with chunking, embeddings, and database storage.
    Equivalent to the TypeScript createResourceTask.
    """
    try:
        logger.info(f"Processing create-resource request for {len(request.resources)} resources with sourceType: {request.source_type}")

        # Validate sourceType requirements
        if request.source_type == "KNOWLEDGE":
            if not request.knowledge_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="knowledge_id is required when sourceType is KNOWLEDGE"
                )
        elif request.source_type == "CONTEXT":
            if not request.context_ids:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="context_ids is required when sourceType is CONTEXT"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="sourceType must be either KNOWLEDGE or CONTEXT"
            )
        
        # Process resources
        for resource in request.resources:
            logger.info(f"Processing resource {resource.id} ({request.source_type.lower()} flow)")
            
            # Sync resource associations synchronously
            sync_resource(
                resource_id=resource.id,
                source_type=request.source_type,
                knowledge_id=request.knowledge_id,
                context_ids=request.context_ids
            )
            
            # Queue background task for embedding processing
            background_tasks.add_task(
                process_resource_embeddings, 
                background_tasks=background_tasks, 
                resource=resource, 
                knowledge_id=request.knowledge_id if request.source_type == "KNOWLEDGE" else None,
                context_ids=request.context_ids if request.source_type == "CONTEXT" else None,
                workflow_id=request.workflow_id
            )
        
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