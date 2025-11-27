"""Pydantic schemas for API responses."""
from typing import Any, List, Literal, Optional

from pydantic import BaseModel


SegmentName = Literal["All", "Hesitant", "Impulsive", "Collector"]
EventMetric = Literal["view", "addtocart", "transaction"]


class SegmentSummary(BaseModel):
    segment: SegmentName
    user_count: int


class TopEntity(BaseModel):
    entity_id: int
    label: str
    metric: EventMetric
    value: int


class FunnelStage(BaseModel):
    stage: str
    count: int
    percentage: float


class TimeSeriesPoint(BaseModel):
    period: str
    value: float


class DrilldownSeries(BaseModel):
    label: str
    data: List[TimeSeriesPoint]


class ConversionRates(BaseModel):
    view_to_cart: float
    cart_to_purchase: float
    view_to_purchase: float


class HourlyDistribution(BaseModel):
    hour: int
    count: int


class DrilldownResponse(BaseModel):
    entity_id: int
    entity_label: str
    segment: SegmentName
    summary: dict[str, int]
    series: List[DrilldownSeries]
    conversion_rates: ConversionRates
    hourly_distribution: List[HourlyDistribution]
    funnel: List[FunnelStage]


class FunnelStageDetailResponse(BaseModel):
    stage: str
    stage_label: str
    segment: SegmentName
    count: int
    percentage: float
    time_series: List[DrilldownSeries]
    hourly_distribution: List[HourlyDistribution]
    top_items: List[TopEntity]
    top_categories: List[TopEntity]
    user_segment_distribution: dict[str, int]
    dropoff_analysis: Optional[dict[str, Any]] = None  # 流失分析（如果不是第一阶段）


class ActiveHourDetailResponse(BaseModel):
    hour: int
    segment: SegmentName
    total_count: int
    percentage_of_day: float
    event_distribution: dict[str, int]  # 事件类型分布
    conversion_rates: ConversionRates
    funnel: List[FunnelStage]
    time_series: List[DrilldownSeries]  # 周度趋势
    top_items: List[TopEntity]
    top_categories: List[TopEntity]
    user_segment_distribution: dict[str, int]
    comparison: dict[str, Any]  # 与相邻时间段和平均值的对比


class MonthlyRetentionPoint(BaseModel):
    cohort_month: str  # 用户首次访问的月份
    month_diff: int  # 距离首次访问的月数差（0表示首月）
    user_count: int  # 该月留存用户数
    cohort_size: int  # 该cohort的总用户数
    retention_rate: float  # 留存率（百分比）
    actual_month: str  # 实际月份（cohort_month + month_diff）
    monthly_active_users: int  # 该实际月份的总活跃用户数（去重）


class WeekdayUserPoint(BaseModel):
    weekday: int  # 星期几（1=周一，2=周二，...7=周日）
    weekday_name: str  # 星期几名称
    user_count: int  # 该星期几的用户数


class WeekdayUsersResponse(BaseModel):
    data: List[WeekdayUserPoint]  # 周一到周日的用户数据
    weekday_avg: float  # 工作日（周一到周五）的平均用户数
    weekend_avg: float  # 周末（周六、周日）的平均用户数


class CohortDetailResponse(BaseModel):
    cohort_month: str  # Cohort月份（如 '2024-01'）
    cohort_size: int  # Cohort的总用户数
    current_active_users: int  # 当前活跃用户数
    current_retention_rate: float  # 当前留存率（百分比）
    segment: SegmentName
    summary: dict[str, int]  # 事件统计
    series: List[DrilldownSeries]  # 时间序列数据
    conversion_rates: ConversionRates  # 转化率
    hourly_distribution: List[HourlyDistribution]  # 活跃时间段分布
    funnel: List[FunnelStage]  # 转化漏斗
    user_segment_distribution: dict[str, int]  # 用户细分群体分布

