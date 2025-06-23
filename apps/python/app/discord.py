import os
import logging
from typing import Optional, List, Dict, Any
import aiohttp

from .config import settings

logger = logging.getLogger(__name__)


async def send_discord_notification(
    content: str,
    username: Optional[str] = None,
    avatar_url: Optional[str] = None,
    embeds: Optional[List[Dict[str, Any]]] = None
) -> bool:
    """
    Send a notification via Next.js Discord API endpoint.
    
    Args:
        content: The message content
        username: Optional username to display
        avatar_url: Optional avatar URL
        embeds: Optional list of Discord embeds
        
    Returns:
        bool: True if successful, False otherwise
    """
    # In development mode, just log the notification
    if os.getenv("NODE_ENV", "production") == "development":
        logger.info(f"[DEV] 👾 Discord notification: {content}")
        return True
    
    try:
        # Prepare payload
        payload: Dict[str, Any] = {
            "content": content
        }
        
        if username:
            payload["username"] = username
        
        if avatar_url:
            payload["avatar_url"] = avatar_url
            
        if embeds:
            payload["embeds"] = embeds
        
        # Send request to Next.js API endpoint
        api_url = f"{settings.NEXT_PUBLIC_APP_URL}/api/discord"
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                api_url,
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.ok:
                    logger.info(f"Discord notification sent successfully via Next.js API")
                    return True
                else:
                    try:
                        error_data = await response.json()
                        error_msg = error_data.get("error", "Unknown error")
                    except:
                        error_msg = await response.text()
                    logger.error(f"Discord API failed with status {response.status}: {error_msg}")
                    return False
                    
    except Exception as e:
        logger.error(f"Error sending Discord notification: {str(e)}")
        return False