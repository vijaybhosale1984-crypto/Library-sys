/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "serif"],
        body:    ["'DM Sans'", "system-ui", "sans-serif"],
        mono:    ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        ink:   { DEFAULT: "#1a1208", 50: "#fdf8f0", 100: "#f5e6c8", 200: "#e8c97a", 300: "#d4a848" },
        sage:  { DEFAULT: "#4a7c59", light: "#6fa880", dark: "#2d5940" },
        amber: { DEFAULT: "#c8860a", light: "#f0b429", dark: "#8a5c00" },
        cream: { DEFAULT: "#fdf8f0", dark: "#f0e6d0" },
        rust:  { DEFAULT: "#b94040" },
      },
      boxShadow: {
        book: "4px 4px 0 0 rgba(26,18,8,0.15)",
        card: "0 2px 16px rgba(26,18,8,0.10)",
      },
    },
  },
  plugins: [],
};
