import os
import sys
from pydantic_settings import BaseSettings
from pydantic import model_validator, field_validator

class Settings(BaseSettings):
    # Database (set in .env). Fallback to SQLite if Railway ref not resolved.
    DATABASE_URL: str = "sqlite:///./osint.db"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def resolve_database_url(cls, v: str | None) -> str:
        url = v or os.getenv("DATABASE_URL") or "sqlite:///./osint.db"
        if not url or "${{" in str(url) or str(url).strip() == "":
            return "sqlite:///./osint.db"
        return url

    # Redis (set in .env)
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # JWT — SECRET_KEY or JWT_SECRET_KEY MUST be set in .env (server will not start without it)
    SECRET_KEY: str = os.getenv("SECRET_KEY") or os.getenv("JWT_SECRET_KEY") or ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    @model_validator(mode="after")
    def require_secret_key(self):
        if not self.SECRET_KEY or not self.SECRET_KEY.strip():
            print("FATAL: SECRET_KEY must be set in .env (or JWT_SECRET_KEY). Server will not start.", file=sys.stderr)
            sys.exit(1)
        return self

    # Password-only auth: newline-separated list. Each line = one valid password.
    ALLOWED_PASSWORDS: str = os.getenv("ALLOWED_PASSWORDS", "")

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
