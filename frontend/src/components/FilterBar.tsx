import { Segmented, Select, Slider, Space, Tooltip } from "antd";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import type { SegmentSummary, SegmentName, EventMetric } from "../api/types";

type Props = {
  segment: SegmentName;
  onSegmentChange: (value: SegmentName) => void;
  metric: EventMetric;
  onMetricChange: (value: EventMetric) => void;
  topN: number;
  onTopNChange: (value: number) => void;
  segmentsSummary?: SegmentSummary[];
};

// 定义固定的指标顺序：浏览、加购、购买
const metricOptions = [
  { label: "浏览量", value: "view" },
  { label: "加购量", value: "addtocart" },
  { label: "购买量", value: "transaction" },
];

const fallbackSegments: SegmentSummary[] = [
  { segment: "All", user_count: 0 },
  { segment: "Hesitant", user_count: 0 },
  { segment: "Impulsive", user_count: 0 },
  { segment: "Collector", user_count: 0 },
];

const segmentColors: Record<string, { bg: string; border: string; text: string }> = {
  All: { bg: "bg-gradient-to-br from-primary to-primary-dark", border: "border-primary-glow", text: "text-white" },
  Hesitant: { bg: "bg-gradient-to-br from-warning to-warning-glow", border: "border-warning-glow", text: "text-white" },
  Impulsive: { bg: "bg-gradient-to-br from-accent to-accent-glow", border: "border-accent-glow", text: "text-white" },
  Collector: { bg: "bg-gradient-to-br from-secondary to-secondary-glow", border: "border-secondary-glow", text: "text-white" },
};

// 用户类型说明
const segmentDescriptions: Record<string, string> = {
  All: "所有用户群体的汇总数据",
  Hesitant: "犹豫型用户：浏览较多但转化率较低，需要更多引导",
  Impulsive: "冲动型用户：浏览后快速加购和购买，转化率高",
  Collector: "收藏型用户：喜欢加购但购买决策周期较长",
};

export function FilterBar({
  segment,
  onSegmentChange,
  metric,
  onMetricChange,
  topN,
  onTopNChange,
  segmentsSummary = [],
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass p-6 rounded-3xl shadow-card mb-6 relative overflow-hidden group"
    >
      {/* 光效背景 */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.05), transparent 70%)`,
        }}
      />
      <div className="relative z-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <Space direction="vertical" className="w-full lg:w-1/3">
            <span className="text-xs text-muted uppercase tracking-widest font-semibold">用户群体</span>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Select
                value={segment}
                onChange={onSegmentChange}
                options={(segmentsSummary?.length ? segmentsSummary : fallbackSegments).map((item) => ({
                  label: `${item.segment} (${item.user_count.toLocaleString()})`,
                  value: item.segment,
                }))}
                className="w-full"
                size="large"
                style={{
                  background: "rgba(255, 255, 255, 0.9)",
                }}
              />
            </motion.div>
          </Space>

          <Space direction="vertical" className="w-full lg:w-1/3">
            <span className="text-xs text-muted uppercase tracking-widest font-semibold">排行榜指标</span>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Segmented
                value={metric}
                onChange={(value) => onMetricChange(value as EventMetric)}
                block
                size="large"
                options={metricOptions}
                style={{
                  background: "rgba(255, 255, 255, 0.9)",
                }}
              />
            </motion.div>
          </Space>

          <Space direction="vertical" className="w-full lg:w-1/4">
            <span className="text-xs text-muted uppercase tracking-widest font-semibold">Top N: {topN}</span>
            <motion.div whileHover={{ scale: 1.02 }}>
              <Slider
                min={5}
                max={20}
                step={1}
                value={topN}
                onChange={(value) => onTopNChange(Array.isArray(value) ? value[0] : value)}
                tooltip={{ formatter: (val) => `${val}` }}
                styles={{
                  track: { background: "linear-gradient(90deg, #3b82f6, #8b5cf6)" },
                  handle: { borderColor: "#3b82f6", boxShadow: "0 0 10px rgba(59, 130, 246, 0.3)" },
                }}
              />
            </motion.div>
          </Space>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {(segmentsSummary?.length ? segmentsSummary : fallbackSegments).slice(0, 4).map((seg, idx) => {
            const isActive = seg.segment === segment;
            const colors = segmentColors[seg.segment] || segmentColors.All;
            const description = segmentDescriptions[seg.segment] || "用户群体";
            return (
              <Tooltip
                key={seg.segment}
                title={description}
                placement="top"
                overlayStyle={{ maxWidth: "250px" }}
                overlayInnerStyle={{
                  background: "rgba(26, 31, 58, 0.95)",
                  border: "1px solid rgba(0, 212, 255, 0.3)",
                  borderRadius: "8px",
                  padding: "12px",
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  className={`rounded-2xl p-4 cursor-pointer relative overflow-hidden ${
                    isActive
                      ? `${colors.bg} ${colors.border} border-2 shadow-glow`
                      : "glass border border-glass-border hover:border-primary-glow"
                  }`}
                  onClick={() => onSegmentChange(seg.segment as SegmentName)}
                >
                  {/* 点击波纹效果 */}
                  <motion.div
                    className="absolute inset-0 bg-white opacity-0"
                    whileTap={{
                      opacity: [0, 0.3, 0],
                      scale: [0.8, 1.2, 1],
                    }}
                    transition={{ duration: 0.6 }}
                  />
                  <div className="relative z-10">
                    <div>
                      <div className={isActive ? "text-white/80 text-xs mb-1" : "text-muted text-xs mb-1"}>
                        {seg.segment}
                      </div>
                      <div
                        style={{
                          color: isActive ? "#fff" : "#3b82f6",
                          fontSize: "24px",
                          fontWeight: 700,
                          textShadow: isActive ? "0 0 10px rgba(255,255,255,0.5)" : "none",
                        }}
                      >
                        <CountUp
                          end={seg.user_count}
                          duration={1.5}
                          separator=","
                          decimals={0}
                          useEasing={true}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

