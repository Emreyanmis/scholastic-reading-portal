import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Warm primary — slightly softer than pure Scholastic red so the
        // overall app reads as friendly rather than corporate.
        brand: {
          50:  "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          500: "#f43f5e", // rose-500
          600: "#e11d48",
          700: "#be123c",
          800: "#9f1239",
          900: "#7d1d3f",
        },
        // Sunny accent for highlights & illustration.
        sunny: {
          100: "#fef3c7",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
        },
        // Calm secondary — used for "Teacher" badges, info, etc.
        ink: {
          100: "#e0e7ff",
          300: "#a5b4fc",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
        cream: {
          50:  "#fdf8f3",
          100: "#fbf1e6",
          200: "#f4e1c9",
        },
      },
      fontFamily: {
        sans:    ["'Plus Jakarta Sans'", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["'Fraunces'", "'Plus Jakarta Sans'", "ui-serif", "Georgia", "serif"],
        serif:   ["Georgia", "ui-serif", "serif"],
      },
      boxShadow: {
        soft:  "0 2px 8px -2px rgba(15, 23, 42, 0.08), 0 4px 16px -4px rgba(15, 23, 42, 0.06)",
        lift:  "0 8px 30px -10px rgba(15, 23, 42, 0.18), 0 4px 10px -4px rgba(15, 23, 42, 0.08)",
        inner1: "inset 0 1px 0 rgba(255,255,255,0.6)",
      },
      backgroundImage: {
        "warm-grad":   "radial-gradient(1200px 600px at 10% -10%, #ffe4e6 0%, transparent 60%), radial-gradient(900px 600px at 110% 10%, #fef3c7 0%, transparent 55%), linear-gradient(180deg, #fdf8f3 0%, #fffaf3 100%)",
        "brand-grad":  "linear-gradient(135deg, #f43f5e 0%, #e11d48 50%, #be185d 100%)",
        "sunny-grad":  "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
        "ink-grad":    "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
      },
      keyframes: {
        "fade-in":   { "0%": { opacity: "0", transform: "translateY(4px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "float":     { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out both",
        "float":   "float 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
