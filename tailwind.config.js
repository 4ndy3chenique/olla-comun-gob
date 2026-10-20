/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#FAF8F3",
        surface: "#FFFFFF",
        ink: "#2B2721",
        muted: "#6E6759",
        border: "#E6E0D4",
        primary: {
          DEFAULT: "#1F4D3F",
          dark: "#153A2F",
          light: "#EAF2EF",
        },
        accent: {
          DEFAULT: "#B5651D",
          dark: "#7A4310",
          light: "#F7EADC",
        },
        success: {
          DEFAULT: "#2F6B4F",
          light: "#E6F2EA",
        },
        danger: {
          DEFAULT: "#A23B2E",
          light: "#FBEAE7",
        },
        info: {
          DEFAULT: "#356480",
          light: "#E9F1F5",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "10px",
        lg: "14px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(43, 39, 33, 0.04), 0 8px 24px rgba(43, 39, 33, 0.04)",
        modal: "0 24px 64px rgba(43, 39, 33, 0.22)",
      },
      maxWidth: {
        contenido: "1440px",
      },
    },
  },
  plugins: [],
};
