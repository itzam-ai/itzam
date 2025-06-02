import uuid
import logging
from typing import Dict, Any, List, Tuple, Union
import asyncio
import aiohttp
import tiktoken
from openai import OpenAI
from chonkie import TokenChunker, OpenAIEmbeddings, Chunk
from fastapi import BackgroundTasks, HTTPException, status

from .config import settings
from .database import save_chunks_to_db, update_resource_status
from .supabase import send_update
from .schemas import UpdatePayload, LinkResource, FileResource

logger = logging.getLogger(__name__)

async def get_text_from_tika(url: str, tika_url: str = None) -> tuple[str, int]:
    """Extract text from a file URL using Tika asynchronously."""
    if tika_url is None:
        tika_url = settings.TIKA_URL
        
    try:
        async with aiohttp.ClientSession() as session:
            # Download the file from the URL
            async with session.get(str(url)) as file_response:
                file_response.raise_for_status()
                file_content = await file_response.read()
                file_size = len(file_content)

            # Send the file to Tika for text extraction
            async with session.put(
                tika_url,
                headers={"Accept": "text/plain"},
                data=file_content,
            ) as tika_response:
                tika_response.raise_for_status()
                text_content = await tika_response.text()
                return text_content, file_size
    except aiohttp.ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to extract text from URL: {str(e)}"
        )

def generate_file_title(text: str, original_filename: str) -> str:
    """Generate a title from text content or fallback to filename."""
    if not text.strip():
        return original_filename
    
    # Simple title generation - take first line or first 100 characters
    lines = text.strip().split('\n')
    first_line = lines[0].strip() if lines else ""
    
    if first_line and len(first_line) <= 100:
        return first_line
    elif len(text) > 100:
        return text[:100].strip() + "..."
    else:
        return text.strip() or original_filename

async def generate_chunks(resource: Union[LinkResource, FileResource], chunk_size: int, tokenizer: tiktoken.Encoding, knowledge_id: str):
    """Extract text from resource and generate chunks."""
    try:
        logger.info(f"Starting chunk generation for resource {resource.id}")
        
        # Extract text content
        text_content, file_size = await get_text_from_tika(str(resource.url))
        
        if not text_content.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No text content extracted from the provided URL"
            )
        
        # Generate title
        title = "Placeholder Title (NEED TO FIX)"
        
        # Update resource with title and file size
        update_resource_status(resource.id, "PENDING", title, file_size)
        
        # Initialize tokenizer and chunker
        chunker = TokenChunker(tokenizer, chunk_size=chunk_size)
        
        # Chunk the text
        chunks = chunker(text_content)

        chunk_length = len(chunks)
        logger.info({
            "status": "PENDING",
            "title": title,
            "chunksLength": chunk_length,
            "fileSize": file_size,
            "resourceId": resource.id,
            "knowledgeId": knowledge_id
        })

        await send_update(resource, {
            "status": "PENDING",
            "title": title,
            "fileSize": file_size,
            "chunksLength": chunk_length,
            "resourceId": resource.id,
            "knowledgeId": knowledge_id
        })
        
        logger.info(f"Generated {chunk_length} chunks for resource {resource.id}")

        return {
            "chunks": chunks,
            "title": title,
            "file_size": file_size,
            "text_content": text_content
        }
        
    except Exception as e:
        logger.error(f"Error generating chunks for resource {resource.id}: {str(e)}")
        
        # Update resource status to failed
        update_resource_status(resource.id, "FAILED")
        
        # Send failure update
        await send_update(resource, {
            "status": "FAILED",
            "title": "Placeholder Title (NEED TO FIX)",
            "chunksLength": 0,
            "fileSize": 0,
            "resourceId": resource.id,
            "knowledgeId": knowledge_id
        })
        
        raise

async def generate_embeddings(chunks: List[Chunk], resource: Union[LinkResource, FileResource], workflow_id: str, knowledge_id: str, file_size: int, save_to_db: bool = False) -> Dict[str, Any]:
    """Generate embeddings for chunks and optionally save to database."""
    try:
        title = "Placeholder Title (NEED TO FIX)"
        
        # Generate embeddings if OpenAI API key is available
        embeddings_data = None
        if settings.OPENAI_API_KEY:
            try:
                client = OpenAIEmbeddings(api_key=settings.OPENAI_API_KEY, model="text-embedding-3-small")
                
                # Generate embeddings for all chunks asynchronously
                embeddings = client.embed_batch([chunk.text for chunk in chunks])
                
                embeddings_data = [
                    {
                        "content": chunk.text,
                        "embedding": embeddings[idx].tolist()
                    }
                    for idx, chunk in enumerate(chunks)
                ]
                
                # Send processed-chunks event to update progress
                await send_update(resource, {
                    "resourceId": resource.id,
                    "knowledgeId": knowledge_id,
                    "processedChunks": len(chunks)
                }, event_type="processed-chunks")
                
            except Exception as e:
                raise
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="OpenAI API key not configured"
            )
        
        result = {
            "chunks": chunks,
            "title": title,
            "file_size": file_size,
            "embeddings_count": len(embeddings_data) if embeddings_data else 0
        }
        
        # Save to database if requested
        if save_to_db and embeddings_data:
            save_result = save_chunks_to_db(embeddings_data, resource.id, workflow_id)
            result["save_result"] = save_result
            
            if save_result["success"]:
                result["chunks_saved"] = save_result["chunks_saved"]
                result["chunk_ids"] = save_result["chunk_ids"]
                status_to_set = "PROCESSED"
            else:
                result["save_error"] = save_result["error"]
                status_to_set = "FAILED"
        else:
            result["embeddings"] = embeddings_data
            status_to_set = "PROCESSED"
        
        # Update resource status
        update_resource_status(resource.id, status_to_set)
        
        # Send real-time update
        await send_update(resource, {
            "status": status_to_set,
            "title": title,
            "chunksLength": len(chunks),
            "fileSize": file_size,
            "resourceId": resource.id,
            "knowledgeId": knowledge_id
        })
        
        return result
        
    except Exception as e:
        logger.error('Error generating embeddings for resource %s: %s', resource.id, str(e))
        
        # Update resource status to failed
        update_resource_status(resource.id, "FAILED")
        
        # Send failure update
        await send_update(resource, {
            "status": "FAILED",
            "title": "Placeholder Title (NEED TO FIX)",
            "chunksLength": 0,
            "fileSize": 0,
            "resourceId": resource.id,
            "knowledgeId": knowledge_id
        })
        
        raise

async def process_resource_embeddings(
    background_tasks: BackgroundTasks,
    resource: Union[LinkResource, FileResource],
    workflow_id: str,
    knowledge_id: str,
    save_to_db: bool = False
) -> Dict[str, Any]:
    """Complete pipeline: generate chunks and embeddings for a resource, batching by embedding token limits."""
    try:
        chunk_size = 512
        embeddings_limit_per_request = 300000

        tokenizer = tiktoken.get_encoding("cl100k_base")
        # First generate chunks
        chunks_data = await generate_chunks(resource, chunk_size, tokenizer, knowledge_id)

        await send_update(resource, {
            "processedChunks": 0,
            "totalChunks": len(chunks_data["chunks"]),
            "resourceId": resource.id,
            "knowledgeId": knowledge_id
        })

        chunks: List[Chunk] = chunks_data["chunks"]
        file_size = chunks_data["file_size"]

        # Batch chunks so that each batch does not exceed embeddings_limit_per_request
        batches = []
        current_batch = []
        current_tokens = 0

        for chunk in chunks:
            if chunk.token_count > embeddings_limit_per_request:
                # If a single chunk exceeds the limit, process it alone
                if current_batch:
                    batches.append(current_batch)
                    current_batch = []
                    current_tokens = 0
                batches.append([chunk])
                continue

            if current_tokens + chunk.token_count > embeddings_limit_per_request:
                if current_batch:
                    batches.append(current_batch)
                current_batch = [chunk]
                current_tokens = chunk.token_count
            else:
                current_batch.append(chunk)
                current_tokens += chunk.token_count

        if current_batch:
            batches.append(current_batch)

        # Add a background task for each batch
        for batch in batches:
            logger.info('Generating embeddings for %s chunk batches', len(batch))
            background_tasks.add_task(
                generate_embeddings,
                chunks=batch,
                resource=resource,
                workflow_id=workflow_id,
                knowledge_id=knowledge_id,
                file_size=file_size,
                save_to_db=save_to_db
            )

        return True

    except Exception as e:
        logger.error(f"Error processing resource embeddings for {resource.id}: {str(e)}")
        raise