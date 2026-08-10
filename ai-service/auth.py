"""
Authentication module for AgriConnect AI Service.

Verifies Supabase-issued JWT tokens locally using PyJWT and SUPABASE_JWT_SECRET.
This requires NO network round-trip to Supabase Auth, keeping latency low (< 3s target).
"""

import os
from typing import Optional
import jwt
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from dotenv import load_dotenv

load_dotenv()

security = HTTPBearer(auto_error=False)

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")
USE_DEV_AUTH = os.getenv("USE_DEV_AUTH", "true").lower() == "true"


def verify_supabase_token(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)) -> str:
    """FastAPI dependency to verify incoming Supabase access tokens.

    Returns:
        str: Verified user_id (UUID) extracted from JWT `sub` claim.

    Raises:
        HTTPException: 401 Unauthorized if token is missing, invalid, or expired.
    """
    if not credentials:
        if USE_DEV_AUTH:
            # Dev fallback when no token provided in local testing
            return "00000000-0000-0000-0000-000000000000"
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    jwt_secret = os.getenv("SUPABASE_JWT_SECRET", "")

    if not jwt_secret:
        if USE_DEV_AUTH:
            # Dev mode fallback if secret is not set yet
            return "00000000-0000-0000-0000-000000000000"
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_JWT_SECRET is not configured on server",
        )

    try:
        # Supabase JWTs are signed with HS256 using project JWT secret
        payload = jwt.decode(
            token,
            jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False},  # Supabase tokens have aud="authenticated"
        )

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload: missing 'sub' claim",
            )

        return str(user_id)

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError as e:
        if USE_DEV_AUTH and token.startswith("demo-"):
            return "00000000-0000-0000-0000-000000000000"
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
