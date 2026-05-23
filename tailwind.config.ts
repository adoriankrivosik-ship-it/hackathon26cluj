import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0f4c5c",
          light: "#1a6b7d",
          dark: "#0a3540",
        },
        surface: {
          DEFAULT: "#f8fafb",
          elevated: "#ffffff",
        },
      },
      transitionDuration: {
        panel: "220ms",
        220: "220ms",
      },
      boxShadow: {
        panel: "0 -4px 24px rgba(15, 76, 92, 0.12)",
        pin: "0 2px 8px rgba(0, 0, 0, 0.2)",
      },
    },
  },
  plugins: [],
};

export default config;
