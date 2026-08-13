import Decimal from "decimal.js";

/**
 * Money handling for the whole application.
 *
 * Rules (docs/IMPLEMENTATION_PLAN.md D-03):
 *   - Amounts are NUMERIC(18,4) at rest.
 *   - They are Decimal inside calculations.
 *   - They cross every boundary (API, mobile client) as a string.
 *   - They are never a JavaScript number. Ever.
 *
 * `number` is unsafe for money: 0.1 + 0.2 !== 0.3, and values above
 * 2^53 lose integer precision. Nothing here accepts a number.
 */

// Banker's rounding is the financial standard: it avoids the upward bias
// that ROUND_HALF_UP accumulates across many operations.
Decimal.set({ precision: 34, rounding: Decimal.ROUND_HALF_EVEN });

/** Digits kept after the decimal point at rest. Matches NUMERIC(18,4). */
export const MONEY_SCALE = 4;

/** Max digits before the decimal point, from NUMERIC(18,4). */
export const MONEY_MAX_INTEGER_DIGITS = 18 - MONEY_SCALE;

declare const moneyBrand: unique symbol;

/**
 * A canonical decimal string, always with exactly MONEY_SCALE fraction
 * digits (e.g. "1234.5600"). Branded so a bare string cannot be passed
 * where money is expected.
 */
export type Money = string & { readonly [moneyBrand]: true };

/** Matches an acceptable money input: optional sign, digits, optional fraction. */
const MONEY_INPUT = /^-?\d{1,14}(\.\d{1,4})?$/;

export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MoneyError";
  }
}

function normalise(value: Decimal): Money {
  return value.toFixed(MONEY_SCALE) as Money;
}

/**
 * True when `value` is a string this module can parse without loss.
 * Rejects empty strings, exponent notation, more than 4 decimal places
 * and anything that would overflow NUMERIC(18,4).
 */
export function isValidMoneyInput(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!MONEY_INPUT.test(trimmed)) return false;

  const [integerPart = ""] = trimmed.replace("-", "").split(".");
  return integerPart.length <= MONEY_MAX_INTEGER_DIGITS;
}

/**
 * Parse a decimal string into Money. Throws MoneyError on anything invalid.
 * Accepts only strings — passing a number is a type error by design.
 */
export function money(value: string | Decimal): Money {
  if (value instanceof Decimal) {
    if (!value.isFinite()) {
      throw new MoneyError("Money must be a finite value");
    }
    return normalise(value);
  }

  const trimmed = value.trim();
  if (!isValidMoneyInput(trimmed)) {
    throw new MoneyError(`Not a valid monetary amount: ${JSON.stringify(value)}`);
  }
  return normalise(new Decimal(trimmed));
}

/** Money zero, at canonical scale. */
export const ZERO: Money = normalise(new Decimal(0));

export function toDecimal(value: Money): Decimal {
  return new Decimal(value);
}

export function add(a: Money, b: Money): Money {
  return normalise(toDecimal(a).plus(toDecimal(b)));
}

export function subtract(a: Money, b: Money): Money {
  return normalise(toDecimal(a).minus(toDecimal(b)));
}

/** Multiply money by a plain ratio (e.g. a tax rate). Ratios are not money. */
export function multiply(a: Money, factor: number | string): Money {
  return normalise(toDecimal(a).times(new Decimal(factor)));
}

export function negate(a: Money): Money {
  return normalise(toDecimal(a).negated());
}

export function absolute(a: Money): Money {
  return normalise(toDecimal(a).abs());
}

export function sum(values: readonly Money[]): Money {
  return values.reduce<Money>((acc, v) => add(acc, v), ZERO);
}

/** -1 when a < b, 0 when equal, 1 when a > b. */
export function compare(a: Money, b: Money): -1 | 0 | 1 {
  return toDecimal(a).comparedTo(toDecimal(b)) as -1 | 0 | 1;
}

export function equals(a: Money, b: Money): boolean {
  return compare(a, b) === 0;
}

export function isZero(a: Money): boolean {
  return toDecimal(a).isZero();
}

export function isNegative(a: Money): boolean {
  return toDecimal(a).isNegative() && !toDecimal(a).isZero();
}

export function isPositive(a: Money): boolean {
  return toDecimal(a).greaterThan(0);
}

/**
 * `part` as a percentage of `whole`.
 *
 * Returns null when `whole` is zero — a savings rate with no income is
 * undefined, not 0%. Callers must render null as "—" rather than "0%".
 * See docs/IMPLEMENTATION_PLAN.md §12.
 */
export function percentageOf(part: Money, whole: Money): number | null {
  if (isZero(whole)) return null;
  return toDecimal(part).dividedBy(toDecimal(whole)).times(100).toNumber();
}

/**
 * Format for display. Rounds to the currency's display scale (2 for INR);
 * the stored value keeps its full 4-digit precision.
 */
export function formatMoney(
  value: Money,
  options: { currency?: string; locale?: string; showSign?: boolean } = {},
): string {
  const { currency = "INR", locale = "en-IN", showSign = false } = options;

  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    signDisplay: showSign ? "exceptZero" : "auto",
  }).format(toDecimal(value).toNumber());

  return formatted;
}

/** Strip the currency symbol — for inputs and compact table cells. */
export function formatAmount(value: Money, locale = "en-IN"): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toDecimal(value).toNumber());
}

/**
 * Convert an amount using an exchange rate, producing the value stored in
 * `baseAmount`.
 *
 * Rounds HALF_UP (away from zero) rather than this module's usual HALF_EVEN,
 * because it must agree exactly with PostgreSQL's `round(numeric, 4)`. The
 * migration enforces `baseAmount = round(amount * fxRate, 4)` as a CHECK
 * constraint, so a rounding mismatch here is not a cosmetic difference — the
 * database rejects the write outright.
 */
export function convert(amount: Money, rate: string): Money {
  return toDecimal(amount)
    .times(new Decimal(rate))
    .toDecimalPlaces(MONEY_SCALE, Decimal.ROUND_HALF_UP)
    .toFixed(MONEY_SCALE) as Money;
}

/**
 * Divide money by a whole-number count — an average, or an instalment.
 *
 * Exists because `Number(amount) / n` is the easiest way to reintroduce the
 * float error this module is built to prevent: ₹10,000 over 3 months yields
 * 3333.3333333333335, which is not a representable monetary amount at all.
 *
 * The result is rounded to the canonical scale, so instalments will not
 * always re-sum exactly to the original — that is inherent to dividing money,
 * and callers that need exactness must allocate a remainder explicitly.
 */
export function divide(amount: Money, divisor: number): Money {
  if (!Number.isFinite(divisor) || divisor === 0) {
    throw new MoneyError(`Cannot divide money by ${divisor}`);
  }
  return normalise(toDecimal(amount).dividedBy(new Decimal(divisor)));
}
