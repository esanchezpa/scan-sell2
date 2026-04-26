import logging
import os
from pathlib import Path
from time import perf_counter

from fastapi import FastAPI
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.logging_config import configure_logging
from app.routers import products, inventory, sales, app_settings, barcode

configure_logging(settings)
api_logger = logging.getLogger("app.api")

app = FastAPI(
    title="VentaFácil API",
    version="1.0.0",
    description="Backend for the Scan & Sell Point of Sale system",
)

# Ensure images directory exists
images_path = Path(settings.images_dir)
images_path.mkdir(parents=True, exist_ok=True)

# Mount static files for images
app.mount("/images", StaticFiles(directory=str(images_path.resolve())), name="images")

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8080",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(products.router, prefix="/api/v1")
app.include_router(inventory.router, prefix="/api/v1")
app.include_router(sales.router, prefix="/api/v1")
app.include_router(app_settings.router, prefix="/api/v1")
app.include_router(barcode.router, prefix="/api/v1")


def _request_target(request: Request) -> str:
    query = request.url.query
    return f"{request.url.path}?{query}" if query else request.url.path


@app.middleware("http")
async def log_api_requests(request: Request, call_next):
    if not settings.log_http_access or not request.url.path.startswith("/api/"):
        return await call_next(request)

    if settings.log_http_skip_options and request.method.upper() == "OPTIONS":
        return await call_next(request)

    started_at = perf_counter()
    target = _request_target(request)
    client_host = request.client.host if request.client else "-"

    try:
        response = await call_next(request)
    except Exception:
        duration_ms = (perf_counter() - started_at) * 1000
        api_logger.exception(
            "%s %s -> 500 %.1fms client=%s",
            request.method,
            target,
            duration_ms,
            client_host,
        )
        raise

    duration_ms = (perf_counter() - started_at) * 1000
    suffix = " slow" if duration_ms >= settings.log_slow_request_ms else ""
    level = logging.INFO
    if response.status_code >= 500:
        level = logging.ERROR
    elif response.status_code >= 400:
        level = logging.WARNING

    api_logger.log(
        level,
        "%s %s -> %s %.1fms%s client=%s",
        request.method,
        target,
        response.status_code,
        duration_ms,
        suffix,
        client_host,
    )
    return response


@app.get("/health")
async def health_check():
    return {"status": "ok", "environment": settings.app_env}
