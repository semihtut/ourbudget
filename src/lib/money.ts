// All currency handling lives here. Money is stored as integer cents and only
// converted to/from euros at the UI edges. Never format currency inline.

const eur = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
});

// Cents -> "€1,234.56"
export const formatEur = (cents: number): string => eur.format(cents / 100);

// Cents -> "1234.56" (for prefilling number inputs, no symbol/grouping)
export const centsToInput = (cents: number): string => (cents / 100).toFixed(2);

// User input string -> integer cents. Accepts "12,50" or "12.50". Returns null
// when the input is not a valid, non-negative amount.
export const parseAmountToCents = (raw: string): number | null => {
  const normalized = raw.trim().replace(',', '.');
  if (normalized === '') return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
};
