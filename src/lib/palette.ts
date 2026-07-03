// Categorical palette (mirrors the --c0..--c11 tokens in styles/tokens.css).
// Fixed assignment order — never cycled into new hues. Validated for CVD
// separation and 3:1 contrast against the paper surface.
export const PALETTE = [
  '#C0521E',
  '#0E7E60',
  '#C27C00',
  '#3C72C6',
  '#A0489C',
  '#6C8B21',
  '#C64B70',
  '#0E86A0',
  '#A56A21',
  '#6461D6',
  '#4E8A3A',
  '#B0475A',
] as const;

// Pick a stable-ish color for a new category based on how many already exist.
export const nextPaletteColor = (existingCount: number): string =>
  PALETTE[existingCount % PALETTE.length] as string;
