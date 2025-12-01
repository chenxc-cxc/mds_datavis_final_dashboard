import { useMemo, useState, useEffect } from "react";
import GridLayout from "react-grid-layout";
import type { Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import type { ReactNode } from "react";

type DraggableGridProps = {
  children: ReactNode[];
  cols?: number;
  rowHeight?: number;
  onLayoutChange?: (layout: Layout[]) => void;
};

const STORAGE_KEY = "dashboard-layout";

// 默认布局配置
const getDefaultLayout = (cols: number): Layout[] => [
  // 三个指标卡片：浏览量 / 加购量 / 购买量
  { i: "metric-view", x: 0, y: 0, w: cols / 3, h: 3, minW: 4, minH: 3 },
  { i: "metric-addtocart", x: cols / 3, y: 0, w: cols / 3, h: 3, minW: 4, minH: 3 },
  { i: "metric-transaction", x: (cols * 2) / 3, y: 0, w: cols / 3, h: 3, minW: 4, minH: 3 },
  // 其他图表
  { i: "top-items", x: 0, y: 3, w: cols / 2, h: 6, minW: 4, minH: 4 },
  { i: "top-categories", x: cols / 2, y: 3, w: cols / 2, h: 6, minW: 4, minH: 4 },
  { i: "funnel", x: 0, y: 9, w: cols / 2, h: 6, minW: 4, minH: 4 },
  { i: "active-hours", x: cols / 2, y: 9, w: cols / 2, h: 6, minW: 4, minH: 4 },
  { i: "monthly-retention", x: 0, y: 15, w: cols / 2, h: 6, minW: 4, minH: 4 },
  { i: "weekday-users", x: cols / 2, y: 15, w: cols / 2, h: 6, minW: 4, minH: 4 },
];

export function DraggableGrid({
  children,
  cols = 24,
  rowHeight = 30,
  onLayoutChange,
}: DraggableGridProps) {
  const [layout, setLayout] = useState<Layout[]>(() => {
    // 从 localStorage 加载布局
    const saved = localStorage.getItem(STORAGE_KEY);
    const defaultLayout = getDefaultLayout(cols);
    if (saved) {
      try {
        const savedLayout = (JSON.parse(saved) as Layout[]).filter(
          (item) => item.i !== "metrics" // 迁移旧版本的 metrics 容器
        );
        const savedKeys = new Set(savedLayout.map((item: Layout) => item.i));

        // 合并布局：使用保存的布局，并添加缺失的默认项
        const mergedLayout = [...savedLayout];
        defaultLayout.forEach((defaultItem) => {
          if (!savedKeys.has(defaultItem.i)) {
            mergedLayout.push(defaultItem);
          }
        });
        
        return mergedLayout;
      } catch {
        return defaultLayout;
      }
    }
    return defaultLayout;
  });

  // 当 cols 改变时，调整布局
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const defaultLayout = getDefaultLayout(cols);
    if (!saved) {
      setLayout(defaultLayout);
    } else {
      // 如果保存的布局存在，使用它但调整 x 坐标以适应新的 cols，并添加缺失的项
      try {
        const parsed = (JSON.parse(saved) as Layout[]).filter(
          (item) => item.i !== "metrics" // 迁移旧版本的 metrics 容器
        );
        const savedKeys = new Set(parsed.map((item: Layout) => item.i));

        const adjusted = parsed.map((item: Layout) => ({
          ...item,
          x: Math.min(item.x, cols - item.w),
        }));
        
        // 添加缺失的默认项
        defaultLayout.forEach((defaultItem) => {
          if (!savedKeys.has(defaultItem.i)) {
            adjusted.push(defaultItem);
          }
        });
        
        setLayout(adjusted);
      } catch {
        setLayout(defaultLayout);
      }
    }
  }, [cols]);

  const handleLayoutChange = (newLayout: Layout[]) => {
    setLayout(newLayout);
    // 保存到 localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLayout));
    // 调用外部回调
    onLayoutChange?.(newLayout);
  };

  const chartKeys = useMemo(
    () => [
      "metric-view",
      "metric-addtocart",
      "metric-transaction",
      "top-items",
      "top-categories",
      "funnel",
      "active-hours",
      "monthly-retention",
      "weekday-users",
    ],
    []
  );

  const [width, setWidth] = useState(1200);

  useEffect(() => {
    const updateWidth = () => {
      setWidth(window.innerWidth - 48);
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  return (
    <div className="w-full">
      <GridLayout
        className="layout"
        layout={layout}
        cols={cols}
        rowHeight={rowHeight}
        width={width}
        onLayoutChange={handleLayoutChange}
        isDraggable={true}
        isResizable={true}
        draggableHandle=".drag-handle"
        margin={[24, 24]}
        containerPadding={[0, 0]}
        preventCollision={true}
        compactType={null}
      >
        {children.map((child, index) => (
          <div key={chartKeys[index]} className="relative h-full">
            {child}
          </div>
        ))}
      </GridLayout>
      <style>{`
        .react-grid-layout {
          position: relative;
        }
        .react-grid-item {
          transition: all 200ms ease;
          transition-property: left, top, width, height;
        }
        .react-grid-item.cssTransforms {
          transition-property: transform, width, height;
        }
        .react-grid-item.resizing {
          z-index: 1;
          will-change: width, height;
        }
        .react-grid-item.react-draggable-dragging {
          transition: none;
          z-index: 3;
          will-change: transform;
        }
        .react-grid-item.react-grid-placeholder {
          background: rgba(59, 130, 246, 0.1);
          border: 2px dashed rgba(59, 130, 246, 0.3);
          border-radius: 8px;
          opacity: 0.5;
          transition-duration: 100ms;
          z-index: 2;
          user-select: none;
        }
        .react-resizable-handle {
          position: absolute;
          width: 20px;
          height: 20px;
          bottom: 0;
          right: 0;
          background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNiIgaGVpZ2h0PSI2IiB2aWV3Qm94PSIwIDAgNiA2IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0wIDZINlYwIiBzdHJva2U9IiM5Y2EzYjgiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==');
          background-position: bottom right;
          padding: 0 3px 3px 0;
          background-repeat: no-repeat;
          background-origin: content-box;
          box-sizing: border-box;
          cursor: se-resize;
        }
        .react-resizable-handle:hover {
          background-color: rgba(59, 130, 246, 0.1);
        }
      `}</style>
    </div>
  );
}

