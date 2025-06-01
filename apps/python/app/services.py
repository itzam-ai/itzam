import uuid
import logging
from typing import Dict, Any
import requests
import tiktoken
from openai import OpenAI
from chonkie import TokenChunker
from fastapi import HTTPException, status

from .config import settings
from .database import save_chunks_to_supabase, update_resource_status, send_update
from .schemas import UpdatePayload

logger = logging.getLogger(__name__)

def get_text_from_tika(url: str, tika_url: str = None) -> tuple[str, int]:
    """Extract text from a file URL using Tika."""
    if tika_url is None:
        tika_url = settings.TIKA_URL
        
    try:
        # Download the file from the URL
        file_response = requests.get(str(url))
        file_response.raise_for_status()
        file_content = file_response.content
        file_size = len(file_content)

        # Send the file to Tika for text extraction
        tika_response = requests.put(
            tika_url,
            headers={"Accept": "text/plain"},
            data=file_content,
        )
        tika_response.raise_for_status()
        return tika_response.text, file_size
    except requests.RequestException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to extract text from URL: {str(e)}"
        )

def generate_file_title(text: str, original_filename: str) -> str:
    """Generate a title for the file based on its content."""
    # Simple title generation - in production, you'd want to use an AI service
    # For now, we'll use the first 100 characters as a simple title
    if text.strip():
        # Take first sentence or first 100 characters
        lines = text.strip().split('\n')
        first_line = lines[0].strip() if lines else ""
        if len(first_line) > 100:
            first_line = first_line[:100] + "..."
        return first_line if first_line else original_filename
    return original_filename

async def generate_embeddings(resource: Dict[str, Any], workflow_id: str, save_to_db: bool = False) -> Dict[str, Any]:
    """Generate embeddings for a resource and optionally save to database."""
    try:
        # Extract text content
        text_content, file_size = get_text_from_tika(str(resource["url"]))
        
        if not text_content.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No text content extracted from the provided URL"
            )
        
        # Generate title
        original_filename = resource.get("fileName", resource.get("file_name", str(resource["url"])))
        title = generate_file_title(text_content, original_filename=original_filename)
        
        # Update resource with title and file size
        update_resource_status(resource["id"], "PROCESSING", title, file_size)
        
        # Initialize tokenizer and chunker
        tokenizer = tiktoken.get_encoding("cl100k_base")
        chunker = TokenChunker(tokenizer)
        
        # Chunk the text
        chunks = chunker(text_content)
        chunk_texts = [chunk.text for chunk in chunks]
        
        logger.info(f"Generated {len(chunk_texts)} chunks for resource {resource['id']}")
        
        # Generate embeddings if OpenAI API key is available
        embeddings_data = None
        if settings.OPENAI_API_KEY:
            try:
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
                
                logger.info(f"Generated embeddings for {len(embeddings_data)} chunks")
                
            except Exception as e:
                logger.error(f"Failed to generate embeddings: {str(e)}")
                raise
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="OpenAI API key not configured"
            )
        
        result = {
            "chunks": chunk_texts,
            "title": title,
            "file_size": file_size,
            "embeddings_count": len(embeddings_data) if embeddings_data else 0
        }
        
        # Save to database if requested
        if save_to_db and embeddings_data:
            save_result = save_chunks_to_supabase(embeddings_data, resource["id"], workflow_id)
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
        update_resource_status(resource["id"], status_to_set)
        
        # Send real-time update
        await send_update(resource, {
            "status": status_to_set,
            "title": title,
            "chunks": len(chunk_texts),
            "file_size": file_size,
            "resource_id": resource["id"]
        })
        
        return result
        
    except Exception as e:
        logger.error(f"Error generating embeddings for resource {resource['id']}: {str(e)}")
        
        # Update resource status to failed
        update_resource_status(resource["id"], "FAILED")
        
        # Send failure update
        await send_update(resource, {
            "status": "FAILED",
            "title": resource.get("fileName", resource.get("file_name", str(resource["url"]))),
            "chunks": 0,
            "file_size": 0,
            "resource_id": resource["id"]
        })
        
        raise 