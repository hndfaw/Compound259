/**
 * The four calculator assumptions, in the order the keypad's Prev/Next keys
 * walk through them. Mirrors `FIELDS` in the redesign spec.
 */

export type FieldKey = 'initial' | 'monthly' | 'rate' | 'years';

export type Field = {
  key: FieldKey;
  /** Full name, used on the tile and as the keypad caption. */
  label: string;
  /** Abbreviation for the keypad's mini tiles. */
  short: string;
  /** Secondary line under the tile value. */
  hint: string;
  /** Largest value the field accepts; entries above it are clamped. */
  max: number;
  /** Prefix and suffix around the entry readout. */
  pre: string;
  suf: string;
};

export const FIELDS: readonly Field[] = [
  { key: 'initial', label: 'Initial investment', short: 'Initial', hint: 'one time', max: 100_000_000, pre: '$', suf: '' },
  { key: 'monthly', label: 'Monthly contribution', short: 'Monthly', hint: 'every month', max: 1_000_000, pre: '$', suf: '' },
  { key: 'rate', label: 'Annual return', short: 'Return', hint: 'per year', max: 50, pre: '', suf: '%' },
  { key: 'years', label: 'Time horizon', short: 'Years', hint: '', max: 60, pre: '', suf: ' yrs' },
] as const;

export const fieldAt = (key: FieldKey): Field => FIELDS.find((f) => f.key === key) ?? FIELDS[0];
export const fieldIndex = (key: FieldKey): number => {
  const i = FIELDS.findIndex((f) => f.key === key);
  return i < 0 ? 0 : i;
};

/** The contribution tile and keypad caption rename `monthly` for readability. */
export const tileLabel = (f: Field): string => (f.key === 'monthly' ? 'Contribution' : f.label);
export const tileShort = (f: Field): string => (f.key === 'monthly' ? 'Contrib' : f.short);

export const FREQ_OPTIONS = ['Annually', 'Semi-annually', 'Quarterly', 'Monthly'] as const;

/** Adjective form used in the keypad caption, e.g. "Quarterly contribution". */
export const FREQ_ADJ: Record<string, string> = {
  Annually: 'Annual',
  'Semi-annually': 'Semi-annual',
  Quarterly: 'Quarterly',
  Monthly: 'Monthly',
};

/** Compact labels for the keypad's inline frequency rail. */
export const FREQ_SEGMENTS: readonly { value: string; label: string }[] = [
  { value: 'Annually', label: 'YR' },
  { value: 'Semi-annually', label: '6M' },
  { value: 'Quarterly', label: 'Q' },
  { value: 'Monthly', label: 'MO' },
] as const;
