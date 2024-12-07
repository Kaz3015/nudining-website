/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brown: {
          50: '#f5f5f4',
          100: '#edece8',
          200: '#dbd6cf',
          300: '#c3b8a6',
          400: '#a4896f',
          500: '#8a6e4f', // Default shade
          600: '#735940',
          700: '#5c4532',
          800: '#443425',
          900: '#2d2317',
        },
      },
    },
  },
  plugins: [],
}

