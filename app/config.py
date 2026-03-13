import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database (set in .env)
    DATABASE_URL: str = os.getenv("DATABASE_URL")

    # Redis (set in .env)
    REDIS_URL: str = os.getenv("REDIS_URL")

    # JWT (set in .env)
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # API Keys (external services, set in .env)
    SHODAN_KEY: str = os.getenv("SHODAN_KEY") or os.getenv("SHODAN_API_KEY")
    CENSYS_ID: str = os.getenv("CENSYS_ID")
    CENSYS_SECRET: str = os.getenv("CENSYS_SECRET")
    VIRUSTOTAL_KEY: str = os.getenv("VIRUSTOTAL_KEY")
    HUNTER_IO_KEY: str = os.getenv("HUNTER_IO_KEY")

    # Celery (set in .env)
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL")
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND")

    class Config:
        env_file = ".env"

settings = Settings()
