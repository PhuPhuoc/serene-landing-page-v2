import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Afacad Flux", "Avenir Next", "Segoe UI", "sans-serif"],
        serif: ["Jost", "Futura", "Century Gothic", "sans-serif"],
      },
      colors: {
        // Main palette
        cream: "#F2E9DA",
        dark: "#33261A",
        primary: "#795B3C",
        "primary-hover": "#BA805C",
        muted: "#998369",
        // Supporting colors
        "warm-50": "#FFFDF9",
        "warm-100": "#F8F2E8",
        "warm-200": "#F4E1DA",
        "warm-300": "#EFE3D1",
        "warm-400": "#E8DAC4",
        "warm-500": "#E3D3BA",
        "warm-600": "#D6C4AA",
        "warm-700": "#BA805C",
        "warm-800": "#8A7359",
        "warm-900": "#6B5641",
        // Specific use cases
        error: {
          DEFAULT: "#9A3B2A",
          light: "#7A2E20",
          bg: "#F4E1DA",
          border: "#D9A898",
        },
      },
      maxWidth: {
        container: "1440px",
        content: "1280px",
      },
      letterSpacing: {
        wide: "0.03em",
        wider: "0.08em",
        widest: "0.16em",
        label: "0.18em",
      },
      boxShadow: {
        card: "0 24px 48px -28px rgba(42,32,25,0.45)",
        dropdown: "0 12px 32px rgba(42,32,25,0.14)",
        modal: "0 30px 80px rgba(42,32,25,0.3)",
      },
      animation: {
        "fade-in": "fadeIn 420ms ease both",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0.001", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "none" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
