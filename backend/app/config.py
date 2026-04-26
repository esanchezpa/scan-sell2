"""
VentaFácil — Application Configuration
Reads environment variables from .env via pydantic-settings.
"""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file="../.env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database
    database_url: str = "postgresql+psycopg://user:password@localhost:5432/ventafacil_dev"

    # Redis (optional)
    redis_url: str = "redis://localhost:6379/0"

    # App
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    app_env: str = "development"

    # CORS
    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    # Auth
    jwt_secret_key: str = "change_me_in_production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60

    # External APIs
    openfoodfacts_base_url: str = "https://world.openfoodfacts.org/api/v2"

    # Images
    images_dir: str = "images_prod"

    # OpenFoodFacts
    openfoodfacts_base_url: str = "https://world.openfoodfacts.org/api/v2"
    openfoodfacts_timeout: int = 5000

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
