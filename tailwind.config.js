/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#b6e1fa',       // muted blue main background
        'primary-light': '#c6d7e5', // lighter blue for cards & inputs
        accent: '#89a9c9',        // slightly darker muted blue for hover/buttons
        'primary-dark': '#7b9fb0', // optional: for darker hover
      },
    },
  },
  plugins: [],
};
