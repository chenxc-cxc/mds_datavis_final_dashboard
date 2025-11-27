"""Application configuration."""
from functools import lru_cache
from pathlib import Path
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    project_name: str = "Ecommerce Analytics API"
    api_prefix: str = "/api"
    data_source: Path = Field(
        default=Path(__file__).resolve().parents[2] / "cache" / "events_with_category.parquet"
    )
    fallback_csv: Path = Field(
        default=Path(__file__).resolve().parents[2] / "archive" / "events_with_category.csv"
    )
    duckdb_path: Path = Field(
        default=Path(__file__).resolve().parents[2] / "cache" / "events.duckdb"
    )
    redis_url: str = Field(default="redis://localhost:6379/0")
    cache_ttl_seconds: int = 300
    default_top_n: int = 10
    allowed_segments: tuple[str, ...] = ("All", "Hesitant", "Impulsive", "Collector")

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()

