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
        background: "#060609",
        foreground: "#FFFFFF",
        primary: {
          DEFAULT: "#E50914",
          dark: "#B00000",
          light: "#FF1A1A",
        },
        secondary: {
          DEFAULT: "#111118",
          light: "#1A1A28",
          dark: "#0A0A10",
        },
        surface: {
          DEFAULT: "#0E0E16",
          2: "#14141E",
          3: "#1A1A28",
        },
        accent: { DEFAULT: "#E50914" },
        muted: {
          DEFAULT: "#111118",
          foreground: "#9CA3AF",
        },
        card: {
          DEFAULT: "#111118",
          foreground: "#FFFFFF",
        },
        border: "#1E1E2A",
        input: "#1E1E2A",
        ring: "#E50914",
        destructive: {
          DEFAULT: "#E50914",
          foreground: "#FFFFFF",
        },
        success: "#22C55E",
        warning: "#F59E0B",
        info: "#3B82F6",
        gold: "#FFD700",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        heading: ["'Barlow Condensed'", "'Rajdhani'", "sans-serif"],
        condensed: ["'Barlow Condensed'", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "fade-in-up": "fadeInUp 0.6s ease forwards",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "slide-left": "slideLeft 0.3s ease-out",
        "pulse-red": "pulseRed 2s infinite",
        "spin-slow": "spin 3s linear infinite",
        shimmer: "shimmer 2s infinite",
        ticker: "ticker 30s linear infinite",
        marquee: "marquee 35s linear infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideLeft: {
          "0%": { transform: "translateX(20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        pulseRed: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(229, 9, 20, 0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(229, 9, 20, 0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0) translateX(0)" },
          "33%": { transform: "translateY(-20px) translateX(10px)" },
          "66%": { transform: "translateY(10px) translateX(-10px)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-red": "linear-gradient(135deg, #E50914 0%, #B00000 100%)",
        "gradient-dark": "linear-gradient(135deg, #111118 0%, #060609 100%)",
        "hero-gradient": "linear-gradient(to right, rgba(6,6,9,0.99) 45%, transparent 100%)",
        "grid-pattern": "linear-gradient(rgba(229,9,20,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(229,9,20,0.04) 1px, transparent 1px)",
      },
      boxShadow: {
        red: "0 4px 20px rgba(229, 9, 20, 0.4)",
        "red-lg": "0 8px 32px rgba(229, 9, 20, 0.5)",
        "red-xl": "0 16px 48px rgba(229, 9, 20, 0.4)",
        card: "0 2px 12px rgba(0,0,0,0.5)",
        "card-hover": "0 12px 40px rgba(229, 9, 20, 0.2)",
        gold: "0 4px 20px rgba(255, 215, 0, 0.4)",
        neon: "0 0 10px rgba(229,9,20,0.6), 0 0 30px rgba(229,9,20,0.3)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
