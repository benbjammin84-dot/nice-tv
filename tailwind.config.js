/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nicebg: "#0a0a0f",
        nicepanel: "#12121a",
        nicecard: "#1a1a26",
        niceborder: "#2a2a3a",
        niceaccent: "#7c6dfa",
        niceglow: "#a78bfa",
        nicetext: "#e2e2f0",
        nicemuted: "#6b6b8a",
      },
      fontFamily: {
        tv: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
