from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
import logging
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.limiter import limiter
from app.routers import auth, investigations, tools, health, reports, integration, vault
from app.database import engine, Base, get_db
from app.core.rate_limit import RateLimitMiddleware, SecurityMiddleware

# Create tables
Base.metadata.create_all(bind=engine)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="OSINT Platform 2026",
    description="Hybrid OSINT platform with 150 integrated tools",
    version="1.0.0"
)

# Rate limiting (slowapi)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Security middleware
app.add_middleware(SecurityMiddleware)

# CORS middleware (allow_credentials=True + wildcard = blocked by browser; must list origins)
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://dossier-production-871b.up.railway.app",
]
if os.getenv("CORS_ORIGINS"):
    CORS_ORIGINS.extend(o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip())
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Rate limiting middleware
app.add_middleware(RateLimitMiddleware)

# Include routers
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(investigations.router, prefix="/investigations", tags=["investigations"])
app.include_router(reports.router, prefix="/reports", tags=["reports"])
app.include_router(integration.router, prefix="/integration", tags=["integration"])
app.include_router(tools.router, prefix="/tools", tags=["tools"])
app.include_router(vault.router, prefix="/vault", tags=["vault"])

from app.data.tools_catalog import TOTAL_TOOLS

@app.get("/")
async def root():
    return {
        "message": "OSINT Platform 2026",
        "status": "running",
        "total_tools": TOTAL_TOOLS,
        "endpoints": {
            "health": "/health",
            "auth": "/auth",
            "investigations": "/investigations",
            "tools": "/tools"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
