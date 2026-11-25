/** All number and duration formatting goes through this module. */

const SUFFIXES = ['', 'k', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'] as const;

export type Notation = 'short' | 'scientific';

export interface FormatOptions {
  readonly locale: string;
  readonly notation?: Notation;
}

const formatters = new Map<string, Intl.NumberFormat>();

/** Up to 2 decimals; below 1, two significant digits so small rates stay readable (0.012). */
function plain(value: number, locale: string): string {
  const small = value !== 0 && Math.abs(value) < 1;
  const key = `${locale}:${small ? 'small' : 'normal'}`;
  let formatter = formatters.get(key);
  if (formatter === undefined) {
    formatter = new Intl.NumberFormat(
      locale,
      small
        ? { maximumSignificantDigits: 2, useGrouping: false }
        : { maximumFractionDigits: 2, useGrouping: false },
    );
    formatters.set(key, formatter);
  }
  return formatter.format(value);
}

/** French puts a narrow no-break space before unit suffixes ("1,2 k"); English does not ("1.2k"). */
function suffixSeparator(locale: string): string {
  return locale.startsWith('fr') ? ' ' : '';
}

/** 3 significant digits, rounded the way the player reads them. */
function round3(value: number): number {
  return Number(value.toPrecision(3));
}

export function formatNumber(value: number, { locale, notation = 'short' }: FormatOptions): string {
  if (Number.isNaN(value)) {
    return '?';
  }
  if (!Number.isFinite(value)) {
    return value > 0 ? '∞' : '-∞';
  }
  const abs = Math.abs(value);
  // Float leftovers such as 2e-18 are zero to the player.
  if (abs < 0.001) {
    return '0';
  }
  const sign = value < 0 ? '-' : '';
  if (abs < 1000) {
    return sign + plain(abs, locale);
  }

  let exponent = Math.floor(Math.log10(abs));
  if (round3(abs / 10 ** exponent) >= 10) {
    exponent += 1; // 9.995e5 rounds up to 1.00e6
  }

  const group = Math.floor(exponent / 3);
  const suffix = SUFFIXES[group];
  if (notation === 'scientific' || suffix === undefined) {
    return `${sign}${plain(round3(abs / 10 ** exponent), locale)}e${exponent}`;
  }
  return `${sign}${plain(round3(abs / 1000 ** group), locale)}${suffixSeparator(locale)}${suffix}`;
}

/** Signed rate per second, e.g. "+0.63/s". */
export function formatRate(perSecond: number, options: FormatOptions): string {
  const sign = perSecond > 0 ? '+' : '';
  return `${sign}${formatNumber(perSecond, options)}/s`;
}

/** Human duration for the journal: "45 s", "12 min", "2 h 5 min". */
export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  if (total < 60) {
    return `${total} s`;
  }
  const minutes = Math.floor(total / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'] as const;

/** Roman numeral for era numbers (1 to 10). */
export function roman(value: number): string {
  return NUMERALS[value - 1] ?? String(value);
}

/** Percentage without decimals beyond what matters: 0.05 → "5", 0.125 → "12.5". */
export function formatPercent(ratio: number, options: FormatOptions): string {
  return formatNumber(Math.round(ratio * 1000) / 10, options);
}
