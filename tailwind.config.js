/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#FF8C42",
        primaryLight: "#FFB380",
        primaryDark: "#E07B2F",
        secondary: "#2D3E50",
        secondaryLight: "#5A6F82",
        gray: "#F5F5F5",
        grayDark: "#757575",
        grayLight: "#E8E8E8",
        success: "#4CAF50",
        error: "#F44336",
        warning: "#FF9800",
        info: "#2196F3",
        background: "#FFFFFF",
        backgroundAlt: "#F9F9F9",
        text: "#2D3E50",
        textSecondary: "#757575",
        textLight: "#FFFFFF",
        border: "#E0E0E0",
        borderLight: "#F0F0F0",
      },
    },
  },
  plugins: [],
};
