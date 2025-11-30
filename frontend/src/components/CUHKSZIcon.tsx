import "./CUHKSZIcon.css";

type CUHKSZIconProps = {
  size?: number;
  className?: string;
};

export function CUHKSZIcon({ size = 48, className = "" }: CUHKSZIconProps) {
  return (
    <div
      className={`cuhksz-icon-container ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.2, // 24px for 120px, proportional
      }}
    >
      <div className="cuhksz-bg-gradient"></div>
      <div
        className="cuhksz-wing"
        style={{
          width: size * 0.67, // 80px for 120px
          height: size * 0.67,
        }}
      ></div>
      <div
        className="cuhksz-logo-text"
        style={{
          fontSize: size * 0.167, // 20px for 120px
        }}
      >
        <span>CUHK</span>
        <span
          style={{
            fontSize: size * 0.117, // 14px for 120px
            color: "#9f7cab",
          }}
        >
          SZ
        </span>
      </div>
    </div>
  );
}

