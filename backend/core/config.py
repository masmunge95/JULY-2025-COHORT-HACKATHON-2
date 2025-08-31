from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

load_dotenv()

class Settings(BaseSettings):
    SUPABASE_URL: str = os.environ.get("SUPABASE_URL")
    SUPABASE_SERVICE_KEY: str = os.environ.get("SUPABASE_SERVICE_KEY")
    HF_API_KEY: str = os.environ.get("HF_API_KEY")
    INSTASEND_API_KEY: str = os.environ.get("INSTASEND_API_KEY")
    INSTASEND_WALLET_ID: str = os.environ.get("INSTASEND_WALLET_ID")
    FRONTEND_URL: str = os.environ.get("FRONTEND_URL", "http://localhost:5500")


settings = Settings()