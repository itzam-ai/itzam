import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .supabase import get_supabase_client

logger = logging.getLogger(__name__)

# Security
security = HTTPBearer()

async def verify_auth_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify Supabase authentication token."""
    try:
        logger.info(f"Verifying auth token: {credentials.credentials}")
        supabase = get_supabase_client()
        # Verify the JWT token with Supabase
        response = supabase.auth.get_user(credentials.credentials)
        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token"
            )
        return response.user
    except Exception as e:
        logger.error(f"Authentication failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        ) 