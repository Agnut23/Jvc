/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: '#6C63FF',
        'accent-pink': '#FF6B9D',
        gold: '#FFD166',
        dark: {
          bg: '#0D0D12',
          card: '#13131B',
          surface: '#1C1C28',
          border: '#272738',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        cinzel: ['Cinzel', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      screens: {
        'xs': '480px',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-glow': 'glowPulse 2s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.4s ease forwards',
        'slide-down': 'slideDown 0.2s ease forwards',
        'skeleton': 'skeleton-shimmer 1.5s ease infinite',
      }
    }
  },
  plugins: [],
};
