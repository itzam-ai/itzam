import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, status

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
async def create_resource_task(request: CreateResourceRequest, user = Depends(verify_auth_token)):
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
        
        logger.info(f"Created {len(created_resources)} resources in database {[resource.id for resource in created_resources]}")

        # Process each resource for embeddings
        results = []
        for resource in created_resources:
            try:
                result = await generate_embeddings(resource, request.workflow_id, save_to_db=True)
                
                processing_result = ProcessingResult(
                    resource_id=resource["id"],
                    title=result["title"],
                    chunks_count=len(result["chunks"]),
                    status="PROCESSED",
                    saved_to_supabase=result.get("save_result", {}).get("success", False)
                )
                results.append(processing_result)
                
            except Exception as e:
                logger.error(f"Failed to process resource {resource['id']}: {str(e)}")
                
                processing_result = ProcessingResult(
                    resource_id=resource["id"],
                    title=resource.get("fileName", "unknown"),
                    chunks_count=0,
                    status="FAILED",
                    error=str(e)
                )
                results.append(processing_result)
        
        # Calculate summary
        success_count = len([r for r in results if r.status == "PROCESSED"])
        failed_count = len([r for r in results if r.status == "FAILED"])
        
        logger.info(f"Task completed: {success_count} successful, {failed_count} failed")
        
        return CreateResourceResponse(
            success=True,
            resources=created_resources,
            results=results,
            summary={
                "total": len(created_resources),
                "processed": success_count,
                "failed": failed_count
            }
        )
        
    except Exception as e:
        logger.error(f"Error in create-resource task: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process resources: {str(e)}"
        )

@router.post("/chunk", response_model=ChunkResponse)
async def chunk_task(request: ChunkRequest, user = Depends(verify_auth_token)):
    """
    Process a single resource for chunking and optionally generate embeddings.
    Equivalent to the TypeScript chunkTask.
    """
    try:
        logger.info(f"Processing chunk request for resource: {request.resource.url}")
        
        resource_dict = request.resource.dict(by_alias=True)
        resource_dict["id"] = resource_dict.get("id") or str(uuid.uuid4())
        
        # If save_to_supabase is requested, we need a workflow_id
        if request.save_to_supabase and not request.workflow_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="workflow_id is required when save_to_supabase is true"
            )
        
        # Extract text and chunk
        text_content, file_size = get_text_from_tika(str(request.resource.url))
        
        if not text_content.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No text content extracted from the provided URL"
            )
        
        # Generate title
        original_filename = getattr(request.resource, "file_name", str(request.resource.url))
        title = generate_file_title(text_content, original_filename)
        
        # Initialize tokenizer and chunker
        import tiktoken
        from chonkie import TokenChunker
        
        tokenizer = tiktoken.get_encoding("cl100k_base")
        chunker = TokenChunker(tokenizer)
        
        # Chunk the text
        chunks = chunker(text_content)
        chunk_texts = [chunk.text for chunk in chunks]
        
        result = ChunkResponse(
            chunks=chunk_texts,
            count=len(chunk_texts),
            title=title,
            file_size=file_size
        )
        
        # Generate embeddings if requested
        if request.generate_embeddings:
            if not settings.OPENAI_API_KEY:
                result.embeddings_error = "OpenAI API key not available"
            else:
                try:
                    from openai import OpenAI
                    client = OpenAI(api_key=settings.OPENAI_API_KEY)
                    
                    # Generate embeddings for all chunks
                    embeddings = client.embeddings.create(
                        input=chunk_texts,
                        model="text-embedding-3-small"
                    )
                    
                    embeddings_data = [
                        {
                            "content": chunk_texts[i],
                            "embedding": [float(x) for x in embeddings.data[i].embedding]
                        }
                        for i in range(len(chunk_texts))
                    ]
                    
                    # Save to Supabase if requested
                    if request.save_to_supabase and request.workflow_id:
                        from ..database import save_chunks_to_supabase
                        save_result = save_chunks_to_supabase(embeddings_data, resource_dict["id"], request.workflow_id)
                        
                        result.saved_to_supabase = save_result["success"]
                        result.chunks_saved = save_result["chunks_saved"]
                        result.chunk_ids = save_result.get("chunk_ids", [])
                        
                        if not save_result["success"]:
                            result.save_error = save_result["error"]
                    else:
                        # Return embeddings for client handling
                        result.embeddings = embeddings_data
                        
                except Exception as e:
                    result.embeddings_error = str(e)
                    logger.error(f"Embeddings generation failed: {str(e)}")
        
        logger.info(f"Successfully processed {result.count} chunks")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in chunk task: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        ) 