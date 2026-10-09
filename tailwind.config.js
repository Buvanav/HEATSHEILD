/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        tamil: ['"Noto Sans Tamil"', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        surface: {
          950: '#090d16',
          900: '#0f172a',
          850: '#151f32',
          800: '#1e293b',
          700: '#334155',
        },
        heat: {
          low: '#10b981',      // Green
          medium: '#f59e0b',   // Amber
          high: '#ef4444',     // Red
          extreme: '#b91c1c',  // Deep Red
        }
      }
    },
  },
  plugins: [],
}

