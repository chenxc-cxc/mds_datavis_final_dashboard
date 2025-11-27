import { useEffect, useRef, RefObject } from "react";
import type { ECharts } from "echarts";

/**
 * Hook to automatically resize ECharts instance when container size changes
 */
export function useResizeChart(chartInstance: RefObject<ECharts | undefined>) {
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (!chartInstance.current) return;

    const chart = chartInstance.current;
    const dom = chart.getDom();

    if (!dom || !dom.parentElement) return;

    // Create ResizeObserver to watch for container size changes
    resizeObserverRef.current = new ResizeObserver(() => {
      // Use setTimeout to debounce resize calls
      setTimeout(() => {
        if (chartInstance.current) {
          chartInstance.current.resize();
        }
      }, 100);
    });

    // Observe the parent container
    resizeObserverRef.current.observe(dom.parentElement);

    // Also listen to window resize as fallback
    const handleWindowResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    };
    window.addEventListener("resize", handleWindowResize);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [chartInstance]);
}

