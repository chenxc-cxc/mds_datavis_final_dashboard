import { Drawer, Spin, Statistic, Row, Col, Empty, Alert, Tag, Progress } from "antd";
import ReactECharts from "echarts-for-react";
import { useQuery } from "@tanstack/react-query";
import { fetchFunnelStageDetail } from "../api/endpoints";
import type { SegmentName } from "../api/types";
import { BarChart } from "./charts/BarChart";

type Props = {
  open: boolean;
  stage: "view" | "addtocart" | "transaction" | null;
  segment: SegmentName;
  dateFrom?: string | null;
  dateTo?: string | null;
  onClose: () => void;
};

const stageLabels: Record<string, string> = {
  view: "浏览",
  addtocart: "加购",
  transaction: "购买",
};

const stageColors: Record<string, string> = {
  view: "#00d4ff",
  addtocart: "#ff006e",
  transaction: "#06ffa5",
};

export function FunnelStageDrawer({ open, stage, segment, dateFrom, dateTo, onClose }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["funnel-stage", stage, segment, dateFrom, dateTo],
    queryFn: () => fetchFunnelStageDetail(stage!, segment, 10, dateFrom, dateTo),
    enabled: open && !!stage,
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
        name: data?.stage_label || "数量",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        data: data?.time_series?.[0]?.data?.map((point) => point.value) ?? [],
        lineStyle: {
          width: 2,
          color: stage ? stageColors[stage] : "#00d4ff",
        },
        itemStyle: {
          color: stage ? stageColors[stage] : "#00d4ff",
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
                color: stage ? `${stageColors[stage]}40` : "#00d4ff40",
              },
              {
                offset: 1,
                color: stage ? `${stageColors[stage]}05` : "#00d4ff05",
              },
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
              { offset: 0, color: stage ? stageColors[stage] : "#00d4ff" },
              { offset: 1, color: stage ? stageColors[stage] : "#8338ec" },
            ],
          },
          shadowBlur: 10,
          shadowColor: stage
            ? `${stageColors[stage]}50`
            : "rgba(0, 212, 255, 0.5)",
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 20,
            shadowColor: stage
              ? `${stageColors[stage]}80`
              : "rgba(0, 212, 255, 0.8)",
          },
        },
      },
    ],
  };

  const hasData = data && (data.count > 0 || data.time_series.length > 0);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        <div>
          <div
            className="text-xl font-bold"
            style={{
              background: `linear-gradient(135deg, ${stage ? stageColors[stage] : "#00d4ff"} 0%, ${stage ? stageColors[stage] : "#8338ec"} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {data?.stage_label || stageLabels[stage || ""] || "阶段详情"}
          </div>
          <div className="text-muted text-xs mt-1">用户群体: {segment}</div>
        </div>
      }
      width={700}
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
          {/* 概览统计 */}
          <div className="glass rounded-2xl p-4 border border-glass-border">
            <div className="text-sm text-muted uppercase tracking-widest mb-4">
              阶段概览
            </div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="事件总数"
                  value={data.count}
                  valueStyle={{
                    color: stage ? stageColors[stage] : "#00d4ff",
                    fontSize: "24px",
                  }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="占比"
                  value={data.percentage}
                  suffix="%"
                  valueStyle={{
                    color: stage ? stageColors[stage] : "#00d4ff",
                    fontSize: "24px",
                  }}
                />
              </Col>
            </Row>
            {data.percentage > 0 && (
              <div className="mt-4">
                <Progress
                  percent={data.percentage}
                  strokeColor={
                    stage
                      ? {
                          "0%": stageColors[stage],
                          "100%": stageColors[stage] + "80",
                        }
                      : undefined
                  }
                  showInfo={false}
                />
              </div>
            )}
          </div>

          {/* 流失分析 */}
          {data.dropoff_analysis && (
            <div className="glass rounded-2xl p-4 border border-glass-border">
              <div className="text-sm text-muted uppercase tracking-widest mb-4">
                转化分析
              </div>
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-muted">
                      {data.dropoff_analysis.from_stage}
                    </div>
                    <div
                      className="text-2xl font-bold mt-1"
                      style={{ color: "#00d4ff" }}
                    >
                      {data.dropoff_analysis.from_count.toLocaleString()}
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-muted">
                      {data.dropoff_analysis.to_stage}
                    </div>
                    <div
                      className="text-2xl font-bold mt-1"
                      style={{ color: "#06ffa5" }}
                    >
                      {data.dropoff_analysis.to_count.toLocaleString()}
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-muted">转化率</div>
                    <div
                      className="text-2xl font-bold mt-1"
                      style={{ color: "#ff006e" }}
                    >
                      {data.dropoff_analysis.conversion_rate}%
                    </div>
                  </div>
                </Col>
              </Row>
              <div className="mt-4 p-3 bg-surface-1 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted">流失数量</span>
                  <span className="text-lg font-semibold">
                    {data.dropoff_analysis.dropoff_count.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-muted">流失率</span>
                  <span className="text-lg font-semibold">
                    {data.dropoff_analysis.dropoff_rate}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 用户群体分布 */}
          {data.user_segment_distribution &&
            Object.keys(data.user_segment_distribution).length > 0 && (
              <div className="glass rounded-2xl p-4 border border-glass-border">
                <div className="text-sm text-muted uppercase tracking-widest mb-4">
                  用户群体分布
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(data.user_segment_distribution).map(
                    ([seg, count]) => (
                      <Tag
                        key={seg}
                        color={seg === segment ? "blue" : "default"}
                        className="px-3 py-1 text-sm"
                      >
                        {seg}: {count.toLocaleString()}
                      </Tag>
                    )
                  )}
                </div>
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

          {/* 活跃时间段 */}
          {data.hourly_distribution && data.hourly_distribution.length > 0 && (
            <div className="glass rounded-2xl p-4 border border-glass-border">
              <div className="text-sm text-muted uppercase tracking-widest mb-4">
                活跃时间段分布
              </div>
              <ReactECharts option={hourlyOption} style={{ height: 240 }} />
            </div>
          )}

          {/* Top 商品 */}
          {data.top_items && data.top_items.length > 0 && (
            <div className="glass rounded-2xl p-4 border border-glass-border">
              <div className="text-sm text-muted uppercase tracking-widest mb-4">
                热门商品 Top {data.top_items.length}
              </div>
              <BarChart
                categories={data.top_items.map((item) => item.label)}
                values={data.top_items.map((item) => item.value)}
                color={stage ? stageColors[stage] : "#00d4ff"}
                horizontal
              />
            </div>
          )}

          {/* Top 类别 */}
          {data.top_categories && data.top_categories.length > 0 && (
            <div className="glass rounded-2xl p-4 border border-glass-border">
              <div className="text-sm text-muted uppercase tracking-widest mb-4">
                热门类别 Top {data.top_categories.length}
              </div>
              <BarChart
                categories={data.top_categories.map((cat) => cat.label)}
                values={data.top_categories.map((cat) => cat.value)}
                color={stage ? stageColors[stage] : "#ff006e"}
                horizontal
              />
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}

