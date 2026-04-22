/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#E23744", dark: "#C41E3A", light: "#FFE5E8" },
        sidebar: "#0F172A",
        sidebarHover: "#1E293B",
        ink: "#0F172A",
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
        hover: "0 10px 30px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};
