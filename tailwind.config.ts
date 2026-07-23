import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Amarillo eléctrico — el corazón de la marca
        volt: {
          50: "#fffdf0",
          100: "#fff9d6",
          200: "#fff0a3",
          300: "#ffe566",
          400: "#ffd91f",
          500: "#ffcc00", // primario
          600: "#e6b800",
          700: "#b38f00",
          800: "#806600",
          900: "#4d3d00",
        },
        // Negro profundo con matices
        ink: {
          950: "#050506",
          900: "#0a0a0c",
          850: "#101014",
          800: "#16161c",
          750: "#1d1d25",
          700: "#26262f",
          600: "#32323d",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 24px -4px rgba(255,204,0,0.45)",
        "glow-lg": "0 0 48px -8px rgba(255,204,0,0.5)",
        "card-light": "0 1px 2px rgba(16,16,20,0.04), 0 8px 24px -12px rgba(16,16,20,0.12)",
        "card-light-hover": "0 2px 4px rgba(16,16,20,0.06), 0 16px 40px -16px rgba(16,16,20,0.18)",
      },
      backgroundImage: {
        "volt-gradient": "linear-gradient(135deg, #ffd91f 0%, #ffcc00 45%, #e6b800 100%)",
        "aurora": "radial-gradient(60% 55% at 50% 0%, rgba(255,204,0,0.22) 0%, rgba(255,204,0,0) 70%)",
      },
      keyframes: {
        "pulse-danger": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(239,68,68,0.45)" },
          "50%": { boxShadow: "0 0 0 8px rgba(239,68,68,0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "pulse-danger": "pulse-danger 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
