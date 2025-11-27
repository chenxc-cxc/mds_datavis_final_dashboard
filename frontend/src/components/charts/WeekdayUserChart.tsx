import { useRef, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import type { ECharts } from "echarts";
import type { WeekdayUsersResponse } from "../../api/types";

type WeekdayUserChartProps = {
  data: WeekdayUsersResponse | null;
};

export function WeekdayUserChart({ data }: WeekdayUserChartProps) {
  const chartRef = useRef<ECharts | null>(null);

  // Setup resize observer for responsive charts
  useEffect(() => {
    if (!chartRef.current) return;

    const chart = chartRef.current;
    const dom = chart.getDom();
    if (!dom?.parentElement) return;

    const resizeObserver = new ResizeObserver(() => {
      setTimeout(() => {
        if (chartRef.current) {
          chartRef.current.resize();
        }
      }, 100);
    });

    resizeObserver.observe(dom.parentElement);

    const handleWindowResize = () => {
      if (chartRef.current) {
        chartRef.current.resize();
      }
    };
    window.addEventListener("resize", handleWindowResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleWindowResize);
    };
  }, []);

  if (!data || !data.data || data.data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <div className="text-sm">暂无数据</div>
        </div>
      </div>
    );
  }

  const categories = data.data.map((item) => item.weekday_name);
  const values = data.data.map((item) => item.user_count);

  const option = {
    backgroundColor: "transparent",
    grid: { left: 60, right: 30, top: 40, bottom: 50 },
    tooltip: {
      trigger: "axis" as const,
      triggerOn: "mousemove" as const,
      axisPointer: { type: "shadow" as const },
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderColor: "rgba(59, 130, 246, 0.3)",
      borderWidth: 1,
      textStyle: { color: "#1e293b" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (params: any) => {
        const paramArray = Array.isArray(params) ? params : [params];
        if (paramArray.length === 0) return "";
        
        const item = paramArray[0];
        let result = `<div style="padding: 4px 0;">
          <div style="color: #3b82f6; font-weight: 600;">${item.name}</div>
          <div style="margin-top: 4px; font-size: 18px; color: #1e293b;">${item.value.toLocaleString()} 人</div>`;
        
        // 添加平均值信息
        if (item.name === "周一" || item.name === "周二" || item.name === "周三" || item.name === "周四" || item.name === "周五") {
          result += `<div style="margin-top: 4px; font-size: 12px; color: #64748b;">工作日平均: ${data.weekday_avg.toFixed(0)} 人</div>`;
        } else {
          result += `<div style="margin-top: 4px; font-size: 12px; color: #64748b;">周末平均: ${data.weekend_avg.toFixed(0)} 人</div>`;
        }
        
        result += `</div>`;
        return result;
      },
    },
    xAxis: {
      type: "category" as const,
      data: categories,
      axisLabel: { 
        color: "#64748b", 
        fontSize: 12,
      },
      axisLine: { lineStyle: { color: "rgba(59, 130, 246, 0.2)" } },
    },
    yAxis: {
      type: "value" as const,
      axisLabel: { color: "#64748b", fontSize: 12 },
      axisLine: { lineStyle: { color: "rgba(59, 130, 246, 0.2)" } },
      splitLine: { 
        lineStyle: { color: "rgba(59, 130, 246, 0.1)", type: "dashed" },
      },
    },
    series: [
      {
        name: "用户数",
        type: "bar" as const,
        data: values.map((val) => ({
          value: val,
          itemStyle: {
            borderRadius: [8, 8, 0, 0],
            color: {
              type: "linear" as const,
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "#3b82f6" },
                { offset: 1, color: "#8b5cf6" },
              ],
            },
            shadowBlur: 10,
            shadowColor: "rgba(59, 130, 246, 0.3)",
          },
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 20,
            shadowColor: "rgba(59, 130, 246, 0.5)",
          },
        },
        label: {
          show: true,
          position: "top" as const,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter: (val: any) => val.value > 0 ? val.value.toLocaleString() : "",
          color: "#1e293b",
          fontSize: 11,
          fontWeight: 600,
        },
        markLine: {
          silent: false, // 允许交互，可以显示tooltip
          symbol: "none", // 不显示端点符号
          lineStyle: {
            type: "dashed" as const,
          },
          data: [
            {
              name: "工作日平均",
              yAxis: data.weekday_avg,
              value: data.weekday_avg, // 添加value以便tooltip显示
              lineStyle: {
                color: "#10b981",
                width: 2,
                type: "dashed" as const,
              },
              label: {
                show: false,  // 不显示标签，改用下方的图例说明
                position: "end" as const,
                formatter: `工作日平均: ${data.weekday_avg.toFixed(0)}`,
                color: "#10b981",
                fontSize: 11,
                fontWeight: 600,
              },
            },
            {
              name: "周末平均",
              yAxis: data.weekend_avg,
              value: data.weekend_avg, // 添加value以便tooltip显示
              lineStyle: {
                color: "#f59e0b",
                width: 2,
                type: "dashed" as const,
              },
              label: {
                show: false,  // 不显示标签，改用下方的图例说明
                position: "end" as const,
                formatter: `周末平均: ${data.weekend_avg.toFixed(0)}`,
                color: "#f59e0b",
                fontSize: 11,
                fontWeight: 600,
              },
            },
          ],
        },
        animationDelay: (idx: number) => idx * 50,
      },
    ],
  };

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", minHeight: "300px" }}>
      <div style={{ flex: "1 1 auto", minHeight: 0, maxHeight: "calc(100% - 100px)" }}>
        <ReactECharts
          option={option}
          style={{ width: "100%", height: "100%" }}
          onChartReady={(chart) => {
            chartRef.current = chart;
            // Setup resize observer when chart is ready
            const dom = chart.getDom();
            if (dom?.parentElement) {
              const resizeObserver = new ResizeObserver(() => {
                setTimeout(() => {
                  if (chartRef.current) {
                    chartRef.current.resize();
                  }
                }, 100);
              });
              resizeObserver.observe(dom.parentElement);
            }
          }}
        />
      </div>
      {/* 图例说明 */}
      <div className="flex items-center justify-center gap-6 mt-4 flex-shrink-0" style={{ height: "auto", minHeight: "40px" }}>
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-0 border-t-2"
            style={{
              borderTopColor: "#10b981",
              borderTopStyle: "dashed",
            }}
          />
          <span className="text-sm text-slate-600">
            工作日平均: <span className="font-semibold text-slate-700">{data.weekday_avg.toFixed(0)}</span> 人
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-0 border-t-2"
            style={{
              borderTopColor: "#f59e0b",
              borderTopStyle: "dashed",
            }}
          />
          <span className="text-sm text-slate-600">
            周末平均: <span className="font-semibold text-slate-700">{data.weekend_avg.toFixed(0)}</span> 人
          </span>
        </div>
      </div>
    </div>
  );
}

