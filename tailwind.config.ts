import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "./packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Vazirmatn", "Tahoma", "Arial", "sans-serif"],
      },
      colors: {
        // Retail (dark) tokens — mirror of --retail-* in globals.css / DESIGN_SYSTEM.md.
        retail: {
          bg: "#05070B",
          surface: "#0D1117",
          "surface-alt": "#141A22",
          border: "#22303D",
          primary: "#F5F7FA",
          secondary: "#9BA7B4",
          muted: "#6B7787",
          accent: "#00D9FF",
          "accent-hover": "#63E6FF",
          "accent-2": "#20F28B",
        },
      },
      borderRadius: {
        retail: "14px",
      },
      boxShadow: {
        "retail-lg": "0 18px 44px rgba(0, 0, 0, 0.55)",
      },
    },
  },
  plugins: [],
};

export default config;
