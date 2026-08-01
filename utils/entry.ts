/**
 * Pure keypad input rules, kept out of the screen so every edge case
 * (leading zeros, a second decimal point, the field ceiling, deleting past the
 * start) is testable on its own.
 */

import { Field } from '@/constants/fields';

/** Longest run of digits the entry accepts, matching the design's guard. */
export const MAX_DIGITS = 10;

/**
 * Apply one keypress to the raw entry string.
 *
 * `fresh` means the field was just focused, so the first keypress replaces the
 * seeded value instead of appending to it. Returns `null` when the press is a
 * no-op (a second decimal point, or one digit too many).
 */
export const nextEntry = (current: string, fresh: boolean, char: string): string | null => {
  let entry = fresh ? '' : current;

  if (char === '.') {
    if (entry.includes('.')) return null;
    entry = `${entry === '' ? '0' : entry}.`;
  } else if (char === '000') {
    entry = entry === '' || entry === '0' ? '0' : `${entry}000`;
  } else {
    // A lone leading zero is replaced rather than prefixed: 0 then 5 is 5.
    if (entry === '0') entry = '';
    entry += char;
  }

  if (entry.replace(/[^0-9]/g, '').length > MAX_DIGITS) return null;
  return entry;
};

/**
 * Turn a raw entry into the number the field will store, clamping to its
 * ceiling. An empty or malformed entry reads as zero, never NaN.
 */
export const commitEntry = (field: Field, raw: string): { text: string; value: number } => {
  const parsed = parseFloat(raw);
  let value = Number.isFinite(parsed) ? parsed : 0;
  if (value < 0) value = 0;
  if (value > field.max) return { text: String(field.max), value: field.max };
  return { text: raw, value };
};
