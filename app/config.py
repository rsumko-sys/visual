import os
import secrets
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database (set in .env)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./osint.db")

    # Redis (set in .env)
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # JWT — set SECRET_KEY or JWT_SECRET_KEY in .env for production (required for stable tokens)
    SECRET_KEY: str = os.getenv("SECRET_KEY") or os.getenv("JWT_SECRET_KEY") or secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # API Keys (external services, set in .env)
    SHODAN_KEY: str = os.getenv("SHODAN_KEY") or os.getenv("SHODAN_API_KEY") or ""
    CENSYS_ID: str = os.getenv("CENSYS_ID") or os.getenv("CENSYS_API_ID") or ""
    CENSYS_SECRET: str = os.getenv("CENSYS_SECRET") or os.getenv("CENSYS_API_SECRET") or ""
    VIRUSTOTAL_KEY: str = os.getenv("VIRUSTOTAL_KEY") or ""
    HUNTER_IO_KEY: str = os.getenv("HUNTER_IO_KEY") or ""

    # Celery (set in .env)
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL") or os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND") or os.getenv("REDIS_URL", "redis://localhost:6379/1")

    class Config:
        env_file = ".env"
        extra = "ignore"  # ignore extra vars (DB_USER, REDIS_PASSWORD, etc.)

settings = Settings()
