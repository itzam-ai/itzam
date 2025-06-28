import logging
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks

from ..dependencies import verify_auth_token
from ..schemas import (
    CreateResourceRequest,
    CreateResourceResponse,
)
from ..services import process_resource_embeddings

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1", tags=["resources"], dependencies=[Depends(verify_auth_token)]
)


@router.post("/create-resource", response_model=CreateResourceResponse)
async def create_resource_task(
    request: CreateResourceRequest, background_tasks: BackgroundTasks
):
    """
    Create and process multiple resources with chunking, embeddings, and database storage.
    Equivalent to the TypeScript createResourceTask.
    """
    try:
        logger.info(
            f"Processing create-resource request for {len(request.resources)} resources"
        )

        # Queue background tasks for embedding generation
        for resource in request.resources:
            logger.info(f"Queuing embedding generation for resource {resource.id}")
            background_tasks.add_task(
                process_resource_embeddings,
                background_tasks=background_tasks,
                resource=resource,
                knowledge_id=request.knowledge_id,
                workflow_id=request.workflow_id,
                context_id=request.context_id,
                save_to_db=True,
            )

        logger.info(
            f"Queued {len(request.resources)} embedding tasks for background processing"
        )

        return CreateResourceResponse(
            success=True,
            resources=[resource.dict() for resource in request.resources],
        )

    except Exception as e:
        logger.error(f"Error in create-resource task: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process resources: {str(e)}",
        )
