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
        'primary-dark': '#0f172a',  // slate-900 - dark headings (deeper)

        // Professional blue palette (more sophisticated)
        accent: '#0B68B3',          // blue-600 - primary button background (deeper blue)
        'accent-dark': '#1e40af',   // blue-800 - hover background
        'accent-light': '#3b82f6',  // blue-500 - lighter accents
        'accent-50': '#eff6ff',     // blue-50 - very light backgrounds
        'accent-100': '#dbeafe',
        'accent-footer': '#BCDCF5',   // blue-100 - light backgrounds

        // Supporting colors
        highlight: '#f59e0b',       // amber-500 - warm CTAs/badges
        neutral: '#1e293b',         // slate-800 - body text
        'neutral-light': '#64748b', // slate-500 - secondary text
      },
    },
  },
  plugins: [],
};