/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#b6e1fa',       // soft blue background
        'primary-light': '#eaf6fd', // near-white blue for cards
        'primary-dark': '#406882', // deep muted blue for headers
        accent: '#3b82f6',        // stronger blue for links/buttons
        highlight: '#fca311',     // warm orange for CTAs
        neutral: '#1f2937',       // dark gray for text
      },   
    },
  },
  plugins: [],
};
