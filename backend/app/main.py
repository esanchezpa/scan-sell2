import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.logging_config import configure_logging
from app.routers import products, inventory, sales, app_settings, barcode

configure_logging(settings)

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

@app.get("/health")
async def health_check():
    return {"status": "ok", "environment": settings.app_env}
