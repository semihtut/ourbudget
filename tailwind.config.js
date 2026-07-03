/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Design tokens mirrored from src/styles/tokens.css so Tailwind utilities
      // (bg-bg, text-ink, border-line, text-accent ...) map to the same palette.
      colors: {
        bg: '#F4EFE3',
        surface: '#FCFAF3',
        ink: '#221D14',
        muted: '#5C5648',
        faint: '#8B8272',
        line: '#DED5C2',
        'line-soft': '#E8E1D1',
        'line-row': '#EFE9DB',
        accent: '#9C3F14',
        'accent-bright': '#C0521E',
        'accent-soft': '#F3E4D6',
        track: '#E8E1D1',
        // spending deltas: up = spent more (bad), down = spent less (good)
        up: '#B3261E',
        down: '#0E7E60',
        'chart-de': '#DDD3BC',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '8px',
      },
      boxShadow: {
        card: '0 1px 0 rgba(34,29,20,.05)',
        sheet: '0 -8px 40px rgba(34,29,20,.16)',
      },
    },
  },
  plugins: [],
};
