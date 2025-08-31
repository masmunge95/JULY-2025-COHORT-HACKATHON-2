from supabase import create_client, Client

from ..config import settings


def get_supabase_client() -> Client:
    """Provides a Supabase client instance."""
    supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    return supabase