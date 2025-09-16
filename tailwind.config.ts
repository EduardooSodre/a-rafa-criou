/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './pages/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        scripter: ['"Scripter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
