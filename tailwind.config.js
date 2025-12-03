/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        arabic: ['"Cairo"', 'sans-serif'],
      },
      colors: {
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          850: '#1f2937',
          900: '#111827',
          950: '#0B0F19',
        },
        brand: {
          start: '#34D399',
          end: '#22D3EE',
        }
      },
      boxShadow: {
        'glow': '0 0 20px -5px rgba(52, 211, 153, 0.3)',
        'card': '0 0 0 1px rgba(255, 255, 255, 0.05), 0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(to right, #34D399, #22D3EE)',
        'gradient-dark': 'linear-gradient(to bottom right, #1F2937, #111827)',
      }
    }
  },
  plugins: [],
}