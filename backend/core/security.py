from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from supabase import create_client, Client

from .config import settings
from ..models.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# We use the anon key here because we are just decoding the token,
# not performing any privileged operations. The token itself proves authentication.
supabase_anon: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY.split(".")[-1])

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """
    Decodes the JWT token provided by the frontend to get the current user.
    This function is used as a dependency in protected API routes.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Supabase uses a public key to sign JWTs, but for simplicity and security,
        # we can ask Supabase to validate the token for us.
        user_response = supabase_anon.auth.get_user(token)
        user_data = user_response.user
        if not user_data:
            raise credentials_exception
        
        # Fetch profile details like is_premium
        profile = supabase_anon.table('profiles').select('is_premium').eq('id', user_data.id).single().execute()
        
        return User(id=user_data.id, email=user_data.email, is_premium=profile.data.get('is_premium', False))
    except Exception:
        raise credentials_exception