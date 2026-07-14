/**
 * Currency and number formatting helpers shared across screens.
 *
 * These were previously duplicated (with subtly different options) in the
 * calculator and saved-records screens. Centralizing them keeps every money
 * value on screen formatted consistently.
 */

/** Parse a user-entered amount (possibly comma-grouped) into a number. */
export const parseAmount = (value: string): number =>
  Number(value.replace(/,/g, '')) || 0;

/** Group a raw numeric string with thousands separators, stripping leading zeros. */
export const formatWithCommas = (value: string): string => {
  const digitsOnly = value.replace(/[^0-9]/g, '');
  if (!digitsOnly) return '';
  // Remove leading zeros unless it's just "0"
  const withoutLeadingZeros = digitsOnly.replace(/^0+/, '') || '0';
  return withoutLeadingZeros.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/** Whole-dollar currency, no decimals. e.g. $1,234 */
export const formatWhole = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(isFinite(value) ? value : 0);

/** Full currency with cents. e.g. $1,234.50 */
export const formatFull = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(isFinite(value) ? value : 0);

const trimTrailingZeros = (formatted: string): string =>
  formatted.replace(/\.00(?=$|[A-Za-z])/g, '');

/** Full currency, but drop a trailing ".00". e.g. $1,234 / $1,234.50 */
export const formatTrimmed = (value: number): string => trimTrailingZeros(formatFull(value));

/** Compact currency for large values. e.g. $1.20M, $3.4B */
export const formatCompact = (value: number): string => {
  if (!isFinite(value)) return '$0';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  const units = [
    { value: 1e12, suffix: 'T' },
    { value: 1e9, suffix: 'B' },
    { value: 1e6, suffix: 'M' },
  ];

  if (abs >= 1e15) {
    return `${sign}$${abs.toExponential(2).replace('e+', 'e')}`;
  }

  const matchedUnit = units.find((unit) => abs >= unit.value);
  if (matchedUnit) {
    const compactValue = abs / matchedUnit.value;
    const decimals = compactValue >= 10 ? 1 : 2;
    return trimTrailingZeros(`${sign}$${compactValue.toFixed(decimals)}${matchedUnit.suffix}`);
  }

  return trimTrailingZeros(formatFull(value));
};
