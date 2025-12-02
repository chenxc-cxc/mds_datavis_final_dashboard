import { DatePicker } from "antd";
import { CalendarOutlined } from "@ant-design/icons";
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
  数据集全部: [dayjs("2015-05-01").startOf("day"), dayjs("2015-09-30").endOf("day")],
  "2015年5-7月": [dayjs("2015-05-01").startOf("day"), dayjs("2015-07-31").endOf("day")],
  "2015年6-9月": [dayjs("2015-06-01").startOf("day"), dayjs("2015-09-30").endOf("day")],
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
      className="glass rounded-2xl p-6 border border-glass-border relative overflow-hidden group"
    >
      {/* 渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <CalendarOutlined className="text-primary text-lg" />
          <span className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
            时间范围筛选
          </span>
        </div>
        
        <RangePicker
          value={value}
          onChange={onChange}
          format="YYYY-MM-DD"
          size="large"
          className="w-full"
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            border: "1px solid rgba(59, 130, 246, 0.2)",
            borderRadius: "12px",
          }}
          presets={[
            {
              label: "数据集全部",
              value: quickRanges.数据集全部,
            },
            {
              label: "2015年5-7月",
              value: quickRanges["2015年5-7月"],
            },
            {
              label: "2015年6-9月",
              value: quickRanges["2015年6-9月"],
            },
            {
              label: "最近三个月",
              value: quickRanges.最近三个月,
            },
          ]}
        />
        
        <div className="flex flex-wrap gap-2 mt-4">
          {Object.keys(quickRanges).map((range) => {
            const isActive =
              value &&
              value[0]?.format("YYYY-MM-DD") === quickRanges[range][0].format("YYYY-MM-DD") &&
              value[1]?.format("YYYY-MM-DD") === quickRanges[range][1].format("YYYY-MM-DD");

            return (
              <motion.button
                key={range}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleQuickSelect(range)}
                className={`
                  px-4 py-2 text-xs font-medium rounded-xl
                  transition-all duration-200
                  ${
                    isActive
                      ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/30"
                      : "bg-white/60 hover:bg-white/90 text-slate-700 border border-slate-200 hover:border-primary/50"
                  }
                `}
              >
                {range}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

