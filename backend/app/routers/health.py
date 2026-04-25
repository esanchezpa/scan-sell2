"""
VentaFácil — Health Check Router
GET /health
"""
from fastapi import APIRouter

from app.database import AsyncSessionLocal
from sqlalchemy import text

router = APIRouter()


@router.get("/health")
async def health_check():
    db_status = "ok"
    redis_status = "unavailable"

    # Check DB
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
    except Exception:
        db_status = "error"

    # Check Redis (optional — failure is non-blocking)
    try:
        import redis.asyncio as aioredis
        from app.config import settings
        r = aioredis.from_url(settings.redis_url, socket_connect_timeout=1)
        await r.ping()
        await r.aclose()
        redis_status = "ok"
    except Exception:
        redis_status = "unavailable"

    return {
        "status": "ok" if db_status == "ok" else "degraded",
        "database": db_status,
        "redis": redis_status,
        "version": "0.1.0",
    }
