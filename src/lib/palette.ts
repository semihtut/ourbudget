// Categorical palette (mirrors the --c0..--c11 tokens in styles/tokens.css).
// Fixed assignment order — never cycled into new hues. Validated for CVD
// separation and 3:1 contrast against the paper surface.
export const PALETTE = [
  '#6C5CE7',
  '#0CA678',
  '#E8590C',
  '#1C7ED6',
  '#D6336C',
  '#5C940D',
  '#7048E8',
  '#D9480F',
  '#089FC8',
  '#9C36B5',
  '#2F9E44',
  '#E64980',
] as const;

// Pick a stable-ish color for a new category based on how many already exist.
export const nextPaletteColor = (existingCount: number): string =>
  PALETTE[existingCount % PALETTE.length] as string;
