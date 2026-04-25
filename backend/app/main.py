"""
VentaFácil — FastAPI Application Entry Point
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import check_db_connection
from app.routers import health, products, inventory, sales, reports, barcode, app_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await check_db_connection()
    yield
    # Shutdown (cleanup if needed)


app = FastAPI(
    title="VentaFácil API",
    description="POS e inventario para tienda pequeña",
    version="0.1.0",
    lifespan=lifespan,
)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routers ---
app.include_router(health.router, tags=["health"])
app.include_router(products.router, prefix="/products", tags=["products"])
app.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
app.include_router(sales.router, prefix="/sales", tags=["sales"])
app.include_router(reports.router, prefix="/reports", tags=["reports"])
app.include_router(barcode.router, prefix="/barcode", tags=["barcode"])
app.include_router(app_settings.router, prefix="/settings", tags=["settings"])
