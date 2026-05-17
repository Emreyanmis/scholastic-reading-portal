import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff5f5",
          100: "#ffe3e3",
          500: "#e60000",
          600: "#c50000",
          700: "#a30000",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
