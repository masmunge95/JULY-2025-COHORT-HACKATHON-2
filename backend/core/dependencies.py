from supabase import create_client, Client
from .config import settings


def get_supabase_client() -> Client:
    """
    Provides a Supabase client instance with service_role privileges.
    This should be used for backend operations that require bypassing RLS,
    like creating payments or updating user roles.
    """
    supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    return supabase