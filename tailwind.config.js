/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ff7a18',
        navy: '#0b1020',
        softgray: '#f3f4f6'
      },
      fontFamily: {
        bn: ['Noto Sans Bengali', 'sans-serif']
      },
      borderRadius: {
        xlcard: '20px'
      }
    }
  },
  plugins: [],
}
