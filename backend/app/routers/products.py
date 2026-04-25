from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.products import ProductCreate, ProductUpdate, ProductResponse, CategoryResponse
from app.services.products import ProductService

router = APIRouter(prefix="/products", tags=["products"])

@router.get("/", response_model=List[ProductResponse])
async def get_products(business_id: int, db: AsyncSession = Depends(get_db)):
    return await ProductService.get_all_products(db, business_id)

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    product = await ProductService.get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.get("/barcode/{barcode}", response_model=ProductResponse)
async def get_product_by_barcode(barcode: str, business_id: int, db: AsyncSession = Depends(get_db)):
    product = await ProductService.get_product_by_barcode(db, business_id, barcode)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found by barcode")
    return product

@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(product_in: ProductCreate, db: AsyncSession = Depends(get_db)):
    return await ProductService.create_product(db, product_in)

@router.get("/categories/", response_model=List[CategoryResponse])
async def get_categories(business_id: int, db: AsyncSession = Depends(get_db)):
    return await ProductService.get_categories(db, business_id)
