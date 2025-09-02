from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from supabase import create_client, AsyncClient
from gotrue.types import User
import os
from dotenv import load_dotenv

# Load environment variables from .env file in the root directory
# The path is relative to this file's location (backend/core/dependencies.py)
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path=dotenv_path)


# Define the OAuth2 scheme. The tokenUrl should point to your login endpoint.
# This is a placeholder; you might need to adjust it to your actual auth router.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

async def get_supabase_client() -> AsyncClient:
    """
    Provides an asynchronous Supabase client instance as a dependency.
    It reads the URL and Key from environment variables.
    """
    url: str = os.environ.get("SUPABASE_URL")
    key: str = os.environ.get("SUPABASE_KEY")

    if not url or not key:
        # This will prevent the server from starting if the keys are missing,
        # which is good for catching configuration errors early.
        raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env file")

    return await create_client(url, key)

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    supabase: AsyncClient = Depends(get_supabase_client)
) -> User:
    """
    Dependency to get the current authenticated user from a JWT token.
    This protects endpoints by requiring a valid token.
    """
    try:
        user_response = await supabase.auth.get_user(token)
        user = user_response.user
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")
        return user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )