import {
  addDays,
  addMonths,
  calendarDate,
  compareDates,
  daysInMonth,
  type CalendarDate,
} from "./dates";

/**
 * Recurrence date arithmetic.
 *
 * Pure and dependency-free, so every awkward case — the 31st in February, a
 * yearly rule anchored on 29 February, a rule resumed after months away — is
 * unit-testable without a database.
 */

export const FREQUENCIES = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;
export type Frequency = (typeof FREQUENCIES)[number];

export interface RecurrenceRule {
  frequency: Frequency;
  /** Every N periods. 1 = every period. */
  interval: number;
  startOn: CalendarDate;
  endOn?: CalendarDate | undefined;
  /** MONTHLY only. Defaults to the day-of-month of `startOn`. */
  dayOfMonth?: number | undefined;
}

/**
 * Safety valve. A daily rule left dormant for years should not attempt to
 * materialise tens of thousands of transactions in one request.
 */
export const MAX_OCCURRENCES_PER_RUN = 500;

export class RecurrenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RecurrenceError";
  }
}

/**
 * The nth occurrence of a rule, counting from zero.
 *
 * Computed from the ANCHOR each time rather than by stepping forward from the
 * previous occurrence. That distinction is the whole ballgame for monthly
 * rules: stepping from 31 Jan gives 28 Feb, then 28 Mar, and the rule has
 * silently drifted off the 31st forever. Anchoring gives 31 Jan, 28 Feb,
 * 31 Mar — clamped where a month is short, but never permanently moved.
 */
export function occurrenceAt(rule: RecurrenceRule, index: number): CalendarDate {
  if (index < 0) throw new RecurrenceError("Occurrence index must not be negative");
  if (!Number.isInteger(rule.interval) || rule.interval < 1) {
    throw new RecurrenceError("Interval must be a positive whole number");
  }

  const step = index * rule.interval;

  switch (rule.frequency) {
    case "DAILY":
      return addDays(rule.startOn, step);

    case "WEEKLY":
      return addDays(rule.startOn, step * 7);

    case "MONTHLY": {
      if (rule.dayOfMonth === undefined) return addMonths(rule.startOn, step);

      // An explicit day-of-month re-anchors every month, so a rule set to the
      // 31st still lands on the 31st in months that have one.
      const shifted = addMonths(rule.startOn, step);
      const [year, month] = shifted.split("-").map(Number) as [number, number];
      const day = Math.min(rule.dayOfMonth, daysInMonth(year, month));
      return calendarDate(
        `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      );
    }

    case "YEARLY":
      return addMonths(rule.startOn, step * 12);
  }
}

/**
 * Every occurrence falling in [from, to], inclusive.
 *
 * Returns at most MAX_OCCURRENCES_PER_RUN entries; the caller can tell it was
 * truncated because the last entry is still before `to`.
 */
export function occurrencesBetween(
  rule: RecurrenceRule,
  from: CalendarDate,
  to: CalendarDate,
): CalendarDate[] {
  if (compareDates(from, to) === 1) return [];

  const occurrences: CalendarDate[] = [];

  for (let index = 0; occurrences.length < MAX_OCCURRENCES_PER_RUN; index += 1) {
    const occurrence = occurrenceAt(rule, index);

    if (compareDates(occurrence, to) === 1) break;
    if (rule.endOn && compareDates(occurrence, rule.endOn) === 1) break;

    if (compareDates(occurrence, from) >= 0) occurrences.push(occurrence);

    // A guard against a malformed rule producing a non-advancing sequence.
    if (index > 0 && occurrence === occurrenceAt(rule, index - 1)) {
      throw new RecurrenceError("Recurrence rule does not advance");
    }
  }

  return occurrences;
}

/**
 * The first occurrence strictly after `after`, or null once the rule has run
 * out. Used to park `nextOccurrence` on the row after a generation run.
 */
export function nextOccurrenceAfter(
  rule: RecurrenceRule,
  after: CalendarDate,
): CalendarDate | null {
  for (let index = 0; index < MAX_OCCURRENCES_PER_RUN * 4; index += 1) {
    const occurrence = occurrenceAt(rule, index);
    if (rule.endOn && compareDates(occurrence, rule.endOn) === 1) return null;
    if (compareDates(occurrence, after) === 1) return occurrence;
  }
  return null;
}

/** The first occurrence on or after `startOn` — simply the rule's own start. */
export function firstOccurrence(rule: RecurrenceRule): CalendarDate {
  return occurrenceAt(rule, 0);
}
