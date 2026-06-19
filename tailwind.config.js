/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Design tokens mirrored from src/styles/tokens.css so Tailwind utilities
      // (bg-bg, text-ink, border-line, text-accent ...) map to the same palette.
      colors: {
        bg: '#FBFBF9',
        surface: '#FFFFFF',
        ink: '#1C2B2D',
        muted: '#6B7773',
        faint: '#9B988F',
        line: '#E7E5DE',
        'line-soft': '#ECEAE3',
        'line-row': '#F0EEE8',
        accent: '#2F6F5E',
        'accent-soft': '#E8EDE9',
        track: '#F0EEE7',
        // up/down deltas
        up: '#A65A3A',
        down: '#2F6F5E',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(28,43,45,.04), 0 18px 48px rgba(28,43,45,.10)',
        sheet: '0 1px 2px rgba(28,43,45,.04), 0 -2px 40px rgba(28,43,45,.12)',
      },
    },
  },
  plugins: [],
};
