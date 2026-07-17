/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#00a884',
        dark: {
          100: '#111b21',
          200: '#202c33',
          300: '#2a3942',
          400: '#3b4a54',
        }
      }
    },
  },
  plugins: [],
};
