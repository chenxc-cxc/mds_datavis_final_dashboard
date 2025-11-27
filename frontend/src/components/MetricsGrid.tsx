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

export function MetricsGrid({ metrics }: Props) {
  const entries = Object.entries(metrics ?? {});
  const total = entries.reduce((acc, [, v]) => acc + v, 0) || 1;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {entries.map(([key, value], idx) => {
        const config = metricConfig[key] || metricConfig.view;
        const percentage = Math.min((value / total) * 100, 100);

        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            whileHover={{ scale: 1.02, y: -4 }}
            className="glass rounded-2xl p-6 shadow-card glass-hover transition-all duration-300 relative overflow-hidden group"
          >
            {/* 光效背景 */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${config.color}15, transparent 70%)`,
              }}
            />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <motion.div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-2xl shadow-glow`}
                  whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  {config.icon}
                </motion.div>
                <div className="text-right">
                  <p className="text-muted text-xs uppercase tracking-widest font-semibold mb-1">
                    {friendlyNames[key] ?? key}
                  </p>
                  <motion.p
                    className="text-4xl font-bold"
                    style={{
                      color: config.color,
                      textShadow: `0 0 20px ${config.color}40`,
                    }}
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
              <div className="h-1 bg-surface-3 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full relative"
                  style={{
                    background: `linear-gradient(90deg, ${config.color}, ${config.color}80)`,
                    boxShadow: `0 0 10px ${config.color}60`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1.5, delay: idx * 0.1 + 0.3, ease: "easeOut" }}
                >
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${config.color}40, transparent)`,
                    }}
                    animate={{
                      x: ["-100%", "100%"],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1,
                    }}
                  />
                </motion.div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

