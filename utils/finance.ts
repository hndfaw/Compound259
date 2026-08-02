/**
 * Compound-interest math shared by the calculator and the growth chart.
 * Future value of the principal plus a per-period ordinary annuity.
 */

export const FREQ_PERIODS: Record<string, number> = {
  Annually: 1,
  'Semi-annually': 2,
  Quarterly: 4,
  Monthly: 12,
};

export type FinanceInputs = {
  initial: number;
  contribution: number; // per period
  ratePct: number; // annual %, e.g. 8
  freq: string;
};

/** Balance after `years` years for the given inputs. */
export const balanceAt = ({ initial, contribution, ratePct, freq }: FinanceInputs, years: number): number => {
  const n = FREQ_PERIODS[freq] ?? 12;
  const ratePerPeriod = ratePct / 100 / n;
  const periods = n * years;
  const growth = Math.pow(1 + ratePerPeriod, periods);
  const fvPrincipal = initial * growth;
  const fvContributions =
    ratePerPeriod === 0 ? contribution * periods : contribution * ((growth - 1) / ratePerPeriod);
  return fvPrincipal + fvContributions;
};

export type Breakdown = {
  balance: number;
  contributionsTotal: number;
  interest: number;
  growthPct: number;
  principalRatio: number; // 0-100
  contribRatio: number; // 0-100
  interestRatio: number; // 0-100
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export const breakdown = (inputs: FinanceInputs, years: number): Breakdown => {
  const balance = balanceAt(inputs, years);
  const n = FREQ_PERIODS[inputs.freq] ?? 12;
  const contributionsTotal = inputs.contribution * n * years;
  const invested = inputs.initial + contributionsTotal;
  const interest = balance - invested;
  const growthPct = invested > 0 ? (interest / invested) * 100 : 0;
  const principalRatio = balance > 0 ? clamp((inputs.initial / balance) * 100, 0, 100) : 0;
  const contribRatio = balance > 0 ? clamp((contributionsTotal / balance) * 100, 0, 100) : 0;
  const interestRatio = Math.max(0, 100 - principalRatio - contribRatio);
  return { balance, contributionsTotal, interest, growthPct, principalRatio, contribRatio, interestRatio };
};

/**
 * Chart sample points in a 320x150 viewBox (y inverted for SVG).
 *
 * `samples` fixes the point count. The chart passes a constant so successive
 * series always line up index-for-index and can be tweened between; leaving it
 * off keeps the year-aligned sampling.
 */
export const chartSeries = (inputs: FinanceInputs, years: number, samples?: number): [number, number][] => {
  const count = samples ?? Math.min(28, Math.max(2, years + 1));
  const max = Math.max(balanceAt(inputs, years), 1);
  const points: [number, number][] = [];
  for (let i = 0; i < count; i++) {
    const yy = (i / (count - 1)) * years;
    const val = balanceAt(inputs, yy);
    const x = 8 + (i / (count - 1)) * 304;
    const y = 150 - (val / max) * 136;
    points.push([+x.toFixed(1), +y.toFixed(1)]);
  }
  return points;
};

/**
 * Ruler ticks along the chart's baseline, in the same 320x150 viewBox.
 *
 * Spacing adapts to the horizon so the axis always reads at a sensible grain:
 * months under a quarter marker for a short run, years under a five-year
 * marker for a long one. Pairs are [major, minor] in months.
 */
const TICK_STEPS: readonly (readonly [number, number])[] = [
  [3, 1], // quarters, ticked monthly
  [12, 3], // years, ticked quarterly
  [24, 6], // 2 years, ticked half-yearly
  [60, 12], // 5 years, ticked yearly
  [120, 24], // decades, ticked every 2 years
  [240, 60], // 20 years, ticked every 5 years
  [600, 120], // 50 years, ticked every 10 years
];

/** Never draw more major marks than this across the axis. */
const MAX_MAJOR_TICKS = 6;

const X_START = 8;
const X_SPAN = 304;

/**
 * X positions of the ruler marks, rather than a finished path, so the chart can
 * tween them when the horizon changes instead of swapping one path for another.
 */
export const chartTicks = (years: number): { minor: number[]; major: number[] } => {
  const months = Number.isFinite(years) ? years * 12 : 0;
  // Below a couple of quarters there is nothing worth ruling.
  if (!(months > 6)) return { minor: [], major: [] };

  // Past the table, synthesise a step instead of falling back to its largest
  // pair: a fixed pair against an unbounded horizon would loop for as many
  // ticks as the horizon allows. Rounding to a multiple of five keeps the
  // major step an exact multiple of the minor one, so the remainder test below
  // stays exact.
  const synthetic = Math.max(5, Math.ceil(months / MAX_MAJOR_TICKS / 5) * 5);
  const [major, minor] = TICK_STEPS.find(([step]) => months / step <= MAX_MAJOR_TICKS) ?? [
    synthetic,
    synthetic / 5,
  ];

  const minorXs: number[] = [];
  const majorXs: number[] = [];
  // `month` stays an integer, so deciding whether a tick is major is an exact
  // remainder rather than a float comparison against an epsilon.
  for (let month = 0; month <= months; month += minor) {
    const x = +(X_START + (month / months) * X_SPAN).toFixed(1);
    if (x > X_START + X_SPAN + 0.5) break;
    if (month % major === 0) majorXs.push(x);
    else minorXs.push(x);
  }
  return { minor: minorXs, major: majorXs };
};

/** Catmull-Rom -> cubic Bézier smoothing, returns an SVG path `d`. */
export const smoothPath = (p: [number, number][]): string => {
  if (!p.length) return '';
  let d = `M ${p[0][0]} ${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] || p[i + 1];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0]} ${p2[1]}`;
  }
  return d;
};

/** Compact money like the design: $1,234 / $4.56B / $1.00T */
export const money = (n: number): string => {
  // A non-finite input would otherwise render as "$InfinityT" / "$NaN".
  if (!Number.isFinite(n)) return '$0';
  // `|| 0` folds negative zero away, which would otherwise print as "$-0".
  const rounded = Math.round(n) || 0;
  const abs = Math.abs(rounded);
  if (abs >= 1e12) return '$' + (rounded / 1e12).toFixed(2) + 'T';
  if (abs >= 1e9) return '$' + (rounded / 1e9).toFixed(2) + 'B';
  return '$' + rounded.toLocaleString('en-US');
};
