/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        glass: {
          light: 'rgba(255, 255, 255, 0.15)',
          medium: 'rgba(255, 255, 255, 0.25)',
          dark: 'rgba(15, 23, 42, 0.65)',
          cyber: 'rgba(10, 15, 30, 0.85)',
          border: 'rgba(255, 255, 255, 0.18)',
        },
        cyber: {
          neon: '#00ffcc',
          pink: '#ff007f',
          dark: '#0a0d14',
          card: '#111726',
        }
      },
      backdropBlur: {
        xs: '2px',
        md: '12px',
        xl: '24px',
        '2xl': '40px',
      },
      boxShadow: {
        'glass-sm': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-lg': '0 20px 50px 0 rgba(0, 0, 0, 0.5)',
        'cyber-glow': '0 0 20px rgba(0, 255, 204, 0.35)',
        'win-acrylic': '0 12px 36px 0 rgba(0, 0, 0, 0.45)',
      },
      animation: {
        'dock-bounce': 'bounce 0.5s ease-in-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
