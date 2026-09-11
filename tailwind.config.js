/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Prompt', 'Kanit', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        illu: {
          50: '#eff6ff',
          500: '#3b82f6',
          700: '#1d4ed8'
        },
        ll: {
          50: '#faf5ff',
          500: '#a855f7',
          700: '#7e22ce'
        },
        trueco: {
          50: '#fff1f2',
          500: '#f43f5e',
          700: '#be123c'
        }
      }
    },
  },
  plugins: [],
}
