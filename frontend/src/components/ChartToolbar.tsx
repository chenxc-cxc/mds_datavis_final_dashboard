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
      const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
      });

      const link = document.createElement("a");
      link.download = `${chartTitle}_${new Date().getTime()}.png`;
      link.href = canvas.toDataURL("image/png");
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

