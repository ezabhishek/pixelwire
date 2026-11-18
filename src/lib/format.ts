const relativeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto', style: 'short' });
const compactFormatter = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });
const dateTimeFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' });

const UNITS: ReadonlyArray<readonly [Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
];

/** "just now", "5 min. ago", "yesterday", "3 wk. ago". Returns '' for invalid input. */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return '';
  const diffSeconds = Math.round((time - now) / 1000);
  const abs = Math.abs(diffSeconds);
  if (abs < 45) return 'just now';
  for (const [unit, seconds] of UNITS) {
    if (abs >= seconds) return relativeFormatter.format(Math.round(diffSeconds / seconds), unit);
  }
  return relativeFormatter.format(Math.sign(diffSeconds) || -1, 'minute');
}

/** 1234 -> "1.2K". */
export function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return compactFormatter.format(value);
}

export function formatDate(iso: string): string {
  const time = Date.parse(iso);
  return Number.isNaN(time) ? '' : dateFormatter.format(time);
}

export function formatDateTime(iso: string): string {
  const time = Date.parse(iso);
  return Number.isNaN(time) ? '' : dateTimeFormatter.format(time);
}

export function formatReadingTime(minutes: number | null): string | null {
  if (minutes === null || !Number.isFinite(minutes) || minutes <= 0) return null;
  return `${Math.max(1, Math.round(minutes))} min read`;
}
