from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from supabase import Client

from ..models.models import User
from .dependencies import get_supabase_client

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")  # Adjust tokenUrl as needed


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    supabase: Client = Depends(get_supabase_client),
) -> User:
    """
    Validates Supabase JWT and returns the current user.
    Also fetches user profile to check for premium status.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        user_response = supabase.auth.get_user(token)
        user_data = user_response.user
        if not user_data:
            raise credentials_exception

        # Fetch user profile from your 'profiles' table to get `is_premium`
        profile_res = (
            supabase.table("profiles").select("*").eq("id", user_data.id).single().execute()
        )
        if not profile_res.data:
            # This might happen if profile is not created on sign-up
            raise HTTPException(status_code=404, detail="User profile not found.")

        # Assuming your User model can be created from this data
        return User(
            id=user_data.id, email=user_data.email, is_premium=profile_res.data.get("is_premium", False)
        )
    except Exception:
        raise credentials_exception