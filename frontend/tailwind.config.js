/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",
        "primary-dark": "#2563eb",
        "primary-glow": "#60a5fa",
        accent: "#ec4899",
        "accent-glow": "#f472b6",
        secondary: "#8b5cf6",
        "secondary-glow": "#a78bfa",
        success: "#10b981",
        "success-glow": "#34d399",
        warning: "#f59e0b",
        "warning-glow": "#fbbf24",
        muted: "#64748b",
        "surface-1": "#f8fafc",
        "surface-2": "#ffffff",
        "surface-3": "#f1f5f9",
        "glass-bg": "rgba(255, 255, 255, 0.9)",
        "glass-border": "rgba(59, 130, 246, 0.2)",
      },
      boxShadow: {
        card: "0 4px 16px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(59, 130, 246, 0.1)",
        "card-hover": "0 8px 24px rgba(59, 130, 246, 0.15), 0 0 0 1px rgba(59, 130, 246, 0.2)",
        glow: "0 0 20px rgba(59, 130, 246, 0.3)",
        "glow-accent": "0 0 20px rgba(236, 72, 153, 0.3)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "mesh-gradient": "linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-down": "slideDown 0.5s ease-out",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0, 212, 255, 0.5)" },
          "50%": { boxShadow: "0 0 40px rgba(0, 212, 255, 0.8)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
      },
    },
  },
  plugins: [],
};

