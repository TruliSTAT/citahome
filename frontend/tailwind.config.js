/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#4BBDB5',
          50:  '#f0fbfa',
          100: '#d1f5f3',
          200: '#a3ebe7',
          300: '#6dded8',
          400: '#4BBDB5',
          500: '#35a09a',
          600: '#268480',
          700: '#1e6b68',
          800: '#185655',
          900: '#134342',
          dark:   '#0a0d14',
          card:   '#0e1118',
          border: '#161c28',
          gold:   '#D4A83A',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      boxShadow: {
        'teal': '0 0 30px rgba(75, 189, 181, 0.15)',
        'gold': '0 0 20px rgba(212, 168, 58, 0.15)',
      },
    },
  },
  plugins: [],
};
