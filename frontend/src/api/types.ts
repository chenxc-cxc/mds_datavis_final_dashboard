export type SegmentName = "All" | "Hesitant" | "Impulsive" | "Collector";

export type EventMetric = "view" | "addtocart" | "transaction";

export interface SegmentSummary {
  segment: SegmentName;
  user_count: number;
}

export interface TopEntity {
  entity_id: number;
  label: string;
  metric: EventMetric;
  value: number;
}

export interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
}

export interface ActiveHourPoint {
  hour: number;
  value: number;
}

export interface EventCounts {
  [key: string]: number;
}

export interface DrilldownSeriesPoint {
  period: string;
  value: number;
}

export interface DrilldownSeries {
  label: string;
  data: DrilldownSeriesPoint[];
}

export interface ConversionRates {
  view_to_cart: number;
  cart_to_purchase: number;
  view_to_purchase: number;
}

export interface HourlyDistribution {
  hour: number;
  count: number;
}

export interface DrilldownPayload {
  entity_id: number;
  entity_label: string;
  segment: SegmentName;
  summary: Record<string, number>;
  series: DrilldownSeries[];
  conversion_rates: ConversionRates;
  hourly_distribution: HourlyDistribution[];
  funnel: FunnelStage[];
}

export interface FunnelStageDetailPayload {
  stage: string;
  stage_label: string;
  segment: SegmentName;
  count: number;
  percentage: number;
  time_series: DrilldownSeries[];
  hourly_distribution: HourlyDistribution[];
  top_items: TopEntity[];
  top_categories: TopEntity[];
  user_segment_distribution: Record<string, number>;
  dropoff_analysis?: {
    from_stage: string;
    to_stage: string;
    from_count: number;
    to_count: number;
    dropoff_count: number;
    dropoff_rate: number;
    conversion_rate: number;
  };
}

export interface ActiveHourDetailPayload {
  hour: number;
  segment: SegmentName;
  total_count: number;
  percentage_of_day: number;
  event_distribution: Record<string, number>;
  conversion_rates: ConversionRates;
  funnel: FunnelStage[];
  time_series: DrilldownSeries[];
  top_items: TopEntity[];
  top_categories: TopEntity[];
  user_segment_distribution: Record<string, number>;
  comparison: {
    prev_hour: {
      hour: number;
      count: number;
      diff: number;
      diff_percentage: number;
    };
    next_hour: {
      hour: number;
      count: number;
      diff: number;
      diff_percentage: number;
    };
    average: {
      count: number;
      diff: number;
      diff_percentage: number;
    };
    is_peak: boolean;
    is_valley: boolean;
  };
}

export interface MonthlyRetentionPoint {
  cohort_month: string; // 用户首次访问的月份
  month_diff: number; // 距离首次访问的月数差（0表示首月）
  user_count: number; // 该月留存用户数
  cohort_size: number; // 该cohort的总用户数
  retention_rate: number; // 留存率（百分比）
  actual_month: string; // 实际月份（cohort_month + month_diff）
  monthly_active_users: number; // 该实际月份的总活跃用户数（去重）
}

export interface WeekdayUserPoint {
  weekday: number; // 星期几（1=周一，2=周二，...7=周日）
  weekday_name: string; // 星期几名称
  user_count: number; // 该星期几的用户数
}

export interface WeekdayUsersResponse {
  data: WeekdayUserPoint[]; // 周一到周日的用户数据
  weekday_avg: number; // 工作日（周一到周五）的平均用户数
  weekend_avg: number; // 周末（周六、周日）的平均用户数
}

export interface CohortDetailPayload {
  cohort_month: string; // Cohort月份（如 '2024-01'）
  cohort_size: number; // Cohort的总用户数
  current_active_users: number; // 当前活跃用户数
  current_retention_rate: number; // 当前留存率（百分比）
  segment: SegmentName;
  summary: Record<string, number>; // 事件统计
  series: DrilldownSeries[]; // 时间序列数据
  conversion_rates: ConversionRates; // 转化率
  hourly_distribution: HourlyDistribution[]; // 活跃时间段分布
  funnel: FunnelStage[]; // 转化漏斗
  user_segment_distribution: Record<string, number>; // 用户细分群体分布
}

