import uuid
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from supabase import create_client, Client, acreate_client, AsyncClient

from .config import settings

logger = logging.getLogger(__name__)

def get_supabase_client() -> Client:
    """Initialize Supabase client with environment variables."""
    if not settings.NEXT_PUBLIC_SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        raise ValueError("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required")
    
    return create_client(settings.NEXT_PUBLIC_SUPABASE_URL, settings.SUPABASE_ANON_KEY)

async def get_supabase_async_client() -> AsyncClient:
    """Initialize Supabase client with environment variables."""
    if not settings.NEXT_PUBLIC_SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        raise ValueError("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required")
    
    return await acreate_client(settings.NEXT_PUBLIC_SUPABASE_URL, settings.SUPABASE_ANON_KEY)

def save_chunks_to_supabase(chunks_data: list, resource_id: str, workflow_id: str) -> dict:
    """Save chunks and embeddings directly to Supabase."""
    try:
        supabase = get_supabase_client()
        
        # Prepare chunk records for insertion
        chunk_records = []
        for chunk_data in chunks_data:
            chunk_id = str(uuid.uuid4())
            record = {
                "id": chunk_id,
                "content": chunk_data["content"],
                "embedding": chunk_data["embedding"],
                "resource_id": resource_id,
                "workflow_id": workflow_id,
                "active": True,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }
            chunk_records.append(record)
        
        # Insert chunks in batch
        result = supabase.table("chunks").insert(chunk_records).execute()
        
        return {
            "success": True,
            "chunks_saved": len(chunk_records),
            "chunk_ids": [record["id"] for record in chunk_records]
        }
        
    except Exception as e:
        logger.error(f"Failed to save chunks to Supabase: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "chunks_saved": 0
        }

def create_resource_in_db(resource_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a resource record in the database."""
    try:
        supabase = get_supabase_client()
        
        resource_id = resource_data.get("id") or str(uuid.uuid4())
        
        # Prepare resource record
        record = {
            "id": resource_id,
            "type": resource_data["type"],
            "url": str(resource_data["url"]),
            "file_name": resource_data.get("fileName", resource_data.get("file_name", str(resource_data["url"]))),
            "mime_type": resource_data.get("mimeType", resource_data.get("mime_type", "application/octet-stream")),
            "file_size": resource_data.get("fileSize", resource_data.get("file_size", 0)),
            "status": "PENDING",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
        
        # Insert resource
        result = supabase.table("resource").insert(record).execute()
        
        if result.data:
            return result.data[0]
        else:
            raise Exception("Failed to create resource")
            
    except Exception as e:
        logger.error(f"Failed to create resource in database: {str(e)}")
        raise

def update_resource_status(resource_id: str, status: str, title: Optional[str] = None, file_size: Optional[int] = None):
    """Update resource status in the database."""
    try:
        supabase = get_supabase_client()
        
        update_data = {
            "status": status,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        if title:
            update_data["title"] = title
        if file_size is not None:
            update_data["file_size"] = file_size
            
        supabase.table("resource").update(update_data).eq("id", resource_id).execute()
        print(f"Updated resource {resource_id} status to {status}")

    except Exception as e:
        logger.error(f"Failed to update resource status: {str(e)}")

def get_channel_id(resource: Dict[str, Any]) -> str:
    """Generate channel ID for Supabase realtime updates."""
    resource_type = resource.get("type", "LINK")
    knowledge_id = resource.get("knowledgeId") or resource.get("knowledge_id")
    channel_type = "files" if resource_type == "FILE" else "links"
    return f"knowledge-{knowledge_id}-{channel_type}"

async def send_update(resource: Dict[str, Any], payload: Dict[str, Any]):
    """Send real-time update via Supabase channel."""
    try:
        supabase = await get_supabase_async_client()
        channel_id = get_channel_id(resource)

        # Send broadcast message to the channel
        supabase.channel(channel_id).send({
            "type": "broadcast",
            "event": "update",
            "payload": payload
        })
        
        logger.info(f"Sent update to channel {channel_id}: {payload.get('status', 'unknown')}")
    except Exception as e:
        logger.error(f"Failed to send update: {str(e)}") 