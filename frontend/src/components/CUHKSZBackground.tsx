import "./CUHKSZIcon.css";

// 背景图标配置参数 - 可以在这里统一调整所有图标的透明度、位置和大小
const BACKGROUND_CONFIG = {
  // 中心图标配置
  center: {
    size: 500,              // 图标大小（像素）
    opacity: 0.10,          // 透明度（0-1），值越小越透明
    position: {              // 位置配置
      top: "50%",           // 可以使用 "50%", "20%", "100px" 等
      left: "50%",          // 可以使用 "50%", "20%", "100px" 等
      transform: "translate(-50%, -50%)", // 居中变换，可以改为 "none" 取消居中
    },
  },
  // 角落图标配置
  corners: {
    size: 200,              // 图标大小（像素）
    opacity: 0.00,          // 透明度（0-1），值越小越透明
    offset: 20,             // 距离边缘的距离（Tailwind 单位，如 20 = 5rem = 80px）
  },
  // 网格背景配置
  grid: {
    enabled: true,           // 是否显示网格
    opacity: 0.01,          // 网格线透明度
    spacing: 200,           // 网格间距（像素）
  },
};

export function CUHKSZBackground() {
  const { center, corners, grid } = BACKGROUND_CONFIG;
  // 计算图标内部元素尺寸
  const centerWingSize = center.size * 0.67; // 80px for 120px
  const centerFontSize = center.size * 0.167; // 20px for 120px
  const centerSmallFontSize = center.size * 0.117; // 14px for 120px
  const centerBorderRadius = center.size * 0.2; // 24px for 120px

  const cornerWingSize = corners.size * 0.67;
  const cornerFontSize = corners.size * 0.167;
  const cornerSmallFontSize = corners.size * 0.117;
  const cornerBorderRadius = corners.size * 0.2;

  // 渲染单个图标的函数
  const renderIcon = (
    size: number,
    wingSize: number,
    fontSize: number,
    smallFontSize: number,
    borderRadius: number
  ) => (
    <div
      className="cuhksz-icon-container"
      style={{
        width: size,
        height: size,
        borderRadius: borderRadius,
      }}
    >
      <div className="cuhksz-bg-gradient"></div>
      <div className="cuhksz-wing" style={{ width: wingSize, height: wingSize }}></div>
      <div className="cuhksz-logo-text" style={{ fontSize: fontSize }}>
        <span>CUHK</span>
        <span style={{ fontSize: smallFontSize, color: "#9f7cab" }}>SZ</span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* 网格背景 */}
      {grid.enabled && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent ${grid.spacing}px,
              rgba(101, 45, 138, ${grid.opacity}) ${grid.spacing}px,
              rgba(101, 45, 138, ${grid.opacity}) ${grid.spacing + 1}px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent ${grid.spacing}px,
              rgba(101, 45, 138, ${grid.opacity}) ${grid.spacing}px,
              rgba(101, 45, 138, ${grid.opacity}) ${grid.spacing + 1}px
            )`,
          }}
        />
      )}

      {/* 中心大图标 */}
      <div
        className="absolute"
        style={{
          top: center.position.top,
          left: center.position.left,
          transform: center.position.transform,
          opacity: center.opacity,
        }}
      >
        {renderIcon(
          center.size,
          centerWingSize,
          centerFontSize,
          centerSmallFontSize,
          centerBorderRadius
        )}
      </div>

      {/* 四个角落的小图标 */}
      <div
        className="absolute"
        style={{
          top: `${corners.offset * 4}px`, // Tailwind 单位转换为 px (1 = 4px)
          left: `${corners.offset * 4}px`,
          opacity: corners.opacity,
        }}
      >
        {renderIcon(
          corners.size,
          cornerWingSize,
          cornerFontSize,
          cornerSmallFontSize,
          cornerBorderRadius
        )}
      </div>

      <div
        className="absolute"
        style={{
          top: `${corners.offset * 4}px`,
          right: `${corners.offset * 4}px`,
          opacity: corners.opacity,
        }}
      >
        {renderIcon(
          corners.size,
          cornerWingSize,
          cornerFontSize,
          cornerSmallFontSize,
          cornerBorderRadius
        )}
      </div>

      <div
        className="absolute"
        style={{
          bottom: `${corners.offset * 4}px`,
          left: `${corners.offset * 4}px`,
          opacity: corners.opacity,
        }}
      >
        {renderIcon(
          corners.size,
          cornerWingSize,
          cornerFontSize,
          cornerSmallFontSize,
          cornerBorderRadius
        )}
      </div>

      <div
        className="absolute"
        style={{
          bottom: `${corners.offset * 4}px`,
          right: `${corners.offset * 4}px`,
          opacity: corners.opacity,
        }}
      >
        {renderIcon(
          corners.size,
          cornerWingSize,
          cornerFontSize,
          cornerSmallFontSize,
          cornerBorderRadius
        )}
      </div>
    </div>
  );
}

