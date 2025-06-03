import logging
import asyncio
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks

from ..dependencies import verify_auth_token
from ..schemas import (
    CreateResourceRequest, 
    CreateResourceResponse, 
)
from ..services import process_resource_embeddings
from ..database import create_resource_context_associations, set_resource_knowledge_association
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
        logger.info(f"Processing create-resource request for {len(request.resources)} resources")

        # Determine if this is a knowledge or context resource flow
        is_context_flow = bool(request.context_ids)
        effective_knowledge_id = None if is_context_flow else request.knowledge_id
        
        # Queue background tasks for embedding generation
        for resource in request.resources:
            logger.info(f"Queuing embedding generation for resource {resource.id} ({'context' if is_context_flow else 'knowledge'} flow)")
            
            # Create appropriate associations based on flow type
            if is_context_flow:
                # Context flow: create resource-context associations and clear knowledge_id
                background_tasks.add_task(
                    create_resource_context_associations, 
                    resource_id=resource.id, 
                    context_ids=request.context_ids
                )
            elif effective_knowledge_id:
                # Knowledge flow: set knowledge association and clear any context associations
                background_tasks.add_task(
                    set_resource_knowledge_association,
                    resource_id=resource.id,
                    knowledge_id=effective_knowledge_id
                )
            
            # Process embeddings with the appropriate knowledge_id
            background_tasks.add_task(
                process_resource_embeddings, 
                background_tasks=background_tasks, 
                resource=resource, 
                knowledge_id=effective_knowledge_id, 
                workflow_id=request.workflow_id, 
                save_to_db=True,
                is_context_flow=is_context_flow
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