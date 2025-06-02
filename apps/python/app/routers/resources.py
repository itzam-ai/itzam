import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks

from ..dependencies import verify_auth_token
from ..schemas import (
    CreateResourceRequest, 
    CreateResourceResponse, 
    ChunkRequest, 
    ChunkResponse,
    ProcessingResult
)
from ..database import create_resource_in_db
from ..services import generate_embeddings, get_text_from_tika, generate_file_title
from ..config import settings

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1",
    tags=["resources"],
    dependencies=[Depends(verify_auth_token)]
)

@router.post("/create-resource", response_model=CreateResourceResponse)
async def create_resource_task(request: CreateResourceRequest, background_tasks: BackgroundTasks, user = Depends(verify_auth_token)):
    """
    Create and process multiple resources with chunking, embeddings, and database storage.
    Equivalent to the TypeScript createResourceTask.
    """
    try:
        logger.info(f"Processing create-resource request for {len(request.resources)} resources")
        
        # Create resources in database
        created_resources = []
        for resource_data in request.resources:
            resource_dict = resource_data.dict(by_alias=True)
            resource_dict["knowledgeId"] = request.knowledge_id
            resource_dict["workflowId"] = request.workflow_id
            resource_dict["userId"] = request.user_id
            
            db_resource = create_resource_in_db(resource_dict)
            created_resources.append(db_resource)
        
        logger.info(f"Created {len(created_resources)} resources in database")

        # Queue background tasks for embedding generation
        for resource in created_resources:
            logger.info(f"Queuing embedding generation for resource {resource['id']}")
            background_tasks.add_task(generate_embeddings, resource, request.workflow_id, save_to_db=True)
        
        logger.info(f"Queued {len(created_resources)} embedding tasks for background processing")

        return CreateResourceResponse(
            success=True,
            resources=created_resources,
        )
        
    except Exception as e:
        logger.error(f"Error in create-resource task: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process resources: {str(e)}"
        )