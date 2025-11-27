"""Metrics and analytics endpoints."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.core.config import get_settings
from app.models.schemas import ActiveHourDetailResponse, CohortDetailResponse, DrilldownResponse, EventMetric, FunnelStageDetailResponse, MonthlyRetentionPoint, SegmentName, TopEntity, WeekdayUsersResponse
from app.services.cache import cache_get, cache_key, cache_set
from app.services.data_service import get_data_service

router = APIRouter(tags=["metrics"])
settings = get_settings()
service = get_data_service()


@router.get("/segments")
async def get_segments():
    key = cache_key("segments")
    cached = await cache_get(key)
    if cached:
        return cached
    data = service.get_segments()
    await cache_set(key, data)
    return data


@router.get("/top-items")
async def top_items(
    segment: SegmentName = Query("All"),
    metric: EventMetric = Query("transaction"),
    limit: int = Query(settings.default_top_n, ge=3, le=30),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
):
    key = cache_key("top-items", segment=segment, metric=metric, limit=limit, date_from=date_from, date_to=date_to)
    cached = await cache_get(key)
    if cached:
        return cached
    data = service.get_top_entities(segment, metric, "item", limit, date_from, date_to)
    await cache_set(key, data)
    return data


@router.get("/top-categories")
async def top_categories(
    segment: SegmentName = Query("All"),
    metric: EventMetric = Query("transaction"),
    limit: int = Query(settings.default_top_n, ge=3, le=30),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
):
    key = cache_key("top-categories", segment=segment, metric=metric, limit=limit, date_from=date_from, date_to=date_to)
    cached = await cache_get(key)
    if cached:
        return cached
    data = service.get_top_entities(segment, metric, "category", limit, date_from, date_to)
    await cache_set(key, data)
    return data


@router.get("/funnel")
async def funnel(
    segment: SegmentName = Query("All"),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
):
    key = cache_key("funnel", segment=segment, date_from=date_from, date_to=date_to)
    cached = await cache_get(key)
    if cached:
        return cached
    data = service.get_funnel(segment, date_from, date_to)
    await cache_set(key, data)
    return data


@router.get("/event-counts")
async def event_counts(
    segment: SegmentName = Query("All"),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
):
    key = cache_key("event-counts", segment=segment, date_from=date_from, date_to=date_to)
    cached = await cache_get(key)
    if cached:
        return cached
    data = service.get_event_counts(segment, date_from, date_to)
    await cache_set(key, data)
    return data


@router.get("/active-hours")
async def active_hours(
    segment: SegmentName = Query("All"),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
):
    key = cache_key("active-hours", segment=segment, date_from=date_from, date_to=date_to)
    cached = await cache_get(key)
    if cached:
        return cached
    data = service.get_active_hours(segment, date_from, date_to)
    await cache_set(key, data)
    return data


@router.get("/drilldown/{entity_type}/{entity_id}", response_model=DrilldownResponse)
async def drilldown(
    entity_type: str,
    entity_id: int,
    segment: SegmentName = Query("All"),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
):
    if entity_type not in {"item", "category"}:
        raise HTTPException(status_code=400, detail="entity_type must be 'item' or 'category'")
    key = cache_key("drilldown", entity_type=entity_type, entity_id=entity_id, segment=segment, date_from=date_from, date_to=date_to)
    cached = await cache_get(key)
    if cached:
        return cached
    data = service.get_drilldown(entity_type, entity_id, segment, date_from, date_to)
    await cache_set(key, data)
    return data


@router.get("/funnel-stage/{stage}", response_model=FunnelStageDetailResponse)
async def funnel_stage_detail(
    stage: str,
    segment: SegmentName = Query("All"),
    top_n: int = Query(10, ge=5, le=20),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
):
    if stage not in {"view", "addtocart", "transaction"}:
        raise HTTPException(
            status_code=400, detail="stage must be 'view', 'addtocart', or 'transaction'"
        )
    key = cache_key("funnel-stage", stage=stage, segment=segment, top_n=top_n, date_from=date_from, date_to=date_to)
    cached = await cache_get(key)
    if cached:
        return cached
    data = service.get_funnel_stage_detail(stage, segment, top_n, date_from, date_to)
    await cache_set(key, data)
    return data


@router.get("/active-hour/{hour}", response_model=ActiveHourDetailResponse)
async def active_hour_detail(
    hour: int,
    segment: SegmentName = Query("All"),
    top_n: int = Query(10, ge=5, le=20),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
):
    if hour < 0 or hour > 23:
        raise HTTPException(status_code=400, detail="hour must be between 0 and 23")
    key = cache_key("active-hour", hour=hour, segment=segment, top_n=top_n, date_from=date_from, date_to=date_to)
    cached = await cache_get(key)
    if cached:
        return cached
    data = service.get_active_hour_detail(hour, segment, top_n, date_from, date_to)
    await cache_set(key, data)
    return data


@router.get("/monthly-retention", response_model=list[MonthlyRetentionPoint])
async def monthly_retention(
    segment: SegmentName = Query("All"),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
):
    key = cache_key("monthly-retention", segment=segment, date_from=date_from, date_to=date_to)
    cached = await cache_get(key)
    if cached:
        return cached
    data = service.get_monthly_retention(segment, date_from, date_to)
    await cache_set(key, data)
    return data


@router.get("/weekday-users", response_model=WeekdayUsersResponse)
async def weekday_users(
    segment: SegmentName = Query("All"),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
):
    key = cache_key("weekday-users", segment=segment, date_from=date_from, date_to=date_to)
    cached = await cache_get(key)
    if cached:
        return cached
    data = service.get_weekday_users(segment, date_from, date_to)
    await cache_set(key, data)
    return data


@router.get("/cohort-detail/{cohort_month}", response_model=CohortDetailResponse)
async def cohort_detail(
    cohort_month: str,
    segment: SegmentName = Query("All"),
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
):
    """获取指定cohort的详细分析数据
    
    Args:
        cohort_month: cohort月份，格式为 'YYYY-MM' (如 '2024-01')
    """
    key = cache_key("cohort-detail", cohort_month=cohort_month, segment=segment, date_from=date_from, date_to=date_to)
    cached = await cache_get(key)
    if cached:
        return cached
    try:
        data = service.get_cohort_detail(cohort_month, segment, date_from, date_to)
        await cache_set(key, data)
        return data
    except ValueError as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=str(e))

