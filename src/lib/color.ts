// Small color helpers for chart tiles.

// Relative luminance of a #rrggbb hex (0 = black, 1 = white).
const luminance = (hex: string): number => {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  // Perceptual weighting (Rec. 601), good enough for picking text color.
  return 0.299 * r + 0.587 * g + 0.114 * b;
};

// Pick a readable text color (near-white or deep ink) for a given fill.
export const readableTextOn = (hexBackground: string): string =>
  luminance(hexBackground) > 0.62 ? '#10151F' : '#FFFFFF';

// Darken a #rrggbb hex by `amount` (0..1). Used to deepen treemap blocks so they
// sit calmly on the dark theme while staying distinguishable.
export const darken = (hex: string, amount: number): string => {
  const value = hex.replace('#', '');
  const channel = (start: number) => {
    const v = parseInt(value.slice(start, start + 2), 16);
    return Math.max(0, Math.round(v * (1 - amount)));
  };
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(channel(0))}${toHex(channel(2))}${toHex(channel(4))}`;
};
