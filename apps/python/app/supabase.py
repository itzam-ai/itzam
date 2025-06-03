import logging
from typing import Dict, Any
from supabase import create_client, Client, create_async_client, AsyncClient

from .config import settings

logger = logging.getLogger(__name__)

def get_supabase_client() -> Client:
    """Initialize Supabase client."""
    if not settings.NEXT_PUBLIC_SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        raise ValueError("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required")
    
    return create_client(settings.NEXT_PUBLIC_SUPABASE_URL, settings.SUPABASE_ANON_KEY)

async def get_supabase_async_client() -> AsyncClient:
    """Initialize Supabase async client for realtime operations."""
    if not settings.NEXT_PUBLIC_SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        raise ValueError("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required")
    
    return await create_async_client(settings.NEXT_PUBLIC_SUPABASE_URL, settings.SUPABASE_ANON_KEY)

def get_channel_id(resource: Dict[str, Any], knowledge_id: str) -> str:
    """Generate channel ID for Supabase realtime updates."""
    channel_type = "files" if resource.type == "FILE" else "links"
    return f"knowledge-{knowledge_id}-{channel_type}"

async def send_update(resource: Dict[str, Any], payload: Dict[str, Any], event_type: str = "update"):
    """Send real-time update via Supabase channel."""
    try:
        supabase = await get_supabase_async_client()
        channel_id = get_channel_id(resource, payload["knowledgeId"])
        
        # Create channel and subscribe
        channel = supabase.channel(channel_id)
        await channel.subscribe()
        
        logger.info(f"Sending {event_type} to channel {channel_id}: {payload.get('status', 'unknown')}")
        
        # Send the broadcast update
        await channel.send_broadcast(event_type, payload)
        
        # Unsubscribe from channel
        await channel.unsubscribe()
        
        logger.info(f"Successfully sent {event_type} to channel {channel_id}")
        
    except Exception as e:
        logger.error(f"Failed to send {event_type} to channel: {str(e)}")
        # Don't raise the exception to avoid breaking the main flow
        pass