import { Drawer, Spin, Statistic, Row, Col, Empty, Alert, Tag, Badge } from "antd";
import ReactECharts from "echarts-for-react";
import { useQuery } from "@tanstack/react-query";
import { fetchWeekdayDetail } from "../api/endpoints";
import type { SegmentName } from "../api/types";
import { BarChart } from "./charts/BarChart";
import { FunnelChart } from "./charts/FunnelChart";
import { useResizableDrawer } from "../hooks/useResizableDrawer";

type Props = {
  open: boolean;
  weekday: number | null; // 1=周一，2=周二，...7=周日
  segment: SegmentName;
  dateFrom?: string | null;
  dateTo?: string | null;
  onClose: () => void;
};

const eventLabels: Record<string, string> = {
  view: "浏览",
  addtocart: "加购",
  transaction: "购买",
};

// 定义固定的用户群体顺序：All, Hesitant, Impulsive, Collector
const segmentOrder: string[] = ["All", "Hesitant", "Impulsive", "Collector"];

export function WeekdayDetailDrawer({ open, weekday, segment, dateFrom, dateTo, onClose }: Props) {
  const { width, ResizeHandle } = useResizableDrawer({ defaultWidth: 700, minWidth: 400, maxWidth: 1200 });
  
  const { data, isLoading, error } = useQuery({
    queryKey: ["weekday-detail", weekday, segment, dateFrom, dateTo],
    queryFn: () => fetchWeekdayDetail(weekday!, segment, 10, dateFrom, dateTo),
    enabled: open && weekday !== null,
  });

  // 时间趋势图配置
  const timeSeriesOption = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(26, 31, 58, 0.95)",
      borderColor: "rgba(0, 212, 255, 0.5)",
      borderWidth: 1,
      textStyle: { color: "#e2e8f0" },
    },
    grid: { left: 50, right: 30, top: 30, bottom: 50 },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: data?.time_series?.[0]?.data?.map((point) => point.period) ?? [],
      axisLabel: { color: "#94a3b8", fontSize: 11 },
      axisLine: { lineStyle: { color: "rgba(0, 212, 255, 0.2)" } },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "#94a3b8", fontSize: 11 },
      splitLine: {
        lineStyle: { color: "rgba(0, 212, 255, 0.1)", type: "dashed" },
      },
    },
    series: [
      {
        name: "活动量",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        data: data?.time_series?.[0]?.data?.map((point) => point.value) ?? [],
        lineStyle: {
          width: 2,
          color: "#00d4ff",
        },
        itemStyle: {
          color: "#00d4ff",
          borderColor: "#fff",
          borderWidth: 1,
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "#00d4ff40" },
              { offset: 1, color: "#00d4ff05" },
            ],
          },
        },
      },
    ],
  };

  // 活跃时间段图配置
  const hourlyOption = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(26, 31, 58, 0.95)",
      borderColor: "rgba(0, 212, 255, 0.5)",
      borderWidth: 1,
      textStyle: { color: "#e2e8f0" },
    },
    grid: { left: 50, right: 30, top: 30, bottom: 40 },
    xAxis: {
      type: "category",
      data: data?.hourly_distribution?.map((h) => `${h.hour}:00`) ?? [],
      axisLabel: { color: "#94a3b8", fontSize: 11 },
      axisLine: { lineStyle: { color: "rgba(0, 212, 255, 0.2)" } },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "#94a3b8", fontSize: 11 },
      splitLine: {
        lineStyle: { color: "rgba(0, 212, 255, 0.1)", type: "dashed" },
      },
    },
    series: [
      {
        type: "bar",
        data: data?.hourly_distribution?.map((h) => h.count) ?? [],
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "#00d4ff" },
              { offset: 1, color: "#8338ec" },
            ],
          },
          shadowBlur: 10,
          shadowColor: "rgba(0, 212, 255, 0.5)",
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 20,
            shadowColor: "rgba(0, 212, 255, 0.8)",
          },
        },
      },
    ],
  };

  const hasData = data && data.total_count > 0;
  const isWeekday = weekday !== null && weekday >= 1 && weekday <= 5;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        <div>
          <div className="flex items-center gap-3">
            <div
              className="text-xl font-bold"
              style={{
                background: "linear-gradient(135deg, #00d4ff 0%, #8338ec 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {data?.weekday_name || "星期"}详细分析
            </div>
            {data?.comparison?.is_above_weekday_avg && isWeekday && (
              <Badge
                count="高于工作日平均"
                style={{ backgroundColor: "#06ffa5", color: "#0a0e27" }}
              />
            )}
            {data?.comparison?.is_above_weekend_avg && !isWeekday && (
              <Badge
                count="高于周末平均"
                style={{ backgroundColor: "#ff006e", color: "#fff" }}
              />
            )}
          </div>
          <div className="text-muted text-xs mt-1">用户群体: {segment}</div>
        </div>
      }
      width={width}
      styles={{
        body: {
          padding: "24px",
          background: "linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)",
          position: "relative",
        },
        header: {
          background: "rgba(26, 31, 58, 0.7)",
          borderBottom: "1px solid rgba(0, 212, 255, 0.2)",
        },
      }}
      className="glass"
    >
      <ResizeHandle />
      {isLoading ? (
        <div className="flex justify-center items-center h-96">
          <Spin size="large" />
        </div>
      ) : error ? (
        <Alert
          message="加载失败"
          description="无法获取数据，请稍后重试"
          type="error"
          showIcon
        />
      ) : !hasData ? (
        <Empty description="暂无数据" />
      ) : (
        <div className="space-y-6">
          {/* 事件概览卡片 */}
          <div className="glass rounded-2xl p-4 border border-glass-border">
            <div className="text-sm text-muted uppercase tracking-widest mb-4">事件概览</div>
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <div className="text-center">
                  <div
                    className="text-2xl font-bold mb-1"
                    style={{
                      color: "#00d4ff",
                      textShadow: "0 0 10px rgba(0, 212, 255, 0.4)",
                    }}
                  >
                    {data.user_count.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted">用户数</div>
                </div>
              </Col>
              <Col span={6}>
                <div className="text-center">
                  <div
                    className="text-2xl font-bold mb-1"
                    style={{
                      color: "#00d4ff",
                      textShadow: "0 0 10px rgba(0, 212, 255, 0.4)",
                    }}
                  >
                    {data.total_count.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted">事件总数</div>
                </div>
              </Col>
            </Row>
          </div>

            {/* 用户群体分布 */}
            {data.user_segment_distribution && (
                <div className="glass rounded-2xl p-4 border border-glass-border">
                <div className="text-sm text-muted uppercase tracking-widest mb-4">
                    用户群体分布
                </div>
                <div className="flex flex-wrap gap-2">
                    {segmentOrder.map((seg) => {
                    const count = data.user_segment_distribution[seg] || 0;
                    return (
                        <Tag
                        key={seg}
                        color={seg === segment ? "blue" : "default"}
                        className="px-3 py-1 text-sm"
                        >
                        {seg}: {count.toLocaleString()}
                        </Tag>
                    );
                    })}
                </div>
            </div>
            )}

          {/* 事件类型分布 */}
          {data.event_distribution && Object.keys(data.event_distribution).length > 0 && (
            <div className="glass rounded-2xl p-4 border border-glass-border">
              <div className="text-sm text-muted uppercase tracking-widest mb-4">
                事件类型分布
              </div>
              <div className="flex flex-wrap gap-2">
                {/* 按照固定顺序：浏览、加购、购买 */}
                {(["view", "addtocart", "transaction"] as const).map((eventType) => {
                  const count = data.event_distribution[eventType];
                  if (count === undefined) return null;
                  return (
                    <Tag
                      key={eventType}
                      color={
                        eventType === "view" ? "blue" :
                        eventType === "addtocart" ? "magenta" :
                        eventType === "transaction" ? "green" : "default"
                      }
                      className="px-3 py-1 text-sm"
                    >
                      {eventLabels[eventType] || eventType}: {count.toLocaleString()}
                    </Tag>
                  );
                })}
              </div>
            </div>
          )}

          {/* 转化率卡片 */}
          {data.conversion_rates && (
            <div className="glass rounded-2xl p-4 border border-glass-border">
              <div className="text-sm text-muted uppercase tracking-widest mb-4">转化率分析</div>
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Statistic
                    title="浏览→加购"
                    value={data.conversion_rates.view_to_cart}
                    suffix="%"
                    valueStyle={{ color: "#00d4ff", fontSize: "20px" }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="加购→购买"
                    value={data.conversion_rates.cart_to_purchase}
                    suffix="%"
                    valueStyle={{ color: "#ff006e", fontSize: "20px" }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="浏览→购买"
                    value={data.conversion_rates.view_to_purchase}
                    suffix="%"
                    valueStyle={{ color: "#06ffa5", fontSize: "20px" }}
                  />
                </Col>
              </Row>
            </div>
          )}

          {/* 对比分析 */}
          {data.comparison && (
            <div className="glass rounded-2xl p-4 border border-glass-border">
              <div className="text-sm text-muted uppercase tracking-widest mb-4">对比分析</div>
              <Row gutter={[16, 16]}>
                {isWeekday ? (
                  <Col span={12}>
                    <Statistic
                      title="vs 工作日平均"
                      value={data.comparison.weekday_avg.diff.toFixed(0)}
                      prefix={data.comparison.weekday_avg.diff > 0 ? "+" : ""}
                      suffix="人"
                      valueStyle={{
                        color: data.comparison.weekday_avg.diff > 0 ? "#06ffa5" : "#ff006e",
                        fontSize: "18px",
                      }}
                    />
                    <div className="text-xs text-muted mt-1">
                      ({data.comparison.weekday_avg.diff_percentage > 0 ? "+" : ""}
                      {data.comparison.weekday_avg.diff_percentage}%)
                    </div>
                  </Col>
                ) : (
                  <Col span={12}>
                    <Statistic
                      title="vs 周末平均"
                      value={data.comparison.weekend_avg.diff.toFixed(0)}
                      prefix={data.comparison.weekend_avg.diff > 0 ? "+" : ""}
                      suffix="人"
                      valueStyle={{
                        color: data.comparison.weekend_avg.diff > 0 ? "#06ffa5" : "#ff006e",
                        fontSize: "18px",
                      }}
                    />
                    <div className="text-xs text-muted mt-1">
                      ({data.comparison.weekend_avg.diff_percentage > 0 ? "+" : ""}
                      {data.comparison.weekend_avg.diff_percentage}%)
                    </div>
                  </Col>
                )}
                <Col span={12}>
                  <Statistic
                    title="vs 一周平均"
                    value={data.comparison.week_avg.diff.toFixed(0)}
                    prefix={data.comparison.week_avg.diff > 0 ? "+" : ""}
                    suffix="人"
                    valueStyle={{
                      color: data.comparison.week_avg.diff > 0 ? "#06ffa5" : "#ff006e",
                      fontSize: "18px",
                    }}
                  />
                  <div className="text-xs text-muted mt-1">
                    ({data.comparison.week_avg.diff_percentage > 0 ? "+" : ""}
                    {data.comparison.week_avg.diff_percentage}%)
                  </div>
                </Col>
              </Row>
            </div>
          )}

          {/* 转化漏斗 */}
          {data.funnel && data.funnel.length > 0 && (
            <div className="glass rounded-2xl p-4 border border-glass-border">
              <div className="text-sm text-muted uppercase tracking-widest mb-4">转化漏斗</div>
              <div style={{ height: "280px", width: "100%" }}>
                <FunnelChart data={data.funnel} />
              </div>
            </div>
          )}

          {/* 24小时活跃分布 */}
          {data.hourly_distribution && data.hourly_distribution.length > 0 && (
            <div className="glass rounded-2xl p-4 border border-glass-border">
              <div className="text-sm text-muted uppercase tracking-widest mb-4">24小时活跃分布</div>
              <ReactECharts option={hourlyOption} style={{ height: 240 }} />
            </div>
          )}

          {/* 时间趋势图 */}
          {data.time_series && data.time_series[0]?.data.length > 0 && (
            <div className="glass rounded-2xl p-4 border border-glass-border">
              <div className="text-sm text-muted uppercase tracking-widest mb-4">
                周度趋势
              </div>
              <ReactECharts option={timeSeriesOption} style={{ height: 280 }} />
            </div>
          )}

          {/* Top 商品 */}
          {data.top_items && data.top_items.length > 0 && (
            <div className="glass rounded-2xl p-4 border border-glass-border">
              <div className="text-sm text-muted uppercase tracking-widest mb-4">
                热门商品 Top {data.top_items.length}
              </div>
              <div style={{ height: "280px", width: "100%" }}>
                <BarChart
                  categories={data.top_items.map((item) => item.label)}
                  values={data.top_items.map((item) => item.value)}
                  color="#00d4ff"
                  horizontal
                />
              </div>
            </div>
          )}

          {/* Top 类别 */}
          {data.top_categories && data.top_categories.length > 0 && (
            <div className="glass rounded-2xl p-4 border border-glass-border">
              <div className="text-sm text-muted uppercase tracking-widest mb-4">
                热门类别 Top {data.top_categories.length}
              </div>
              <div style={{ height: "280px", width: "100%" }}>
                <BarChart
                  categories={data.top_categories.map((cat) => cat.label)}
                  values={data.top_categories.map((cat) => cat.value)}
                  color="#ff006e"
                  horizontal
                />
              </div>
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}

