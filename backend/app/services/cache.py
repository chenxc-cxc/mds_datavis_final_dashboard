"""Redis cache helpers (gracefully degrade when Redis is unavailable)."""
from __future__ import annotations

import json
import logging
from typing import Any, Optional

import redis.asyncio as redis
from redis.exceptions import ConnectionError as RedisConnectionError

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()
_redis: Optional[redis.Redis] = None
_redis_available: bool = True


def get_redis_client() -> Optional[redis.Redis]:
    global _redis, _redis_available
    if not _redis_available:
        return None
    if _redis is None:
        _redis = redis.from_url(settings.redis_url, encoding="utf-8", decode_responses=True)
    return _redis


async def cache_get(key: str) -> Optional[Any]:
    client = get_redis_client()
    if client is None:
        return None
    try:
        raw = await client.get(key)
    except RedisConnectionError as exc:
        logger.warning("Redis unavailable for GET (%s). Continuing without cache.", exc)
        _disable_cache()
        return None
    if raw is None:
        return None
    return json.loads(raw)


async def cache_set(key: str, value: Any, ttl: Optional[int] = None) -> None:
    client = get_redis_client()
    if client is None:
        return
    try:
        await client.set(key, json.dumps(value), ex=ttl or settings.cache_ttl_seconds)
    except RedisConnectionError as exc:
        logger.warning("Redis unavailable for SET (%s). Continuing without cache.", exc)
        _disable_cache()


def cache_key(prefix: str, **kwargs: Any) -> str:
    parts = [prefix] + [f"{k}={v}" for k, v in sorted(kwargs.items())]
    return "|".join(parts)


def _disable_cache() -> None:
    global _redis, _redis_available
    _redis = None
    _redis_available = False

