/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#0B0F14',
          900: '#0F1319',
          800: '#171D26',
          700: '#1F2733',
          600: '#2A3341',
          500: '#3A4556',
        },
        paper: {
          100: '#E7EBF0',
          300: '#B7C0CC',
          500: '#8A96A8',
        },
        amber: {
          DEFAULT: '#E8A33D',
          dim: '#8A6428',
        },
        teal: {
          DEFAULT: '#4FD1C5',
          dim: '#2E7A72',
        },
        clay: {
          DEFAULT: '#E85D4E',
          dim: '#8A3A31',
        },
      },
    },
  },
  plugins: [],
}
