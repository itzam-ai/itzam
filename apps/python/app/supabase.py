import logging
from typing import Dict, Any
from supabase import create_client, Client

from .config import settings

logger = logging.getLogger(__name__)

def get_supabase_client() -> Client:
    """Initialize Supabase client."""
    if not settings.NEXT_PUBLIC_SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        raise ValueError("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required")
    
    return create_client(settings.NEXT_PUBLIC_SUPABASE_URL, settings.SUPABASE_ANON_KEY)

async def get_supabase_async_client():
    """Initialize Supabase async client for realtime operations."""
    if not settings.NEXT_PUBLIC_SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        raise ValueError("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required")
    
    # Use sync client for simplicity - async support can be added later if needed
    return create_client(settings.NEXT_PUBLIC_SUPABASE_URL, settings.SUPABASE_ANON_KEY)

def get_channel_id(resource: Dict[str, Any], knowledge_id: str) -> str:
    """Generate channel ID for Supabase realtime updates."""
    resource_type = resource.type
    channel_type = "files" if resource_type == "FILE" else "links"
    return f"knowledge-{knowledge_id}-{channel_type}"

async def send_update(resource: Dict[str, Any], payload: Dict[str, Any]):
    """Send real-time update via Supabase channel."""
    try:
        supabase = await get_supabase_async_client()
        channel_id = get_channel_id(resource, payload["knowledgeId"])
        
        # Send broadcast message to the channel
        # Note: For now using a simplified approach, full async realtime can be implemented later
        logger.info(f"Would send update to channel {channel_id}: {payload.get('status', 'unknown')}")
        # TODO: Implement proper async realtime when needed
        # channel = supabase.channel(channel_id)
        # channel.subscribe()
        # channel.send_broadcast("update", payload)
        # channel.unsubscribe()
    except Exception as e:
        logger.error(f"Failed to send update: {str(e)}")