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
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: 'rgb(20, 184, 166)',
          light: 'rgb(45, 212, 191)',
          dark: 'rgb(13, 148, 136)',
        },
        secondary: {
          DEFAULT: 'rgb(6, 182, 212)',
          light: 'rgb(34, 211, 238)',
          dark: 'rgb(8, 145, 178)',
        },
      },
      backgroundImage: {
        'gradient-dark': 'linear-gradient(to right, rgb(17, 24, 39), rgb(15, 23, 42), rgb(19, 78, 74))',
        'gradient-dark-radial': 'radial-gradient(circle at top right, rgb(19, 78, 74), rgb(15, 23, 42), rgb(17, 24, 39))',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        heading: ['var(--font-space-grotesk)', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['var(--font-poppins)', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
