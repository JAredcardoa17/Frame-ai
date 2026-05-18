/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#c9a84c',
          light: '#e8c96a',
          dark: '#8a6520',
        },
        teal: {
          ai: '#2dd4bf',
        },
        frame: {
          bg: '#080810',
          surface: '#0f0f1a',
          border: 'rgba(255,255,255,0.08)',
        }
      },
      fontFamily: {
        sora: ['Sora', 'DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        spin: {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.4' },
        }
      },
      animation: {
        fadeUp: 'fadeUp 0.3s ease both',
        spin:   'spin 0.8s linear infinite',
        pulse:  'pulse 1.5s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
