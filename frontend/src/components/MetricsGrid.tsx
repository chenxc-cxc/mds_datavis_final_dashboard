import { motion } from "framer-motion";
import CountUp from "react-countup";

type Props = {
  metrics: Record<string, number>;
};

const friendlyNames: Record<string, string> = {
  view: "浏览量",
  addtocart: "加购量",
  transaction: "购买量",
};

const metricConfig: Record<string, { color: string; gradient: string; icon: string }> = {
  view: {
    color: "#3b82f6",
    gradient: "from-primary to-primary-dark",
    icon: "👁️",
  },
  addtocart: {
    color: "#ec4899",
    gradient: "from-accent to-accent-glow",
    icon: "🛒",
  },
  transaction: {
    color: "#10b981",
    gradient: "from-success to-success-glow",
    icon: "💰",
  },
};

// 定义固定的指标顺序：浏览、加购、购买
const metricOrder: string[] = ["view", "addtocart", "transaction"];

// 圆形进度环组件
const CircularProgress = ({ 
  percentage, 
  color, 
  size = 80 
}: { 
  percentage: number; 
  color: string; 
  size?: number;
}) => {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          className="text-gray-200"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold" style={{ color }}>
          {percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  );
};

export function MetricsGrid({ metrics }: Props) {
  // 按照固定顺序获取指标数据
  const entries = metricOrder
    .filter((key) => metrics?.[key] !== undefined)
    .map((key) => [key, metrics[key]] as [string, number]);
  const total = entries.reduce((acc, [, v]) => acc + v, 0) || 1;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {entries.map(([key, value], idx) => {
        const config = metricConfig[key] || metricConfig.view;
        const percentage = Math.min((value / total) * 100, 100);

        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            whileHover={{ scale: 1.03, y: -4 }}
            className="glass rounded-3xl p-6 relative overflow-hidden group"
          >
            <div className="flex items-center gap-6">
              <CircularProgress percentage={percentage} color={config.color} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{config.icon}</span>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    {friendlyNames[key] ?? key}
                  </p>
                </div>
                <motion.p
                  className="text-3xl font-bold"
                  style={{ color: config.color }}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 + 0.2 }}
                >
                  <CountUp
                    end={value || 0}
                    duration={2}
                    separator=","
                    decimals={0}
                    useEasing={true}
                  />
                </motion.p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

