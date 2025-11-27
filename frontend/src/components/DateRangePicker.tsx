import { DatePicker, Space } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { motion } from "framer-motion";

const { RangePicker } = DatePicker;

type DateRangePickerProps = {
  value?: [Dayjs | null, Dayjs | null] | null;
  onChange?: (dates: [Dayjs | null, Dayjs | null] | null) => void;
  onQuickSelect?: (range: string) => void;
};

const quickRanges: Record<string, [Dayjs, Dayjs]> = {
  今天: [dayjs().startOf("day"), dayjs().endOf("day")],
  昨天: [dayjs().subtract(1, "day").startOf("day"), dayjs().subtract(1, "day").endOf("day")],
  最近7天: [dayjs().subtract(6, "day").startOf("day"), dayjs().endOf("day")],
  最近30天: [dayjs().subtract(29, "day").startOf("day"), dayjs().endOf("day")],
  本月: [dayjs().startOf("month"), dayjs().endOf("month")],
  上月: [dayjs().subtract(1, "month").startOf("month"), dayjs().subtract(1, "month").endOf("month")],
};

export function DateRangePicker({ value, onChange, onQuickSelect }: DateRangePickerProps) {
  const handleQuickSelect = (range: string) => {
    const dates = quickRanges[range];
    if (dates && onChange) {
      onChange([dates[0], dates[1]]);
    }
    if (onQuickSelect) {
      onQuickSelect(range);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-3"
    >
      <Space direction="vertical" className="w-full">
        <span className="text-xs text-muted uppercase tracking-widest font-semibold">时间范围</span>
        <RangePicker
          value={value}
          onChange={onChange}
          format="YYYY-MM-DD"
          size="large"
          className="w-full"
          style={{
            background: "rgba(255, 255, 255, 0.9)",
          }}
          presets={[
            {
              label: "今天",
              value: quickRanges.今天,
            },
            {
              label: "昨天",
              value: quickRanges.昨天,
            },
            {
              label: "最近7天",
              value: quickRanges.最近7天,
            },
            {
              label: "最近30天",
              value: quickRanges.最近30天,
            },
            {
              label: "本月",
              value: quickRanges.本月,
            },
            {
              label: "上月",
              value: quickRanges.上月,
            },
          ]}
        />
      </Space>
      <div className="flex flex-wrap gap-2">
        {Object.keys(quickRanges).map((range) => (
          <motion.button
            key={range}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleQuickSelect(range)}
            className="px-3 py-1 text-xs rounded-lg glass border border-glass-border hover:border-primary transition-colors text-slate-700 hover:text-primary"
          >
            {range}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

