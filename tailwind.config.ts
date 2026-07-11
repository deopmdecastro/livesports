import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#030409",
        foreground: "#F2F3F8",
        primary: {
          DEFAULT: "#E50914",
          600: "#C40711",
          500: "#E50914",
          400: "#F02D36",
        },
        surface: {
          DEFAULT: "#0F111C",
          raised: "#0A0C14",
          hover: "#151725",
        },
        border: {
          subtle: "#1A1C2A",
          DEFAULT: "#232538",
          strong: "#2E3148",
        },
        muted: {
          DEFAULT: "#575B72",
          foreground: "#80849C",
        },
        accent: {
          blue: "#E50914",
          emerald: "#10B981",
          amber: "#F59E0B",
          purple: "#8B5CF6",
          rose: "#F43F5E",
          cyan: "#06B6D4",
          gold: "#FFD700",
        },
        destructive: { DEFAULT: "#E50914", foreground: "#FFFFFF" },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["'Barlow Condensed'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
      },
      boxShadow: {
        brand: "0 0 24px rgba(229, 9, 20, 0.30)",
        "brand-lg": "0 0 40px rgba(229, 9, 20, 0.35)",
        blue: "0 0 24px rgba(229, 9, 20, 0.2)",
        gold: "0 0 24px rgba(255, 215, 0, 0.15)",
      },
      animation: {
        "fade-up": "fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
        "scale-in": "scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        shimmer: "shimmer 1.8s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "ticker-scroll": "tickerScroll 35s linear infinite",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
