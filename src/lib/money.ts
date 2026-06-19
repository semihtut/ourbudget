// All currency handling lives here. Money is stored as integer cents and only
// converted to/from euros at the UI edges. Never format currency inline.

const eur = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
});

const eurWhole = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// Cents -> "€1,234.56"
export const formatEur = (cents: number): string => eur.format(cents / 100);

// Cents -> "€2,480" — for the hero total, donut center, trend/axis labels.
export const formatEurWhole = (cents: number): string =>
  eurWhole.format(Math.round(cents / 100));

// Cents -> "€2.5k" / "€480" — compact labels above trend bars.
export const formatEurCompact = (cents: number): string => {
  const euros = cents / 100;
  if (euros >= 1000) return `€${(euros / 1000).toFixed(1)}k`;
  return `€${Math.round(euros)}`;
};

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
