import { useRef, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import type { ECharts } from "echarts";
import type { FunnelStage } from "../../api/types";

type Props = {
  data: FunnelStage[];
  onStageClick?: (stage: string) => void;
};

const stageMapping: Record<string, string> = {
  浏览: "view",
  加购: "addtocart",
  购买: "transaction",
};

export function FunnelChart({ data, onStageClick }: Props) {
  const chartRef = useRef<ECharts | null>(null);
  const colors = ["#3b82f6", "#8b5cf6", "#ec4899"];
  
  const option = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "item",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderColor: "rgba(59, 130, 246, 0.3)",
      borderWidth: 1,
      textStyle: { color: "#1e293b" },
      formatter: (params: any) => {
        return `<div style="padding: 4px 0;">
          <div style="color: #3b82f6; font-weight: 600;">${params.name}</div>
          <div style="margin-top: 4px;">
            <span style="font-size: 18px; color: #1e293b;">${params.value.toLocaleString()}</span>
            <span style="color: #64748b; margin-left: 8px;">(${params.percent}%)</span>
          </div>
        </div>`;
      },
    },
    series: [
      {
        name: "Funnel",
        type: "funnel",
        left: "10%",
        top: 20,
        bottom: 10,
        width: "80%",
        min: 0,
        max: data[0]?.count || 100,
        minSize: "0%",
        maxSize: "100%",
        sort: "descending",
        gap: 2,
        label: {
          show: true,
          position: "inside",
          formatter: "{b}\n{c} ({d}%)",
          color: "#1e293b",
          fontSize: 12,
          fontWeight: 600,
        },
        labelLine: {
          length: 10,
          lineStyle: {
            width: 1,
            type: "solid",
          },
        },
        itemStyle: {
          borderColor: "#ffffff",
          borderWidth: 2,
          shadowBlur: 10,
          shadowColor: "rgba(59, 130, 246, 0.2)",
        },
        emphasis: {
          label: {
            fontSize: 14,
          },
          itemStyle: {
            shadowBlur: 20,
            shadowColor: "rgba(59, 130, 246, 0.4)",
          },
        },
        data: data.map((stage, idx) => ({
          name: stage.stage,
          value: stage.count,
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: colors[idx % colors.length] },
                { offset: 1, color: colors[(idx + 1) % colors.length] },
              ],
            },
          },
        })),
        animationDelay: (idx: number) => idx * 200,
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
        style={{ width: "100%", height: "85%" }}
        onChartReady={(chart) => {
          chartRef.current = chart;
        }}
        onEvents={
          onStageClick
            ? {
                click: (params: { name: string }) => {
                  const stageKey = stageMapping[params.name];
                  if (stageKey) {
                    onStageClick(stageKey);
                  }
                },
              }
            : undefined
        }
      />
    </div>
  );
}

