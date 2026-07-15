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

/** Chart sample points in a 320x150 viewBox (y inverted for SVG). */
export const chartSeries = (inputs: FinanceInputs, years: number): [number, number][] => {
  const count = Math.min(28, Math.max(2, years + 1));
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

/** Compact money like the design: $1,234 / $1.23M / $4.56B / $1.00T */
export const money = (n: number): string => {
  const rounded = Math.round(n || 0);
  const abs = Math.abs(rounded);
  if (abs >= 1e12) return '$' + (rounded / 1e12).toFixed(2) + 'T';
  if (abs >= 1e9) return '$' + (rounded / 1e9).toFixed(2) + 'B';
  return '$' + rounded.toLocaleString('en-US');
};
