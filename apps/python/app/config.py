import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings and configuration."""

    # Supabase Configuration
    NEXT_PUBLIC_SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    POSTGRES_URL: str

    # Rescrape Configuration
    RESCRAPE_CRON_SECRET: str

    # OpenAI Configuration
    OPENAI_API_KEY: Optional[str]

    # Itzam API Configuration
    ITZAM_API_KEY: Optional[str]
    ITZAM_API_URL: str = os.getenv("ITZAM_API_URL", "https://itz.am/api/v1")

    # Tika Configuration
    TIKA_URL: str = os.getenv("TIKA_URL", "https://tika.yllw.software/tika")

    # Next.js App URL for API endpoints
    NEXT_PUBLIC_APP_URL: str = os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")

    # API Configuration
    API_TITLE: str = "Itzam Processing API"
    API_DESCRIPTION: str = "API for document processing, chunking, embedding generation, and storage with Supabase integration"
    API_VERSION: str = "2.0.0"
    model_config = SettingsConfigDict(env_file=".env", extra="allow")

    @property
    def database_url(self) -> str:
        """Return database URL with correct format for SQLAlchemy."""
        url = self.POSTGRES_URL
        # Convert postgres:// to postgresql:// for SQLAlchemy compatibility
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

    @property
    def required_vars_missing(self) -> list[str]:
        """Return list of missing required environment variables."""
        missing = []
        if not self.NEXT_PUBLIC_SUPABASE_URL:
            missing.append("NEXT_PUBLIC_SUPABASE_URL")
        if not self.SUPABASE_ANON_KEY:
            missing.append("SUPABASE_ANON_KEY")
        return missing

    @property
    def is_healthy(self) -> bool:
        """Check if all required configuration is present."""
        return len(self.required_vars_missing) == 0


settings = Settings()  # type: ignore[call-arg]
