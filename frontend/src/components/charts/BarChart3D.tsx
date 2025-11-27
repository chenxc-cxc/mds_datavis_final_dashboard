import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import "echarts-gl";

type BarChart3DProps = {
  categories: string[];
  values: number[];
  color?: string;
};

export function BarChart3D({ categories, values, color = "#3b82f6" }: BarChart3DProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const option: echarts.EChartsOption = {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderColor: "rgba(59, 130, 246, 0.3)",
        borderWidth: 1,
        textStyle: { color: "#1e293b" },
      },
      visualMap: {
        show: false,
        dimension: 1,
        min: 0,
        max: Math.max(...values, 1),
        inRange: {
          color: [color, color + "80"],
        },
      },
      xAxis3D: {
        type: "category",
        data: categories,
        axisLabel: { color: "#64748b", fontSize: 11 },
      },
      yAxis3D: {
        type: "value",
        axisLabel: { color: "#64748b", fontSize: 11 },
      },
      zAxis3D: {
        type: "value",
        axisLabel: { color: "#64748b", fontSize: 11 },
      },
      grid3D: {
        boxWidth: 200,
        boxDepth: 80,
        viewControl: {
          projection: "perspective",
          autoRotate: true,
          autoRotateDirection: "cw",
          autoRotateSpeed: 5,
          rotateSensitivity: 1,
          zoomSensitivity: 1,
          panSensitivity: 1,
        },
        light: {
          main: {
            intensity: 1.2,
            shadow: true,
          },
          ambient: {
            intensity: 0.3,
          },
        },
      },
      series: [
        {
          type: "bar3D",
          data: values.map((value, index) => [index, value, 0]),
          shading: "lambert",
          itemStyle: {
            color: color,
            opacity: 0.8,
          },
          emphasis: {
            itemStyle: {
              color: color,
            },
          },
        } as any,
      ],
    };

    chartInstance.current.setOption(option);

    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chartInstance.current?.dispose();
    };
  }, [categories, values, color]);

  return <div ref={chartRef} style={{ width: "100%", height: "400px" }} />;
}

