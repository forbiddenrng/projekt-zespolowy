import type {Config} from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content :[
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--primary)",
        primary_hover: "var(--primary-hover)",
        secondary: "var(--secondary)",
        border: "var(--border)",
        card_background: "var(--card-background)",
        card_border: "var(--card-border)",
        muted: "var(--muted)",
        accent: "var(--accent)",
        error: "var(--error)",
        success: "var(--success)",
        warning: "var(--warning)",
      }
    }
  },
  plugins: [],
};

export default config;