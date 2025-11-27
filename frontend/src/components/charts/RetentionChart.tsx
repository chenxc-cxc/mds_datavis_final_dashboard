import { useRef, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import type { ECharts } from "echarts";
import type { MonthlyRetentionPoint } from "../../api/types";

type RetentionChartProps = {
  data: MonthlyRetentionPoint[];
  onCohortClick?: (cohortMonth: string) => void;
};

export function RetentionChart({ data, onCohortClick }: RetentionChartProps) {
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

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <div className="text-sm">暂无留存率数据</div>
        </div>
      </div>
    );
  }

  // 按cohort_month分组数据
  const cohortMap = new Map<string, MonthlyRetentionPoint[]>();
  data.forEach((point) => {
    const cohort = point.cohort_month;
    if (!cohortMap.has(cohort)) {
      cohortMap.set(cohort, []);
    }
    cohortMap.get(cohort)!.push(point);
  });

  // 获取所有cohort月份，并排序
  const cohorts = Array.from(cohortMap.keys()).sort();
  
  // 获取最大的month_diff，以确定需要显示多少个月
  const maxMonthDiff = Math.max(...data.map((d) => d.month_diff), 0);

  // X轴：月份差（0, 1, 2, ...）
  const xAxisData: string[] = [];
  for (let i = 0; i <= maxMonthDiff; i++) {
    xAxisData.push(i === 0 ? "首月" : `第${i}月`);
  }

  // 为每个cohort构建折线数据
  const colors = [
    "#3b82f6", // 蓝色
    "#8b5cf6", // 紫色
    "#ec4899", // 粉色
    "#f59e0b", // 橙色
    "#10b981", // 绿色
    "#06b6d4", // 青色
    "#ef4444", // 红色
  ];

  // 构建折线图系列（留存率）
  const lineSeries = cohorts.map((cohort, cohortIndex) => {
    const cohortData = cohortMap.get(cohort)!;
    const cohortDate = new Date(cohort);
    const month = cohortDate.getMonth() + 1;
    const monthStr = month < 10 ? `0${month}` : `${month}`;
    const cohortLabel = `${cohortDate.getFullYear()}-${monthStr}`;
    
    // 构建该cohort的留存率数据点
    const values: number[] = [];
    for (let monthDiff = 0; monthDiff <= maxMonthDiff; monthDiff++) {
      const point = cohortData.find((d) => d.month_diff === monthDiff);
      values.push(point ? point.retention_rate : 0);
    }
    
    return {
      name: cohortLabel,
      type: "line" as const,
      data: values,
      smooth: true,
      symbol: "circle",
      symbolSize: 8,
      itemStyle: {
        color: colors[cohortIndex % colors.length],
        borderColor: "#ffffff",
        borderWidth: 2,
        shadowBlur: 10,
        shadowColor: colors[cohortIndex % colors.length] + "80",
      },
      lineStyle: {
        width: 3,
        color: colors[cohortIndex % colors.length],
        shadowBlur: 10,
        shadowColor: colors[cohortIndex % colors.length] + "50",
      },
      areaStyle: {
        color: {
          type: "linear" as const,
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: colors[cohortIndex % colors.length] + "33" },
            { offset: 1, color: colors[cohortIndex % colors.length] + "05" },
          ],
        },
      },
      emphasis: {
        focus: "series" as const,
        itemStyle: {
          shadowBlur: 20,
          shadowColor: colors[cohortIndex % colors.length] + "80",
        },
      },
      animationDelay: (idx: number) => idx * 30,
    };
  });

  const series = lineSeries;

  const option = {
    backgroundColor: "transparent",
    grid: { left: 80, right: 30, top: 50, bottom: 50 },
    legend: {
      show: true,
      top: 0,
      textStyle: { color: "#64748b", fontSize: 11 },
      itemGap: 15,
      type: "scroll" as const,
      data: cohorts.map((cohort) => {
        const cohortDate = new Date(cohort);
        const month = cohortDate.getMonth() + 1;
        const monthStr = month < 10 ? `0${month}` : `${month}`;
        return `${cohortDate.getFullYear()}-${monthStr}`;
      }),
    },
    tooltip: {
      trigger: "axis" as const,
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderColor: "rgba(59, 130, 246, 0.3)",
      borderWidth: 1,
      textStyle: { color: "#1e293b" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (params: any) => {
        const paramArray = Array.isArray(params) ? params : [params];
        if (paramArray.length === 0) return "";
        
        const firstParam = paramArray[0];
        let result = `<div style="padding: 4px 0;">
          <div style="color: #3b82f6; font-weight: 600; margin-bottom: 4px;">${firstParam.name}</div>`;
        
        // 显示折线图数据（留存率）
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        paramArray.forEach((item: any) => {
          result += `<div style="display: flex; align-items: center; margin-bottom: 4px;">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${item.color}; margin-right: 8px;"></span>
            <span style="color: #1e293b; margin-right: 8px;">${item.seriesName}:</span>
            <span style="font-size: 16px; font-weight: 600; color: #1e293b;">${item.value.toFixed(2)}%</span>
          </div>`;
        });
        
        result += `</div>`;
        return result;
      },
    },
    xAxis: {
      type: "category" as const,
      data: xAxisData,
      boundaryGap: false,
      axisLabel: { 
        color: "#64748b", 
        fontSize: 12,
        margin: 12, // 增加标签与轴线的距离
      },
      axisLine: { lineStyle: { color: "rgba(59, 130, 246, 0.2)" } },
      splitLine: { show: false },
    },
    yAxis: {
      // Y轴：留存率百分比
      type: "value" as const,
      name: "留存率",
      nameTextStyle: { color: "#64748b", fontSize: 12 },
      axisLabel: { 
        color: "#64748b", 
        fontSize: 12,
        formatter: (value: number) => `${value}%`,
        margin: 80, // 增加标签与轴线的距离
      },
      axisLine: { lineStyle: { color: "rgba(59, 130, 246, 0.2)" } },
      splitLine: { 
        lineStyle: { color: "rgba(59, 130, 246, 0.1)", type: "dashed" },
      },
      min: 0,
      max: 100,
    },
    series,
  };

  return (
    <div style={{ width: "100%", height: "100%", minHeight: "300px" }}>
      <ReactECharts
        option={option}
        style={{ width: "100%", height: "90%" }}
        onChartReady={(chart) => {
          chartRef.current = chart;
        }}
        onEvents={
          onCohortClick
            ? {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                click: (params: any) => {
                  // 点击折线数据点时触发
                  if (params.seriesType === "line" && params.seriesName) {
                    // seriesName格式为 "YYYY-MM"
                    onCohortClick(params.seriesName);
                  }
                },
              }
            : undefined
        }
      />
    </div>
  );
}
