/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Design tokens mirrored from src/styles/tokens.css so Tailwind utilities
      // (bg-bg, text-ink, border-line, text-accent ...) map to the same palette.
      colors: {
        bg: '#0A0E1A',
        surface: 'rgba(255,255,255,0.05)',
        'surface-solid': '#141B2B',
        'surface-2': '#1B2436',
        ink: '#E9EDF4',
        muted: '#8B95A8',
        line: 'rgba(255,255,255,0.09)',
        accent: '#3F9A80',
        'accent-soft': 'rgba(63,154,128,0.16)',
        me: '#3F9A80',
        partner: '#C47A55',
        joint: '#8B95A8',
        'on-dark': '#E9EDF4',
        'on-dark-muted': '#8B95A8',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(28,43,45,.04), 0 8px 28px rgba(28,43,45,.05)',
      },
    },
  },
  plugins: [],
};
