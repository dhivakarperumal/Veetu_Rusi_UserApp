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
        grayDark: "#757575",
        grayLight: "#E8E8E8",
        borderLight: "#F0F0F0",
      },
    },
  },
  plugins: [],
};
