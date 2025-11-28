import { Drawer, Spin, Statistic, Row, Col, Empty, Alert, Tag } from "antd";
import ReactECharts from "echarts-for-react";
import { useQuery } from "@tanstack/react-query";
import { fetchCohortDetail } from "../api/endpoints";
import type { SegmentName } from "../api/types";
import { FunnelChart } from "./charts/FunnelChart";

type Props = {
  open: boolean;
  cohortMonth: string | null;
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

const eventColors: Record<string, string> = {
  view: "#00d4ff",
  addtocart: "#ff006e",
  transaction: "#06ffa5",
};

// 用户类型配色方案
const segmentTagColors: Record<string, string> = {
  All: "blue",
  Hesitant: "orange",
  Impulsive: "magenta",
  Collector: "purple",
};

export function CohortDetailDrawer({ open, cohortMonth, segment, dateFrom, dateTo, onClose }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["cohort-detail", cohortMonth, segment, dateFrom, dateTo],
    queryFn: () => fetchCohortDetail(cohortMonth!, segment, dateFrom, dateTo),
    enabled: open && !!cohortMonth,
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
    legend: {
      top: 0,
      textStyle: { color: "#e2e8f0" },
      itemGap: 20,
    },
    grid: { left: 50, right: 30, top: 50, bottom: 50 },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: data?.series?.[0]?.data?.map((point) => point.period) ?? [],
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
    series:
      data?.series?.map((serie, idx) => ({
        name: eventLabels[serie.label] || serie.label,
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        data: serie.data.map((point) => point.value),
        lineStyle: {
          width: 2,
          color: eventColors[serie.label] || "#00d4ff",
        },
        itemStyle: {
          color: eventColors[serie.label] || "#00d4ff",
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
              {
                offset: 0,
                color: `${eventColors[serie.label] || "#00d4ff"}40`,
              },
              { offset: 1, color: `${eventColors[serie.label] || "#00d4ff"}05` },
            ],
          },
        },
        animationDelay: idx * 100,
      })) ?? [],
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

  const hasData = data && (data.series.length > 0 || Object.keys(data.summary).length > 0);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        <div>
          <div className="text-gradient text-xl font-bold">
            Cohort {data?.cohort_month ?? cohortMonth} 分析
          </div>
          <div className="text-muted text-xs mt-1">用户群体: {segment}</div>
        </div>
      }
      width={600}
      styles={{
        body: {
          padding: "24px",
          background: "linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)",
        },
        header: {
          background: "rgba(26, 31, 58, 0.7)",
          borderBottom: "1px solid rgba(0, 212, 255, 0.2)",
        },
      }}
      className="glass"
    >
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
          {/* Cohort概览统计卡片 */}
          <div className="glass rounded-2xl p-4 border border-glass-border">
            <div className="text-sm text-muted uppercase tracking-widest mb-4">Cohort概览</div>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Statistic
                  title="Cohort规模"
                  value={data.cohort_size}
                  valueStyle={{ color: "#00d4ff", fontSize: "20px" }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="当前活跃用户"
                  value={data.current_active_users}
                  valueStyle={{ color: "#ff006e", fontSize: "20px" }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="当前留存率"
                  value={data.current_retention_rate}
                  suffix="%"
                  valueStyle={{ color: "#06ffa5", fontSize: "20px" }}
                />
              </Col>
            </Row>
          </div>

          {/* 事件统计卡片 */}
          <div className="glass rounded-2xl p-4 border border-glass-border">
            <div className="text-sm text-muted uppercase tracking-widest mb-4">事件统计</div>
            <Row gutter={[16, 16]}>
              {Object.entries(data.summary).map(([key, value]) => (
                <Col span={8} key={key}>
                  <div className="text-center">
                    <div
                      className="text-2xl font-bold mb-1"
                      style={{
                        color: eventColors[key] || "#00d4ff",
                        textShadow: `0 0 10px ${eventColors[key] || "#00d4ff"}40`,
                      }}
                    >
                      {value.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted">{eventLabels[key] || key}</div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>

          {/* 用户细分分布 */}
          {data.user_segment_distribution && Object.keys(data.user_segment_distribution).length > 0 && (
            <div className="glass rounded-2xl p-4 border border-glass-border">
              <div className="text-sm text-muted uppercase tracking-widest mb-4">用户细分分布</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(data.user_segment_distribution).map(([seg, count]) => (
                  <Tag
                    key={seg}
                    color={segmentTagColors[seg] || "default"}
                    className="px-3 py-1 text-sm"
                  >
                    {seg}: {count.toLocaleString()}
                  </Tag>
                ))}
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

          {/* 转化漏斗 */}
          {data.funnel && data.funnel.length > 0 && (
            <div className="glass rounded-2xl p-4 border border-glass-border">
              <div className="text-sm text-muted uppercase tracking-widest mb-4">转化漏斗</div>
              <div style={{ height: "280px", width: "100%" }}>
                <FunnelChart data={data.funnel} />
              </div>
            </div>
          )}

          {/* 时间趋势图 */}
          {data.series && data.series.length > 0 && (
            <div className="glass rounded-2xl p-4 border border-glass-border">
              <div className="text-sm text-muted uppercase tracking-widest mb-4">周度趋势</div>
              <ReactECharts option={timeSeriesOption} style={{ height: 280 }} />
            </div>
          )}

          {/* 活跃时间段 */}
          {data.hourly_distribution && data.hourly_distribution.length > 0 && (
            <div className="glass rounded-2xl p-4 border border-glass-border">
              <div className="text-sm text-muted uppercase tracking-widest mb-4">活跃时间段分布</div>
              <ReactECharts option={hourlyOption} style={{ height: 240 }} />
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}

