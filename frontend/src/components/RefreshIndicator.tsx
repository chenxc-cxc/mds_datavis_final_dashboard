import { motion, AnimatePresence } from "framer-motion";
import { ReloadOutlined, CheckCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

type RefreshIndicatorProps = {
  lastUpdated?: Date | null;
  isRefreshing?: boolean;
  onRefresh?: () => void;
};

export function RefreshIndicator({ lastUpdated, isRefreshing = false, onRefresh }: RefreshIndicatorProps) {
  const timeAgo = lastUpdated ? dayjs(lastUpdated).fromNow() : "从未";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 px-4 py-2"
      style={{ marginTop: "-10px" }}
    >
      <AnimatePresence mode="wait">
        {isRefreshing ? (
          <motion.div
            key="refreshing"
            initial={{ opacity: 0, rotate: -180 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 180 }}
            transition={{ duration: 0.3 }}
            
          >
            <ReloadOutlined spin className="text-primary" />
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <CheckCircleOutlined className="text-success" />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex flex-col">
        <span className="text-xs text-muted">最后更新 {timeAgo}</span>
        {/* <span className="text-xs font-semibold text-slate-700">{timeAgo}</span> */}
      </div>
      {onRefresh && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onRefresh}
          disabled={isRefreshing}
          className="ml-2 p-1 rounded hover:bg-primary/10 transition-colors disabled:opacity-50"
        >
          <ReloadOutlined className="text-primary" />
        </motion.button>
      )}
    </motion.div>
  );
}


