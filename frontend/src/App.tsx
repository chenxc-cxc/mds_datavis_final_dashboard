import { useState, useCallback } from "react";
import { Layout, Typography, Spin } from "antd";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import type { Dayjs } from "dayjs";
import {
  fetchActiveHours,
  fetchEventCounts,
  fetchFunnel,
  fetchMonthlyRetention,
  fetchSegments,
  fetchTopCategories,
  fetchTopItems,
  fetchWeekdayUsers,
} from "./api/endpoints";
import type { EventMetric, SegmentName, TopEntity } from "./api/types";
import { FilterBar } from "./components/FilterBar";
import { ChartCard } from "./components/ChartCard";
import { BarChart } from "./components/charts/BarChart";
import { FunnelChart } from "./components/charts/FunnelChart";
import { CUHKSZIcon } from "./components/CUHKSZIcon";
import { CUHKSZBackground } from "./components/CUHKSZBackground";
import { LineChart } from "./components/charts/LineChart";
import { RetentionChart } from "./components/charts/RetentionChart";
import { WeekdayUserChart } from "./components/charts/WeekdayUserChart";
import { MetricsGrid } from "./components/MetricsGrid";
import { DrilldownDrawer } from "./components/DrilldownDrawer";
import { FunnelStageDrawer } from "./components/FunnelStageDrawer";
import { ActiveHourDrawer } from "./components/ActiveHourDrawer";
import { CohortDetailDrawer } from "./components/CohortDetailDrawer";
import { WeekdayDetailDrawer } from "./components/WeekdayDetailDrawer";
import { DraggableGrid } from "./components/DraggableGrid";
import { ParticlesBackground } from "./components/ParticlesBackground";
import { DateRangePicker } from "./components/DateRangePicker";
import { RefreshIndicator } from "./components/RefreshIndicator";

const { Header, Content } = Layout;

function App() {
  const [segment, setSegment] = useState<SegmentName>("All");
  const [metric, setMetric] = useState<EventMetric>("transaction");
  const [topN, setTopN] = useState(10);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [drill, setDrill] = useState<{ type: "item" | "category"; id: number } | null>(null);
  const [funnelStage, setFunnelStage] = useState<"view" | "addtocart" | "transaction" | null>(null);
  const [activeHour, setActiveHour] = useState<number | null>(null);
  const [cohortMonth, setCohortMonth] = useState<string | null>(null);
  const [selectedWeekday, setSelectedWeekday] = useState<number | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  const queryClient = useQueryClient();

  const { data: segmentsSummary } = useQuery({
    queryKey: ["segments"],
    queryFn: fetchSegments,
  });

  const dateFrom = dateRange?.[0]?.format("YYYY-MM-DD") || null;
  const dateTo = dateRange?.[1]?.format("YYYY-MM-DD") || null;

  const {
    data: topItems,
    isLoading: loadingItems,
    dataUpdatedAt: topItemsUpdatedAt,
  } = useQuery({
    queryKey: ["top-items", segment, metric, topN, dateFrom, dateTo],
    queryFn: () => fetchTopItems({ segment, metric, limit: topN, date_from: dateFrom, date_to: dateTo }),
  });

  const {
    data: topCategories,
    isLoading: loadingCategories,
    dataUpdatedAt: topCategoriesUpdatedAt,
  } = useQuery({
    queryKey: ["top-categories", segment, metric, topN, dateFrom, dateTo],
    queryFn: () => fetchTopCategories({ segment, metric, limit: topN, date_from: dateFrom, date_to: dateTo }),
  });

  const { data: funnelData, dataUpdatedAt: funnelUpdatedAt } = useQuery({
    queryKey: ["funnel", segment, dateFrom, dateTo],
    queryFn: () => fetchFunnel(segment, dateFrom, dateTo),
  });

  const { data: eventCounts, dataUpdatedAt: eventCountsUpdatedAt } = useQuery({
    queryKey: ["event-counts", segment, dateFrom, dateTo],
    queryFn: () => fetchEventCounts(segment, dateFrom, dateTo),
  });

  const { data: activeHours, dataUpdatedAt: activeHoursUpdatedAt } = useQuery({
    queryKey: ["active-hours", segment, dateFrom, dateTo],
    queryFn: () => fetchActiveHours(segment, dateFrom, dateTo),
  });

  const {
    data: monthlyRetention,
    dataUpdatedAt: monthlyRetentionUpdatedAt,
    isLoading: loadingRetention,
  } = useQuery({
    queryKey: ["monthly-retention", segment, dateFrom, dateTo],
    queryFn: () => fetchMonthlyRetention(segment, dateFrom, dateTo),
  });

  const {
    data: weekdayUsers,
    dataUpdatedAt: weekdayUsersUpdatedAt,
    isLoading: loadingWeekdayUsers,
  } = useQuery({
    queryKey: ["weekday-users", segment, dateFrom, dateTo],
    queryFn: () => fetchWeekdayUsers(segment, dateFrom, dateTo),
  });

  const latestUpdate = Math.max(
    topItemsUpdatedAt || 0,
    topCategoriesUpdatedAt || 0,
    funnelUpdatedAt || 0,
    eventCountsUpdatedAt || 0,
    activeHoursUpdatedAt || 0,
    monthlyRetentionUpdatedAt || 0,
    weekdayUsersUpdatedAt || 0
  );

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries();
    setLastRefreshTime(new Date());
  }, [queryClient]);

  const activeHourCategories = activeHours?.map((h) => `${h.hour}:00`) ?? [];
  const activeHourValues = activeHours?.map((h) => h.value) ?? [];

  const handleBarClick = (entities: TopEntity[] | undefined, type: "item" | "category") => {
    return (payload: { index: number }) => {
      const target = entities?.[payload.index];
      if (target) {
        setDrill({ type, id: target.entity_id });
      }
    };
  };

  const isRefreshing = loadingItems || loadingCategories;

  return (
    <Layout className="min-h-screen bg-transparent relative">
      <ParticlesBackground />
      <CUHKSZBackground />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        <Header className="glass border-b border-glass-border shadow-none px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="-mt-12"
            >
              <Typography.Title level={2} className="!text-slate-800 !mb-1 text-gradient">
                <span className="inline-flex items-center gap-3">
                  <CUHKSZIcon size={48} />
                  电商智能分析看板
                </span>
              </Typography.Title>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="hidden md:flex"
            >
              <RefreshIndicator
                lastUpdated={lastRefreshTime || (latestUpdate ? new Date(latestUpdate) : null)}
                isRefreshing={isRefreshing}
                onRefresh={handleRefresh}
              />
            </motion.div>
          </div>
        </Header>
        <Content className="px-6 pb-12 pt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <FilterBar
              segment={segment}
              onSegmentChange={setSegment}
              metric={metric}
              onMetricChange={setMetric}
              topN={topN}
              onTopNChange={setTopN}
              segmentsSummary={segmentsSummary}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6"
          >
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
            />
          </motion.div>

        <DraggableGrid>
      <div>
            <MetricsGrid metrics={eventCounts ?? {}} />
      </div>
          <ChartCard
            title="Top 商品榜"
            subtitle="支持点击查看 Drill-down 明细"
            glowColor="primary"
            chartId="top-items-chart"
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ["top-items"] })}
            isRefreshing={loadingItems}
          >
            {loadingItems ? (
              <Spin size="large" />
            ) : (
              <BarChart
                categories={topItems?.map((item) => item.label) ?? []}
                values={topItems?.map((item) => item.value) ?? []}
                horizontal
                onBarClick={handleBarClick(topItems, "item")}
              />
            )}
          </ChartCard>
          <ChartCard
            title="Top 品类榜"
            subtitle="洞察热门品类表现，支持 Drill-down"
            glowColor="accent"
            chartId="top-categories-chart"
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ["top-categories"] })}
            isRefreshing={loadingCategories}
          >
            {loadingCategories ? (
              <Spin size="large" />
            ) : (
              <BarChart
                categories={topCategories?.map((item) => item.label) ?? []}
                values={topCategories?.map((item) => item.value) ?? []}
                color="#ec4899"
                horizontal
                onBarClick={handleBarClick(topCategories, "category")}
              />
            )}
          </ChartCard>
          <ChartCard
            title="转换率漏斗"
            subtitle="点击阶段查看详细分析"
            glowColor="secondary"
            chartId="funnel-chart"
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ["funnel"] })}
          >
            {funnelData ? (
              <FunnelChart
                data={funnelData}
                onStageClick={(stage) => setFunnelStage(stage as "view" | "addtocart" | "transaction")}
              />
            ) : (
              <Spin size="large" />
            )}
          </ChartCard>
          <ChartCard
            title="用户活跃时间段"
            subtitle="点击时间段查看详细分析"
            glowColor="success"
            chartId="active-hours-chart"
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ["active-hours"] })}
          >
            {activeHours ? (
              <LineChart
                categories={activeHourCategories}
                values={activeHourValues}
                onHourClick={(hour) => setActiveHour(hour)}
              />
            ) : (
              <Spin size="large" />
            )}
          </ChartCard>
          <ChartCard
            title="用户留存率（月度）"
            subtitle="点击图例或折线查看 Cohort 详情"
            glowColor="accent"
            chartId="monthly-retention-chart"
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ["monthly-retention"] })}
            isRefreshing={loadingRetention}
          >
            {loadingRetention ? (
              <Spin size="large" />
            ) : (
              <RetentionChart
                data={monthlyRetention || []}
                onCohortClick={(cohortMonth) => setCohortMonth(cohortMonth)}
              />
            )}
          </ChartCard>
          <ChartCard
            title="周一到周日用户数"
            subtitle="点击柱状图查看该天的详细分析"
            glowColor="success"
            chartId="weekday-users-chart"
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ["weekday-users"] })}
            isRefreshing={loadingWeekdayUsers}
          >
            {loadingWeekdayUsers ? (
              <Spin size="large" />
            ) : (
              <WeekdayUserChart 
                data={weekdayUsers || null}
                onWeekdayClick={(weekday) => setSelectedWeekday(weekday)}
              />
            )}
          </ChartCard>
        </DraggableGrid>
        </Content>
      </motion.div>

      <DrilldownDrawer
        open={!!drill}
        entityId={drill?.id ?? null}
        entityType={drill?.type ?? null}
        segment={segment}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onClose={() => setDrill(null)}
      />

      <FunnelStageDrawer
        open={!!funnelStage}
        stage={funnelStage}
        segment={segment}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onClose={() => setFunnelStage(null)}
      />

      <ActiveHourDrawer
        open={activeHour !== null}
        hour={activeHour}
        segment={segment}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onClose={() => setActiveHour(null)}
      />

      <CohortDetailDrawer
        open={cohortMonth !== null}
        cohortMonth={cohortMonth}
        segment={segment}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onClose={() => setCohortMonth(null)}
      />

      <WeekdayDetailDrawer
        open={selectedWeekday !== null}
        weekday={selectedWeekday}
        segment={segment}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onClose={() => setSelectedWeekday(null)}
      />
    </Layout>
  );
}

export default App;
