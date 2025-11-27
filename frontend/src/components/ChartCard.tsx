import { Card, Typography } from "antd";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { ChartToolbar } from "./ChartToolbar";

type ChartCardProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  glowColor?: "primary" | "accent" | "secondary" | "success";
  chartId?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
};

export function ChartCard({
  title,
  subtitle,
  action,
  children,
  glowColor = "primary",
  chartId,
  onRefresh,
  isRefreshing,
}: ChartCardProps) {
  const glowClasses = {
    primary: "hover:shadow-glow",
    accent: "hover:shadow-glow-accent",
    secondary: "hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]",
    success: "hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]",
  };

  const chartIdWithFallback = chartId || `chart-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card
        id={chartIdWithFallback}
        className={`glass shadow-card rounded-2xl border-0 glass-hover transition-all duration-300 h-full relative overflow-hidden group mouse-glow ${glowClasses[glowColor]}`}
        styles={{
          body: { padding: "1.5rem", background: "transparent", height: "100%" },
          header: { background: "transparent", borderBottom: "1px solid rgba(59, 130, 246, 0.2)" },
        }}
        onMouseMove={(e) => {
          const card = e.currentTarget;
          const rect = card.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          card.style.setProperty("--mouse-x", `${x}%`);
          card.style.setProperty("--mouse-y", `${y}%`);
        }}
        extra={
          <div className="flex items-center gap-2">
            <motion.div
              className="drag-handle cursor-move text-slate-400 hover:text-slate-600 transition-colors"
              whileHover={{ scale: 1.2, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="4" cy="4" r="1.5" />
                <circle cx="12" cy="4" r="1.5" />
                <circle cx="4" cy="12" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
              </svg>
            </motion.div>
            <ChartToolbar
              chartId={chartIdWithFallback}
              chartTitle={title}
              onRefresh={onRefresh}
              isRefreshing={isRefreshing}
            />
            {action}
          </div>
        }
      >
        {/* 光效背景 */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(59, 130, 246, 0.15), transparent 70%)`,
          }}
        />
        {/* 边框光效 */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))`,
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            padding: "2px",
          }}
        />
        <div className="relative z-10 h-full flex flex-col">
          <motion.div
            className="mb-4 flex-shrink-0"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Typography.Title level={4} className="!mb-1 !text-slate-800 text-gradient">
              {title}
            </Typography.Title>
            {subtitle && (
              <Typography.Text className="text-sm text-slate-600">{subtitle}</Typography.Text>
            )}
          </motion.div>
          <motion.div
            className="relative flex-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ minHeight: 0 }}
          >
            {children}
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
}

