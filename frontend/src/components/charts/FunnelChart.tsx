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
      backgroundColor: "rgba(26, 31, 58, 0.95)",
      borderColor: "rgba(59, 130, 246, 0.5)",
      borderWidth: 1,
      textStyle: { color: "#e2e8f0" },
      formatter: (params: any) => {
        return `<div style="padding: 8px 0;">
          <div style="color: #3b82f6; font-weight: 600; font-size: 14px; margin-bottom: 6px;">${params.name}</div>
          <div style="margin-top: 4px;">
            <span style="font-size: 20px; color: #e2e8f0; font-weight: 600;">${params.value.toLocaleString()}</span>
            <span style="color: #94a3b8; margin-left: 8px; font-size: 12px;">(${params.percent}%)</span>
          </div>
        </div>`;
      },
    },
    series: [
      {
        name: "Funnel",
        type: "funnel",
        left: "15%",
        top: 40,
        bottom: 40,
        width: "70%",
        min: 0,
        max: data[0]?.count || 100,
        minSize: "15%",
        maxSize: "100%",
        sort: "descending",
        gap: 8,
        label: {
          show: true,
          position: "inside",
          formatter: (params: any) => {
            return `{nameStyle|${params.name}}\n{valueStyle|${params.value.toLocaleString()}}\n{percentStyle|${params.percent}%}`;
          },
          rich: {
            nameStyle: {
              fontSize: 14,
              fontWeight: 600,
              color: "#ffffff",
              padding: [4, 0, 2, 0],
              textShadowBlur: 4,
              textShadowColor: "rgba(0, 0, 0, 0.5)",
            },
            valueStyle: {
              fontSize: 16,
              fontWeight: 700,
              color: "#ffffff",
              padding: [2, 0, 2, 0],
              textShadowBlur: 4,
              textShadowColor: "rgba(0, 0, 0, 0.5)",
            },
            percentStyle: {
              fontSize: 12,
              color: "rgba(255, 255, 255, 0.9)",
              padding: [2, 0, 0, 0],
            },
          },
        },
        labelLine: {
          length: 10,
          lineStyle: {
            width: 2,
            type: "solid",
            color: "rgba(255, 255, 255, 0.3)",
          },
        },
        itemStyle: {
          borderColor: "#ffffff",
          borderWidth: 2,
          borderRadius: 8,
          shadowBlur: 15,
          shadowColor: "rgba(0, 0, 0, 0.3)",
        },
        emphasis: {
          label: {
            fontSize: 16,
          },
          itemStyle: {
            shadowBlur: 25,
            shadowColor: "rgba(59, 130, 246, 0.5)",
            borderWidth: 3,
            borderColor: "#3b82f6",
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
            shadowColor: colors[idx % colors.length] + "40",
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 30,
              shadowColor: colors[idx % colors.length] + "80",
            },
          },
        })),
        animationDelay: (idx: number) => idx * 150,
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

