import { useState, useEffect } from "react";
import { Button, Space, Tooltip, Modal } from "antd";
import { FullscreenOutlined, FullscreenExitOutlined, DownloadOutlined, ReloadOutlined } from "@ant-design/icons";
import html2canvas from "html2canvas";
import { motion } from "framer-motion";

type ChartToolbarProps = {
  chartId: string;
  chartTitle?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
};

export function ChartToolbar({ chartId, chartTitle = "图表", onRefresh, isRefreshing = false }: ChartToolbarProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleFullscreen = () => {
    const element = document.getElementById(chartId);
    if (!element) return;

    if (!isFullscreen) {
      if (element.requestFullscreen) {
        element.requestFullscreen().catch((err) => {
          console.error("无法进入全屏:", err);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleExport = async () => {
    const element = document.getElementById(chartId);
    if (!element) return;

    setIsExporting(true);
    try {
      // 等待一小段时间确保图表完全渲染
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 方法1: 尝试直接找到 ECharts 的 canvas 元素
      const canvasElement = element.querySelector('canvas');
      if (canvasElement) {
        // 直接使用 canvas 导出，不会有错位问题
        const link = document.createElement("a");
        link.download = `${chartTitle}_${new Date().getTime()}.png`;
        link.href = canvasElement.toDataURL("image/png", 1.0);
        link.click();
        setIsExporting(false);
        return;
      }

      // 方法2: 如果找不到 canvas，尝试找到图表容器（包含图表的 div）
      const chartContainer = element.querySelector('[style*="width"][style*="height"]') as HTMLElement;
      const targetElement = chartContainer || element;

      // 获取目标元素的实际位置和尺寸
      const rect = targetElement.getBoundingClientRect();
      
      const canvas = await html2canvas(targetElement, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: false,
        width: rect.width,
        height: rect.height,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        // 只捕获可见区域
        ignoreElements: (el) => {
          // 忽略工具栏、标题等不需要的元素
          return el.classList.contains('ant-card-extra') || 
                 el.classList.contains('ant-card-head') ||
                 el.classList.contains('drag-handle') ||
                 el.tagName === 'BUTTON';
        },
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById(chartId);
          if (clonedElement) {
            // 重置所有可能影响布局的样式
            clonedElement.style.transform = 'none';
            clonedElement.style.position = 'relative';
            clonedElement.style.top = '0';
            clonedElement.style.left = '0';
            
            // 隐藏不需要的元素
            const extra = clonedElement.querySelector('.ant-card-extra');
            if (extra) (extra as HTMLElement).style.display = 'none';
            const header = clonedElement.querySelector('.ant-card-head');
            if (header) (header as HTMLElement).style.display = 'none';
          }
        },
      });

      const link = document.createElement("a");
      link.download = `${chartTitle}_${new Date().getTime()}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
    } catch (error) {
      console.error("导出失败:", error);
      Modal.error({
        title: "导出失败",
        content: "无法导出图表，请稍后重试",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2"
    >
      <Space size="small">
        {onRefresh && (
          <Tooltip title="刷新数据">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                type="text"
                icon={<ReloadOutlined spin={isRefreshing} />}
                onClick={onRefresh}
                loading={isRefreshing}
                className="text-slate-600 hover:text-primary"
              />
            </motion.div>
          </Tooltip>
        )}
        <Tooltip title={isFullscreen ? "退出全屏" : "全屏查看"}>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              type="text"
              icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={handleFullscreen}
              className="text-slate-600 hover:text-primary"
            />
          </motion.div>
        </Tooltip>
        <Tooltip title="导出图片">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={handleExport}
              loading={isExporting}
              className="text-slate-600 hover:text-primary"
            />
          </motion.div>
        </Tooltip>
      </Space>
    </motion.div>
  );
}

