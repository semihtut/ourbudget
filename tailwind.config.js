/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Design tokens mirrored from src/styles/tokens.css so Tailwind utilities
      // (bg-bg, text-ink, border-line, text-accent ...) map to the same palette.
      colors: {
        bg: '#F7F6FD',
        surface: '#FFFFFF',
        ink: '#2D2A3E',
        muted: '#6E6A85',
        faint: '#9A96B0',
        line: '#E9E6F7',
        'line-soft': '#F0EEFA',
        'line-row': '#F4F2FB',
        accent: '#6C5CE7',
        'accent-deep': '#5F4BDB',
        'accent-soft': '#EDEBFF',
        track: '#EEECF9',
        // spending deltas: up = spent more (bad), down = spent less (good)
        up: '#E03131',
        'up-soft': '#FDECEC',
        down: '#0D8A62',
        'down-fill': '#2ECC8F',
        'down-soft': '#E9F9F0',
        'chart-de': '#E4E1F5',
      },
      fontFamily: {
        display: ['Nunito', 'system-ui', 'sans-serif'],
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '20px',
        'card-lg': '28px',
      },
      boxShadow: {
        card: '0 6px 24px rgba(108,92,231,.08), 0 1px 2px rgba(45,42,62,.04)',
        sheet: '0 -12px 48px rgba(45,42,62,.18)',
      },
    },
  },
  plugins: [],
};
