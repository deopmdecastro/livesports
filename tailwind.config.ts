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
        background: "#0A0A0A",
        foreground: "#FFFFFF",
        primary: {
          DEFAULT: "#E50914",
          dark: "#B00000",
          light: "#FF1A1A",
        },
        secondary: {
          DEFAULT: "#1A1A1A",
          light: "#2A2A2A",
          dark: "#0F0F0F",
        },
        accent: {
          DEFAULT: "#E50914",
        },
        muted: {
          DEFAULT: "#1A1A1A",
          foreground: "#9CA3AF",
        },
        card: {
          DEFAULT: "#1A1A1A",
          foreground: "#FFFFFF",
        },
        border: "#2A2A2A",
        input: "#2A2A2A",
        ring: "#E50914",
        destructive: {
          DEFAULT: "#E50914",
          foreground: "#FFFFFF",
        },
        success: "#22C55E",
        warning: "#F59E0B",
        info: "#3B82F6",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        heading: ["Poppins", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "slide-left": "slideLeft 0.3s ease-out",
        "pulse-red": "pulseRed 2s infinite",
        "spin-slow": "spin 3s linear infinite",
        shimmer: "shimmer 2s infinite",
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
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-red": "linear-gradient(135deg, #E50914 0%, #B00000 100%)",
        "gradient-dark": "linear-gradient(135deg, #1A1A1A 0%, #0A0A0A 100%)",
        "hero-gradient": "linear-gradient(to right, rgba(10,10,10,0.95) 40%, transparent 100%)",
      },
      boxShadow: {
        "red": "0 4px 14px rgba(229, 9, 20, 0.4)",
        "red-lg": "0 8px 24px rgba(229, 9, 20, 0.5)",
        "card": "0 2px 8px rgba(0,0,0,0.5)",
        "card-hover": "0 8px 32px rgba(229, 9, 20, 0.2)",
      },
    },
  },
  plugins: [],
};

export default config;
