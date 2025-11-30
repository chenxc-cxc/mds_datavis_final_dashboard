import api from "./client";
import type {
  ActiveHourDetailPayload,
  ActiveHourPoint,
  CohortDetailPayload,
  DrilldownPayload,
  EventCounts,
  EventMetric,
  FunnelStage,
  FunnelStageDetailPayload,
  MonthlyRetentionPoint,
  SegmentName,
  SegmentSummary,
  TopEntity,
  WeekdayDetailPayload,
  WeekdayUsersResponse,
} from "./types";

export const fetchSegments = async () => {
  const { data } = await api.get<SegmentSummary[]>("/segments");
  return data;
};

export const fetchTopItems = async (
  params: {
    segment: SegmentName;
    metric: EventMetric;
    limit: number;
    date_from?: string | null;
    date_to?: string | null;
  } = {
    segment: "All",
    metric: "transaction",
    limit: 10,
  }
) => {
  const { data } = await api.get<TopEntity[]>("/top-items", { params });
  return data;
};

export const fetchTopCategories = async (params: {
  segment: SegmentName;
  metric: EventMetric;
  limit: number;
  date_from?: string | null;
  date_to?: string | null;
}) => {
  const { data } = await api.get<TopEntity[]>("/top-categories", { params });
  return data;
};

export const fetchFunnel = async (
  segment: SegmentName,
  date_from?: string | null,
  date_to?: string | null
) => {
  const { data } = await api.get<FunnelStage[]>("/funnel", {
    params: { segment, date_from, date_to },
  });
  return data;
};

export const fetchEventCounts = async (
  segment: SegmentName,
  date_from?: string | null,
  date_to?: string | null
) => {
  const { data } = await api.get<EventCounts>("/event-counts", {
    params: { segment, date_from, date_to },
  });
  return data;
};

export const fetchActiveHours = async (
  segment: SegmentName,
  date_from?: string | null,
  date_to?: string | null
) => {
  const { data } = await api.get<ActiveHourPoint[]>("/active-hours", {
    params: { segment, date_from, date_to },
  });
  return data;
};

export const fetchDrilldown = async (
  entityType: "item" | "category",
  entityId: number,
  segment: SegmentName,
  date_from?: string | null,
  date_to?: string | null
) => {
  const { data } = await api.get<DrilldownPayload>(`/drilldown/${entityType}/${entityId}`, {
    params: { segment, date_from, date_to },
  });
  return data;
};

export const fetchFunnelStageDetail = async (
  stage: "view" | "addtocart" | "transaction",
  segment: SegmentName,
  topN: number = 10,
  date_from?: string | null,
  date_to?: string | null
) => {
  const { data } = await api.get<FunnelStageDetailPayload>(`/funnel-stage/${stage}`, {
    params: { segment, top_n: topN, date_from, date_to },
  });
  return data;
};

export const fetchActiveHourDetail = async (
  hour: number,
  segment: SegmentName,
  topN: number = 10,
  date_from?: string | null,
  date_to?: string | null
) => {
  const { data } = await api.get<ActiveHourDetailPayload>(`/active-hour/${hour}`, {
    params: { segment, top_n: topN, date_from, date_to },
  });
  return data;
};

export const fetchMonthlyRetention = async (
  segment: SegmentName,
  date_from?: string | null,
  date_to?: string | null
) => {
  const { data } = await api.get<MonthlyRetentionPoint[]>("/monthly-retention", {
    params: { segment, date_from, date_to },
  });
  return data;
};

export const fetchWeekdayUsers = async (
  segment: SegmentName,
  date_from?: string | null,
  date_to?: string | null
) => {
  const { data } = await api.get<WeekdayUsersResponse>("/weekday-users", {
    params: { segment, date_from, date_to },
  });
  return data;
};

export const fetchCohortDetail = async (
  cohortMonth: string,
  segment: SegmentName,
  date_from?: string | null,
  date_to?: string | null
) => {
  const { data } = await api.get<CohortDetailPayload>(`/cohort-detail/${cohortMonth}`, {
    params: { segment, date_from, date_to },
  });
  return data;
};

export const fetchWeekdayDetail = async (
  weekday: number,
  segment: SegmentName,
  topN: number = 10,
  date_from?: string | null,
  date_to?: string | null
) => {
  const { data } = await api.get<WeekdayDetailPayload>(`/weekday-detail/${weekday}`, {
    params: { segment, top_n: topN, date_from, date_to },
  });
  return data;
};

