import { useRef, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import type { ECharts } from "echarts";

type Props = {
  categories: string[];
  values: number[];
  onHourClick?: (hour: number) => void;
};

export function LineChart({ categories, values, onHourClick }: Props) {
  const chartRef = useRef<ECharts | null>(null);
  const option = {
    backgroundColor: "transparent",
    grid: { left: 50, right: 30, top: 30, bottom: 50 },
    xAxis: {
      type: "category",
      data: categories,
      boundaryGap: false,
      axisLabel: { color: "#64748b", fontSize: 12 },
      axisLine: { lineStyle: { color: "rgba(59, 130, 246, 0.2)" } },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "#64748b", fontSize: 12 },
      axisLine: { lineStyle: { color: "rgba(59, 130, 246, 0.2)" } },
      splitLine: { 
        lineStyle: { color: "rgba(59, 130, 246, 0.1)", type: "dashed" },
      },
    },
    tooltip: {
      trigger: "axis",
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
        data: values,
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 10,
        symbolStyle: {
          borderColor: "#00d4ff",
          borderWidth: 2,
        },
        itemStyle: {
          color: "#3b82f6",
          borderColor: "#ffffff",
          borderWidth: 2,
          shadowBlur: 10,
          shadowColor: "rgba(0, 212, 255, 0.5)",
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(59, 130, 246, 0.2)" },
              { offset: 1, color: "rgba(139, 92, 246, 0.05)" },
            ],
          },
        },
        lineStyle: {
          width: 3,
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: "#3b82f6" },
              { offset: 1, color: "#8b5cf6" },
            ],
          },
          shadowBlur: 10,
          shadowColor: "rgba(0, 212, 255, 0.5)",
        },
        emphasis: {
          focus: "series",
          itemStyle: {
            shadowBlur: 20,
            shadowColor: "rgba(59, 130, 246, 0.5)",
          },
        },
        animationDelay: (idx: number) => idx * 30,
      },
    ],
  };

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

  return (
    <div style={{ width: "100%", height: "100%", minHeight: "300px" }}>
      <ReactECharts
        option={option}
        style={{ width: "100%", height: "90%" }}
        onChartReady={(chart) => {
          chartRef.current = chart;
        }}
        onEvents={
          onHourClick
            ? {
                click: (params: { name: string; dataIndex: number }) => {
                  // 从 "14:00" 格式中提取小时数
                  const hourStr = params.name.split(":")[0];
                  const hour = parseInt(hourStr, 10);
                  if (!isNaN(hour)) {
                    onHourClick(hour);
                  }
                },
              }
            : undefined
        }
      />
    </div>
  );
}

