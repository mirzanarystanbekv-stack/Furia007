/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Палитра ТЗ кейса: основной #1D9E75 (teal), акцент #0C447C (синий),
        // предупреждение #BA7517, ошибка #A32D2D. Шкалы построены от якорей.
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#1d9e75',
          600: '#158b65',
          700: '#0f7253',
          800: '#0c5a43',
          900: '#094735',
          950: '#052e22',
        },
        accent: {
          50: '#eef5fb',
          100: '#d9e8f5',
          200: '#b3d0e8',
          300: '#7fa9d2',
          400: '#3d6d9f',
          500: '#0c447c',
          600: '#0a3a6a',
          700: '#083058',
          800: '#062546',
          900: '#041a33',
        },
        warning: {
          50: '#fdf6ec',
          100: '#f9ead1',
          200: '#f0d3a2',
          300: '#e0b26b',
          400: '#d19134',
          500: '#ba7517',
          600: '#9a6113',
          700: '#7c4e10',
        },
        error: {
          50: '#fbeced',
          100: '#f6d5d7',
          200: '#eab0b4',
          400: '#c95b62',
          500: '#a32d2d',
          600: '#8a2525',
          700: '#711e1e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)',
        'card-hover': '0 10px 25px -5px rgb(12 68 124 / 0.18)',
      },
    },
  },
  plugins: [],
}
