import { useRef, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import type { ECharts } from "echarts";

type BarChartProps = {
  categories: string[];
  values: number[];
  color?: string;
  horizontal?: boolean;
  onBarClick?: (payload: { name: string; value: number; index: number }) => void;
};

export function BarChart({
  categories,
  values,
  color = "#3b82f6",
  horizontal,
  onBarClick,
}: BarChartProps) {
  const chartRef = useRef<ECharts | null>(null);
  const option = {
    backgroundColor: "transparent",
    grid: { left: horizontal ? 80 : 60, right: 30, top: 30, bottom: horizontal ? 40 : 60 },
    xAxis: horizontal
      ? {
          type: "value",
          axisLabel: { color: "#64748b", fontSize: 12 },
          splitLine: { 
            lineStyle: { color: "rgba(59, 130, 246, 0.1)", type: "dashed" },
          },
        }
      : {
          type: "category",
          data: categories,
          axisLabel: { color: "#64748b", rotate: 30, fontSize: 12 },
          axisLine: { lineStyle: { color: "rgba(59, 130, 246, 0.2)" } },
        },
    yAxis: horizontal
      ? {
          type: "category",
          data: categories,
          axisLabel: { color: "#64748b", fontSize: 12 },
          axisLine: { lineStyle: { color: "rgba(59, 130, 246, 0.2)" } },
        }
      : {
          type: "value",
          axisLabel: { color: "#64748b", fontSize: 12 },
          splitLine: { 
            lineStyle: { color: "rgba(59, 130, 246, 0.1)", type: "dashed" },
          },
        },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderColor: "rgba(59, 130, 246, 0.3)",
      borderWidth: 1,
      textStyle: { color: "#1e293b" },
      formatter: (params: any) => {
        const item = Array.isArray(params) ? params[0] : params;
        return `<div style="padding: 4px 0;">
          <div style="color: #3b82f6; font-weight: 600;">${item.name}</div>
          <div style="margin-top: 4px; font-size: 18px; color: #1e293b;">${item.value.toLocaleString()}</div>
        </div>`;
      },
    },
    series: [
      {
        type: "bar",
        data: values.map((val) => ({
          value: val,
          itemStyle: {
            borderRadius: horizontal ? [0, 8, 8, 0] : [8, 8, 0, 0],
            color: {
              type: "linear",
              x: horizontal ? 0 : 0,
              y: horizontal ? 0 : 1,
              x2: horizontal ? 1 : 0,
              y2: horizontal ? 0 : 0,
              colorStops: [
                { offset: 0, color: color },
                { offset: 1, color: color === "#3b82f6" ? "#8b5cf6" : color === "#f97316" ? "#ec4899" : "#3b82f6" },
              ],
            },
            shadowBlur: 10,
            shadowColor: color === "#3b82f6" ? "rgba(59, 130, 246, 0.3)" : "rgba(236, 72, 153, 0.3)",
          },
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 20,
            shadowColor: color === "#3b82f6" ? "rgba(59, 130, 246, 0.5)" : "rgba(236, 72, 153, 0.5)",
          },
        },
        label: {
          show: true,
          position: horizontal ? "right" : "top",
          formatter: (val: any) => val.value.toLocaleString(),
          color: "#1e293b",
          fontSize: 11,
          fontWeight: 600,
        },
        animationDelay: (_idx: number) => _idx * 50,
      },
    ],
  };

  const cleanupRef = useRef<(() => void) | null>(null);

  // Setup resize observer when chart is ready
  const setupResizeObserver = (chart: ECharts) => {
    // Clean up previous observer if exists
    if (cleanupRef.current) {
      cleanupRef.current();
    }

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

    cleanupRef.current = () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleWindowResize);
    };
  };

  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", minHeight: "300px" }}>
      <ReactECharts
        option={option}
        style={{ width: "100%", height: "90%" }}
        onChartReady={(chart) => {
          chartRef.current = chart;
          setupResizeObserver(chart);
        }}
        onEvents={
          onBarClick
            ? {
                click: (params: { name: string; value: number; dataIndex: number }) => {
                  onBarClick({
                    name: params.name as string,
                    value: params.value as number,
                    index: params.dataIndex as number,
                  });
                },
              }
            : undefined
        }
      />
    </div>
  );
}

