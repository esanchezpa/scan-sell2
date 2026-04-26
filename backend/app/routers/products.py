import os
import uuid
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.schemas.products import ProductCreate, ProductUpdate, ProductResponse, CategoryResponse, BarcodeExistsResponse
from app.schemas.barcode import ProductReactivateRequest
from app.services.products import ProductService

router = APIRouter(prefix="/products", tags=["products"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


@router.get("/", response_model=List[ProductResponse])
async def get_products(
    business_id: int,
    store_id: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    return await ProductService.get_all_products(db, business_id, store_id=store_id)


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


@router.get("/barcode-exists/{barcode}", response_model=BarcodeExistsResponse)
async def barcode_exists(barcode: str, business_id: int, db: AsyncSession = Depends(get_db)):
    info = await ProductService.get_barcode_info(db, business_id, barcode)
    return BarcodeExistsResponse(**info)


@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Extension not allowed: {ext}")

    images_dir = Path(settings.images_dir)
    images_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4().hex}{ext}"
    file_path = images_dir / filename

    with file_path.open("wb") as f:
        content = await file.read()
        f.write(content)

    image_url = f"/images/{filename}"
    return {"image_url": image_url}


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(product_in: ProductCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await ProductService.create_product(db, product_in)
    except ValueError as e:
        error_msg = str(e)
        if error_msg == "PRODUCT_ALREADY_EXISTS":
            raise HTTPException(status_code=409, detail="PRODUCT_ALREADY_EXISTS")
        elif error_msg.startswith("PRODUCT_INACTIVE_EXISTS:"):
            product_id = error_msg.split(":")[1]
            raise HTTPException(status_code=409, detail=f"PRODUCT_INACTIVE_EXISTS:{product_id}")
        elif error_msg == "STORE_NOT_FOUND":
            raise HTTPException(status_code=400, detail="STORE_NOT_FOUND")
        elif error_msg == "STOCK_CANNOT_BE_NEGATIVE":
            raise HTTPException(status_code=400, detail="STOCK_CANNOT_BE_NEGATIVE")
        else:
            raise


@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(product_id: int, product_in: ProductUpdate, db: AsyncSession = Depends(get_db)):
    try:
        product = await ProductService.update_product(db, product_id, product_in)
    except ValueError as e:
        if str(e) == "STOCK_CANNOT_BE_NEGATIVE":
            raise HTTPException(status_code=400, detail="STOCK_CANNOT_BE_NEGATIVE")
        raise
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.delete("/{product_id}")
async def delete_product(product_id: int, db: AsyncSession = Depends(get_db)):
    success = await ProductService.delete_product(db, product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"ok": True}


@router.post("/{product_id}/reactivate", response_model=ProductResponse)
async def reactivate_product(product_id: int, db: AsyncSession = Depends(get_db)):
    product = await ProductService.reactivate_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.patch("/{product_id}/reactivate", response_model=ProductResponse)
async def reactivate_and_update_product(
    product_id: int,
    body: ProductReactivateRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        product = await ProductService.reactivate_and_update(
            db,
            product_id,
            business_id=body.business_id,
            store_id=body.store_id,
            name=body.name,
            description=body.description,
            category=body.category,
            category_id=body.category_id,
            price=body.price,
            cost=body.cost,
            image_url=body.image_url,
            low_stock_threshold=body.low_stock_threshold,
            stock_quantity=body.stock_quantity,
        )
    except ValueError as e:
        error_msg = str(e)
        if error_msg == "STORE_NOT_FOUND":
            raise HTTPException(status_code=400, detail="Store does not belong to business")
        if error_msg == "PRODUCT_BUSINESS_MISMATCH":
            raise HTTPException(status_code=404, detail="Product not found")
        if error_msg == "CATEGORY_NOT_FOUND":
            raise HTTPException(status_code=400, detail="Category does not belong to business")
        if error_msg == "STOCK_CANNOT_BE_NEGATIVE":
            raise HTTPException(status_code=400, detail="STOCK_CANNOT_BE_NEGATIVE")
        raise
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.get("/categories/", response_model=List[CategoryResponse])
async def get_categories(business_id: int, db: AsyncSession = Depends(get_db)):
    return await ProductService.get_categories(db, business_id)
