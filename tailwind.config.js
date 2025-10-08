/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Professional slate grays
        primary: '#f8fafc',         // slate-50 - ultra light background
        'primary-light': '#f1f5f9', // slate-100 - card backgrounds
        'primary-dark': '#334155',  // slate-700 - dark headings


            accent: '#3b82f6',        // blue-500 - primary button background
      'accent-dark': '#1e40af',  // blue-800 - hover background (darker for contrast)
      'accent-light': '#60a5fa', // blue-400 - lighter accents


        
        // Supporting colors
        highlight: '#fbbf24',       // amber-400 - warm CTAs/badges
        neutral: '#1e293b',         // slate-800 - body text
        'neutral-light': '#64748b', // slate-500 - secondary text
      },
    },
  },
  plugins: [],
};