// Categorical palette (mirrors the --c0..--c11 tokens in styles/tokens.css).
// Used for seeded category colors and as a fallback when assigning colors to
// user-created categories.
export const PALETTE = [
  '#2F6F5E',
  '#C2703D',
  '#D9A441',
  '#5E9BC2',
  '#6E7CA8',
  '#A65A3A',
  '#C98A5E',
  '#7A8B5A',
  '#5B8C7B',
  '#88B0A0',
  '#8A6FA8',
  '#C25E7A',
] as const;

// Pick a stable-ish color for a new category based on how many already exist.
export const nextPaletteColor = (existingCount: number): string =>
  PALETTE[existingCount % PALETTE.length] as string;
