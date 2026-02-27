import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      keyframes: {
        "pulse-highlight": {
          "0%, 100%": { boxShadow: "0 0 0 0 transparent" },
          "50%": { boxShadow: "0 0 0 4px rgba(251, 191, 36, 0.4)" },
        },
      },
      animation: {
        "pulse-highlight": "pulse-highlight 0.8s ease-in-out 2",
      },
    },
  },
  plugins: [],
};
export default config;
