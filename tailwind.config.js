/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        fithub: {
          'light-grey': '#30363d',
          'medium-grey': '#161b22',
          'dark-grey': '#0d1117',
          'salmon': '#ff2d2d',
          'red': '#a02024',
          'dark-red': '#662020',
          'brown': '#34181c',
          'bright-red': '#bb1f21',
        }
      }
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  }
} 