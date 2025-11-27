import { Drawer, Spin, Statistic, Row, Col, Empty, Alert, Tag, Progress, Badge } from "antd";
import ReactECharts from "echarts-for-react";
import { useQuery } from "@tanstack/react-query";
import { fetchActiveHourDetail } from "../api/endpoints";
import type { SegmentName } from "../api/types";
import { BarChart } from "./charts/BarChart";
import { FunnelChart } from "./charts/FunnelChart";

type Props = {
  open: boolean;
  hour: number | null;
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

export function ActiveHourDrawer({ open, hour, segment, dateFrom, dateTo, onClose }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["active-hour", hour, segment, dateFrom, dateTo],
    queryFn: () => fetchActiveHourDetail(hour!, segment, 10, dateFrom, dateTo),
    enabled: open && hour !== null,
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

  const hasData = data && data.total_count > 0;

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
              {hour !== null ? `${hour}:00` : ""} 时间段分析
            </div>
            {data?.comparison?.is_peak && (
              <Badge
                count="峰值"
                style={{ backgroundColor: "#06ffa5", color: "#0a0e27" }}
              />
            )}
            {data?.comparison?.is_valley && (
              <Badge
                count="低谷"
                style={{ backgroundColor: "#ff006e", color: "#fff" }}
              />
            )}
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
              时间段概览
            </div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="事件总数"
                  value={data.total_count}
                  valueStyle={{ color: "#00d4ff", fontSize: "24px" }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="占全天比例"
                  value={data.percentage_of_day}
                  suffix="%"
                  valueStyle={{ color: "#8338ec", fontSize: "24px" }}
                />
              </Col>
            </Row>
            {data.percentage_of_day > 0 && (
              <div className="mt-4">
                <Progress
                  percent={data.percentage_of_day}
                  strokeColor={{
                    "0%": "#00d4ff",
                    "100%": "#8338ec",
                  }}
                  showInfo={false}
                />
              </div>
            )}
          </div>

          {/* 时间段对比 */}
          {data.comparison && (
            <div className="glass rounded-2xl p-4 border border-glass-border">
              <div className="text-sm text-muted uppercase tracking-widest mb-4">
                时间段对比
              </div>
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <div className="text-center">
                    <div className="text-sm text-muted mb-1">
                      {data.comparison.prev_hour.hour}:00
                    </div>
                    <div className="text-lg font-semibold">
                      {data.comparison.prev_hour.count.toLocaleString()}
                    </div>
                    <div
                      className={`text-xs mt-1 ${
                        data.comparison.prev_hour.diff >= 0
                          ? "text-success"
                          : "text-muted"
                      }`}
                    >
                      {data.comparison.prev_hour.diff >= 0 ? "+" : ""}
                      {data.comparison.prev_hour.diff_percentage.toFixed(1)}%
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div className="text-center">
                    <div className="text-sm text-muted mb-1">平均值</div>
                    <div className="text-lg font-semibold">
                      {data.comparison.average.count.toLocaleString()}
                    </div>
                    <div
                      className={`text-xs mt-1 ${
                        data.comparison.average.diff >= 0
                          ? "text-success"
                          : "text-muted"
                      }`}
                    >
                      {data.comparison.average.diff >= 0 ? "+" : ""}
                      {data.comparison.average.diff_percentage.toFixed(1)}%
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div className="text-center">
                    <div className="text-sm text-muted mb-1">
                      {data.comparison.next_hour.hour}:00
                    </div>
                    <div className="text-lg font-semibold">
                      {data.comparison.next_hour.count.toLocaleString()}
                    </div>
                    <div
                      className={`text-xs mt-1 ${
                        data.comparison.next_hour.diff >= 0
                          ? "text-success"
                          : "text-muted"
                      }`}
                    >
                      {data.comparison.next_hour.diff >= 0 ? "+" : ""}
                      {data.comparison.next_hour.diff_percentage.toFixed(1)}%
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          )}

          {/* 事件类型分布 */}
          {data.event_distribution &&
            Object.keys(data.event_distribution).length > 0 && (
              <div className="glass rounded-2xl p-4 border border-glass-border">
                <div className="text-sm text-muted uppercase tracking-widest mb-4">
                  事件类型分布
                </div>
                <Row gutter={[16, 16]}>
                  {Object.entries(data.event_distribution).map(([key, value]) => (
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
                        <div className="text-xs text-muted">
                          {eventLabels[key] || key}
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            )}

          {/* 转化率 */}
          {data.conversion_rates && (
            <div className="glass rounded-2xl p-4 border border-glass-border">
              <div className="text-sm text-muted uppercase tracking-widest mb-4">
                转化率分析
              </div>
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
              <div className="text-sm text-muted uppercase tracking-widest mb-4">
                转化漏斗
              </div>
              <div style={{ height: "280px", width: "100%" }}>
                <FunnelChart data={data.funnel} />
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

          {/* Top 商品 */}
          {data.top_items && data.top_items.length > 0 && (
            <div className="glass rounded-2xl p-4 border border-glass-border">
              <div className="text-sm text-muted uppercase tracking-widest mb-4">
                热门商品 Top {data.top_items.length}
              </div>
              <BarChart
                categories={data.top_items.map((item) => item.label)}
                values={data.top_items.map((item) => item.value)}
                color="#00d4ff"
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
                color="#ff006e"
                horizontal
              />
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}

