import { DatePicker, Space } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { motion } from "framer-motion";

const { RangePicker } = DatePicker;

type DateRangePickerProps = {
  value?: [Dayjs | null, Dayjs | null] | null;
  onChange?: (dates: [Dayjs | null, Dayjs | null] | null) => void;
  onQuickSelect?: (range: string) => void;
};

// 数据集时间范围：2015年5月到9月
const quickRanges: Record<string, [Dayjs, Dayjs]> = {
  全部: [dayjs("2015-05-01").startOf("day"), dayjs("2015-09-30").endOf("day")],
  "5-7月": [dayjs("2015-05-01").startOf("day"), dayjs("2015-07-31").endOf("day")],
  "6-9月": [dayjs("2015-06-01").startOf("day"), dayjs("2015-09-30").endOf("day")],
  最近三个月: [dayjs().subtract(3, "month").startOf("month"), dayjs().endOf("month")],
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
              label: "全部",
              value: quickRanges.全部,
            },
            {
              label: "5-7月",
              value: quickRanges["5-7月"],
            },
            {
              label: "6-9月",
              value: quickRanges["6-9月"],
            },
            {
              label: "最近三个月",
              value: quickRanges.最近三个月,
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

