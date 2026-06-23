import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        glass: {
          DEFAULT: "rgba(255,255,255,0.04)",
          hover: "rgba(255,255,255,0.08)",
          active: "rgba(255,255,255,0.12)",
          border: "rgba(255,255,255,0.06)",
          edge: "rgba(255,255,255,0.12)",
        },
      },
      backdropBlur: {
        glass: "60px",
      },
      borderRadius: {
        glass: "24px",
        "glass-lg": "28px",
      },
    },
  },
  plugins: [],
} satisfies Config;
