import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Afacad Flux", "Avenir Next", "Segoe UI", "sans-serif"],
        // Display: Cormorant Garamond — serif Garamond cổ điển, có subset
        // Vietnamese (đủ dấu) + latin, nên hiển thị đẹp cho cả EN lẫn VI.
        // Biến thể 300–700 kèm italic cho tiêu đề lớn / eyebrow chữ nghiêng.
        serif: [
          "Cormorant Garamond",
          "EB Garamond",
          "Garamond",
          "Times New Roman",
          "serif",
        ],
      },
      // Thang chữ gốc của Tailwind được đẩy lên +2px cho mọi bậc
      // (12→14, 14→16, 16→18, 20→22…) vì bản dựng theo design drop hơi nhỏ.
      // Cặp line-height cũng +2px để giữ đúng nhịp dòng của design; các bậc
      // 5xl trở lên dùng line-height 1 như mặc định. Muốn đổi mức tăng
      // (ví dụ +3px) thì chỉ sửa khối này — các `text-*` dùng giá trị tuỳ ý
      // trong component (`text-[15px]`, clamp…) phải chỉnh tay tương ứng.
      fontSize: {
        xs: ["0.875rem", { lineHeight: "1.125rem" }], // 14 / 18
        sm: ["1rem", { lineHeight: "1.375rem" }], // 16 / 22
        base: ["1.125rem", { lineHeight: "1.625rem" }], // 18 / 26
        lg: ["1.25rem", { lineHeight: "1.875rem" }], // 20 / 30
        xl: ["1.375rem", { lineHeight: "1.875rem" }], // 22 / 30
        "2xl": ["1.625rem", { lineHeight: "2.125rem" }], // 26 / 34
        "3xl": ["2rem", { lineHeight: "2.375rem" }], // 32 / 38
        "4xl": ["2.375rem", { lineHeight: "2.625rem" }], // 38 / 42
        "5xl": ["3.125rem", { lineHeight: "1" }], // 50
        "6xl": ["3.875rem", { lineHeight: "1" }], // 62
        "7xl": ["4.625rem", { lineHeight: "1" }], // 74
        "8xl": ["6.125rem", { lineHeight: "1" }], // 98
        "9xl": ["8.125rem", { lineHeight: "1" }], // 130
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
