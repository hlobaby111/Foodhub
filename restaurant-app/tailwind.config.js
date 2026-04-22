/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#E23744",
          dark: "#C41E3A",
          light: "#FFE5E8",
        },
        dark: "#1C1C1C",
        gray: {
          50: "#FAFAFA",
          100: "#F5F5F5",
          200: "#EEEEEE",
          300: "#E0E0E0",
          500: "#9E9E9E",
          700: "#616161",
          900: "#212121",
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: "0 2px 8px rgba(28, 28, 28, 0.06)",
        hover: "0 8px 24px rgba(28, 28, 28, 0.12)",
      },
    },
  },
  plugins: [],
}

