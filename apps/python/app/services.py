import logging
from typing import Dict, Any, List, Union
import aiohttp
import tiktoken
import json
from chonkie import TokenChunker, OpenAIEmbeddings, Chunk
from fastapi import BackgroundTasks, HTTPException, status

from .config import settings
from .database import save_chunks_to_db, update_resource_status, update_resource_total_batches, increment_processed_batches
from .supabase import send_update, send_usage_update
from .schemas import LinkResource, FileResource, ResourceBase

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

async def generate_file_title(text: str, original_filename: str) -> str:
    """Generate a title using Itzam API or fallback to simple generation."""
    if not text.strip():
        return original_filename
    
    # Try to generate title using Itzam API if available
    if settings.ITZAM_API_KEY:
        try:
            # Limit text to 1000 characters for API efficiency
            limited_text = text[:1000]
            
            payload = {
                "input": f"Original file name: {original_filename}\nFile content: {limited_text}",
                "workflowSlug": "file-title-generator"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{settings.ITZAM_API_URL}/generate/text",
                    headers={
                        "Api-Key": settings.ITZAM_API_KEY,
                        "Content-Type": "application/json"
                    },
                    data=json.dumps(payload)
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        generated_title = result.get("text", "").strip()
                        if generated_title:
                            logger.info(f"Generated title using Itzam API: {generated_title}")
                            return generated_title
                    else:
                        logger.warning(f"Itzam API returned status {response.status}")
        except Exception as e:
            logger.error(f"Error calling Itzam API for title generation: {str(e)}")
    
    # Fallback to simple title generation
    lines = text.strip().split('\n')
    first_line = lines[0].strip() if lines else ""
    
    if first_line and len(first_line) <= 100:
        return first_line
    elif len(text) > 100:
        return text[:100].strip() + "..."
    else:
        return text.strip() or original_filename

async def generate_chunks(resource: ResourceBase, chunk_size: int, tokenizer: tiktoken.Encoding, knowledge_id: str, workflow_id: str):
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

        # Send initial update with file size
        await send_update(resource, {
            "status": "PENDING",
            "title": "",
            "fileSize": file_size,
            "totalChunks": 0,
            "resourceId": resource.id,
            "knowledgeId": knowledge_id
        })
        
        # Send usage update
        await send_usage_update(workflow_id, file_size)
        
        # Generate title using Itzam API or fallback
        original_filename = resource.url
        title = await generate_file_title(text_content, original_filename)

        # Send update with title
        await send_update(resource, {
            "status": "PENDING",
            "title": title,
            "fileSize": file_size,
            "totalChunks": 0,
            "resourceId": resource.id,
            "knowledgeId": knowledge_id
        })
        
        # Update resource with title and file size
        update_resource_status(resource.id, "PENDING", title, file_size)
        
        # Initialize tokenizer and chunker
        chunker = TokenChunker(tokenizer, chunk_size=chunk_size)
        
        # Chunk the text
        chunks = chunker(text_content)
        chunk_length = len(chunks)

        # Update resource with total chunks
        update_resource_status(resource.id, "PENDING", title, file_size, chunk_length)

        # Send update with total chunks
        await send_update(resource, {
            "status": "PENDING",
            "title": title,
            "fileSize": file_size,
            "totalChunks": chunk_length,
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
        fallback_title = str(resource.url)
        
        await send_update(resource, {
            "status": "FAILED",
            "title": fallback_title,
            "totalChunks": 0,
            "fileSize": 0,
            "resourceId": resource.id,
            "knowledgeId": knowledge_id
        })
        
        raise

async def generate_embeddings(chunks: List[Chunk], resource: ResourceBase, workflow_id: str, knowledge_id: str, file_size: int, title: str = None, save_to_db: bool = False) -> Dict[str, Any]:
    """Generate embeddings for chunks and optionally save to database."""
    try:
        # Use provided title or generate a fallback
        if not title:
            original_filename = str(resource.url)
            title = original_filename
        
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
        
        # Increment processed batches and check if all batches are completed
        all_batches_completed = increment_processed_batches(resource.id, 1)
        
        if all_batches_completed:
            logger.info(f"All embedding batches completed for resource {resource.id}. Resource fully processed.")
            # The last_scraped_at was already updated in increment_processed_batches
        
        # Update resource status
        update_resource_status(resource.id, status_to_set)

        logger.warn({
            "status": status_to_set,
            "title": title,
            "processedChunks": len(chunks),
            "fileSize": file_size,
            "resourceId": resource.id,
            "knowledgeId": knowledge_id,
            "allBatchesCompleted": all_batches_completed
        })
        
        # Send real-time update
        await send_update(resource, {
            "status": status_to_set,
            "title": title,
            "processedChunks": len(chunks),
            "fileSize": file_size,
            "resourceId": resource.id,
            "knowledgeId": knowledge_id,
        })
        
        return result
        
    except Exception as e:
        logger.error('Error generating embeddings for resource %s: %s', resource.id, str(e))
        
        # Update resource status to failed
        update_resource_status(resource.id, "FAILED")
        
        # Send failure update
        await send_update(resource, {
            "status": "FAILED",
            "title": title,
            "fileSize": 0,
            "resourceId": resource.id,
            "knowledgeId": knowledge_id
        })
        
        raise

async def process_resource_embeddings(
    background_tasks: BackgroundTasks,
    resource: ResourceBase,
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
        chunks_data = await generate_chunks(resource, chunk_size, tokenizer, knowledge_id, workflow_id)

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

        # Update total_batches in the database
        update_resource_total_batches(resource.id, len(batches))
        logger.info(f"Set total_batches to {len(batches)} for resource {resource.id}")

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
                title=chunks_data["title"],
                save_to_db=save_to_db
            )

        return True

    except Exception as e:
        logger.error(f"Error processing resource embeddings for {resource.id}: {str(e)}")
        raise