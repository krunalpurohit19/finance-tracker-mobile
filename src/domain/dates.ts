/**
 * Calendar-date arithmetic for the whole application.
 *
 * A transaction happens on a *day* in the user's lived experience, not at a
 * UTC instant (docs/IMPLEMENTATION_PLAN.md D-11). So dates are handled as
 * "YYYY-MM-DD" strings and every operation is anchored to UTC midnight.
 *
 * Deliberately dependency-free. Date libraries operate on Date objects in the
 * host's local zone, which is exactly the hazard this module exists to remove:
 * a ₹450 dinner entered at 11pm IST on 31 January must never land in February.
 */

declare const calendarDateBrand: unique symbol;

/** An ISO calendar date, "YYYY-MM-DD". No time, no zone. */
export type CalendarDate = string & { readonly [calendarDateBrand]: true };

/** A month, "YYYY-MM". */
export type MonthKey = string;

export interface DateRange {
  /** Inclusive. */
  start: CalendarDate;
  /** Inclusive. */
  end: CalendarDate;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export class CalendarDateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CalendarDateError";
  }
}

export function isValidCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return false;

  const [y, m, d] = value.split("-").map(Number) as [number, number, number];
  if (m < 1 || m > 12 || d < 1) return false;
  // Rejects 2026-02-30 and friends; correct across leap years.
  return d <= daysInMonth(y, m);
}

export function calendarDate(value: string): CalendarDate {
  if (!isValidCalendarDate(value)) {
    throw new CalendarDateError(`Not a valid calendar date: ${JSON.stringify(value)}`);
  }
  return value as CalendarDate;
}

/** Days in a 1-indexed month. Handles leap years. */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function isLeapYear(year: number): boolean {
  return daysInMonth(year, 2) === 29;
}

function toUtc(date: CalendarDate): Date {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d));
}

function fromUtc(date: Date): CalendarDate {
  const y = String(date.getUTCFullYear()).padStart(4, "0");
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}` as CalendarDate;
}

/**
 * Today in the user's timezone — resolved on the server, never from a device
 * clock. "en-CA" formats as YYYY-MM-DD, which is exactly our wire format.
 */
export function today(timeZone: string): CalendarDate {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return calendarDate(parts);
}

/** Convert a JS Date to a calendar date in a given zone. */
export function toCalendarDate(instant: Date, timeZone: string): CalendarDate {
  return calendarDate(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(instant),
  );
}

/**
 * A UTC-midnight Date for persistence into a PostgreSQL DATE column.
 * Prisma maps DATE through Date; anchoring at UTC midnight keeps the
 * calendar day stable regardless of where the process runs.
 */
export function toUtcDate(date: CalendarDate): Date {
  return toUtc(date);
}

export function fromUtcDate(date: Date): CalendarDate {
  return fromUtc(date);
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
  const d = toUtc(date);
  d.setUTCDate(d.getUTCDate() + days);
  return fromUtc(d);
}

/**
 * Add months, clamping to the last valid day. 31 Jan + 1 month = 28 Feb
 * (or 29 Feb in a leap year) rather than rolling into March.
 */
export function addMonths(date: CalendarDate, months: number): CalendarDate {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const totalMonths = y * 12 + (m - 1) + months;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = (totalMonths % 12) + 1;
  const clampedDay = Math.min(d, daysInMonth(targetYear, targetMonth));
  return calendarDate(
    `${String(targetYear).padStart(4, "0")}-${String(targetMonth).padStart(2, "0")}-${String(clampedDay).padStart(2, "0")}`,
  );
}

export function addYears(date: CalendarDate, years: number): CalendarDate {
  return addMonths(date, years * 12);
}

export function startOfMonth(date: CalendarDate): CalendarDate {
  return calendarDate(`${date.slice(0, 7)}-01`);
}

export function endOfMonth(date: CalendarDate): CalendarDate {
  const [y, m] = date.split("-").map(Number) as [number, number];
  return calendarDate(`${date.slice(0, 7)}-${String(daysInMonth(y, m)).padStart(2, "0")}`);
}

export function startOfYear(date: CalendarDate): CalendarDate {
  return calendarDate(`${date.slice(0, 4)}-01-01`);
}

export function endOfYear(date: CalendarDate): CalendarDate {
  return calendarDate(`${date.slice(0, 4)}-12-31`);
}

export function monthKey(date: CalendarDate): MonthKey {
  return date.slice(0, 7);
}

/** Whole days from `a` to `b`. Negative when b precedes a. */
export function daysBetween(a: CalendarDate, b: CalendarDate): number {
  const MS_PER_DAY = 86_400_000;
  return Math.round((toUtc(b).getTime() - toUtc(a).getTime()) / MS_PER_DAY);
}

/** Whole months from `a` to `b`, ignoring day-of-month. */
export function monthsBetween(a: CalendarDate, b: CalendarDate): number {
  const [ay, am] = a.split("-").map(Number) as [number, number];
  const [by, bm] = b.split("-").map(Number) as [number, number];
  return (by - ay) * 12 + (bm - am);
}

export function compareDates(a: CalendarDate, b: CalendarDate): -1 | 0 | 1 {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function isWithin(date: CalendarDate, range: DateRange): boolean {
  return date >= range.start && date <= range.end;
}

/** Every month start from `start` to `end`, inclusive. Used for trend charts. */
export function eachMonthStart(range: DateRange): CalendarDate[] {
  const months: CalendarDate[] = [];
  let cursor = startOfMonth(range.start);
  const last = startOfMonth(range.end);
  while (cursor <= last) {
    months.push(cursor);
    cursor = addMonths(cursor, 1);
  }
  return months;
}

// ─── Period presets ────────────────────────────────────────────────────────

export const PERIOD_PRESETS = [
  "this-month",
  "last-month",
  "last-7-days",
  "last-30-days",
  "this-year",
  "last-year",
  "custom",
] as const;

export type PeriodPreset = (typeof PERIOD_PRESETS)[number];

/**
 * Resolve a preset into an inclusive date range, relative to today in the
 * user's timezone. `custom` requires an explicit range.
 */
export function resolvePeriod(
  preset: PeriodPreset,
  timeZone: string,
  custom?: DateRange,
): DateRange {
  const now = today(timeZone);

  switch (preset) {
    case "this-month":
      return { start: startOfMonth(now), end: endOfMonth(now) };

    case "last-month": {
      const prev = addMonths(startOfMonth(now), -1);
      return { start: prev, end: endOfMonth(prev) };
    }

    case "last-7-days":
      // Inclusive of today, so 6 days back gives 7 calendar days.
      return { start: addDays(now, -6), end: now };

    case "last-30-days":
      return { start: addDays(now, -29), end: now };

    case "this-year":
      return { start: startOfYear(now), end: endOfYear(now) };

    case "last-year": {
      const prev = addYears(startOfYear(now), -1);
      return { start: prev, end: endOfYear(prev) };
    }

    case "custom": {
      if (!custom) {
        throw new CalendarDateError("A custom period requires an explicit range");
      }
      if (compareDates(custom.start, custom.end) === 1) {
        throw new CalendarDateError("Range start must not be after range end");
      }
      return custom;
    }
  }
}
