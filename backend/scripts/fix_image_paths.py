import asyncio
import sys
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import text

async def fix():
    engine = create_async_engine('postgresql+psycopg://ventafacil_user:123@127.0.0.1:5432/ventafacil_dev')
    async_session = async_sessionmaker(engine)
    async with async_session() as session:
        result = await session.execute(text(
            "UPDATE products SET image_url = REPLACE(image_url, 'http://localhost:8000/images_prod', '/images') "
            "WHERE image_url LIKE 'http://localhost:8000/images_prod%'"
        ))
        result2 = await session.execute(text(
            "UPDATE products SET image_url = REPLACE(image_url, 'http://localhost:8000/images', '/images') "
            "WHERE image_url LIKE 'http://localhost:8000/images%'"
        ))
        result3 = await session.execute(text(
            "UPDATE products SET image_url = REPLACE(image_url, '/images_prod', '/images') "
            "WHERE image_url LIKE '/images_prod%'"
        ))
        await session.commit()
        print(f'Updated {result.rowcount} full URLs from images_prod, {result2.rowcount} full URLs from images, {result3.rowcount} path URLs')

        # Verify
        result4 = await session.execute(text("SELECT id, name, image_url FROM products WHERE image_url IS NOT NULL"))
        for row in result4.fetchall():
            print(f'  Product {row[0]}: {row[2]}')
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(fix())