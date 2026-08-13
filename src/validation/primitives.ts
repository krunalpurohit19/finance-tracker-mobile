import { z } from "zod";
import {
  MONEY_MAX_INTEGER_DIGITS,
  isValidCalendarDate,
  isValidMoneyInput,
  money,
  type CalendarDate,
  type Money,
} from "@finance/domain";

/**
 * Shared validation primitives, imported by BOTH the API and the mobile app
 * so a field is validated identically on each side. Client validation is UX;
 * the server re-parses everything regardless (docs/IMPLEMENTATION_PLAN.md §19).
 */

/**
 * A monetary amount arriving over the wire.
 *
 * Deliberately a string. `z.coerce.number()` on money is banned — it silently
 * introduces float error into a system that is otherwise exact, and it is the
 * single easiest way to corrupt this application's core guarantee.
 */
export const moneyString = z
  .string()
  .trim()
  .min(1, "Enter an amount")
  .refine(isValidMoneyInput, {
    message: `Enter a valid amount with up to 4 decimal places and ${MONEY_MAX_INTEGER_DIGITS} digits`,
  })
  .transform((value): Money => money(value));

/** A monetary amount that must be greater than zero — every transaction amount. */
export const positiveMoneyString = moneyString.refine(
  (value) => !value.startsWith("-") && Number.parseFloat(value) !== 0,
  { message: "Amount must be greater than zero" },
);

/** An ISO calendar date, "YYYY-MM-DD". Never a timestamp. */
export const calendarDateString = z
  .string()
  .trim()
  .refine(isValidCalendarDate, { message: "Enter a valid date as YYYY-MM-DD" })
  .transform((value) => value as CalendarDate);

/** A cuid produced by Prisma's @default(cuid()). */
export const id = z.string().trim().min(1, "Required").max(64);

/** ISO 4217 currency code. */
export const currencyCode = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Enter a 3-letter currency code");

/**
 * An IANA timezone the runtime actually recognises.
 *
 * Note `Intl.supportedValuesOf("timeZone")` is NOT usable here: it returns
 * only canonical zones, so it omits both "UTC" and "Asia/Kolkata" (which ICU
 * canonicalises to "Asia/Calcutta") — it would reject our own default.
 *
 * Instead: require an Area/Location shape (or literal UTC), which rejects
 * ambiguous abbreviations like "IST" that Intl otherwise silently accepts,
 * then let Intl reject anything it does not know.
 */
export const timezone = z
  .string()
  .trim()
  .refine(
    (value) => {
      if (value !== "UTC" && !value.includes("/")) return false;
      try {
        new Intl.DateTimeFormat("en-CA", { timeZone: value });
        return true;
      } catch {
        return false;
      }
    },
    { message: "Enter an IANA timezone such as Asia/Kolkata" },
  );

/** A short free-text label: account name, category name, goal name. */
export const displayName = z
  .string()
  .trim()
  .min(1, "Required")
  .max(60, "Keep this under 60 characters");

/**
 * Optional free text that normalises "" to undefined.
 *
 * `.optional()` must come LAST. With `.optional().transform(...)` the key
 * becomes required-but-possibly-undefined in the output type, forcing every
 * caller to write `institution: undefined` explicitly. Transforming first and
 * making the result optional keeps the key genuinely optional.
 */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters`)
    .transform((value) => (value === "" ? undefined : value))
    .optional();

/** A hex colour for account/category theming. */
export const hexColor = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Enter a colour as #RRGGBB");

/** Cursor pagination. Transaction lists never use OFFSET (§23). */
export const pagination = z.object({
  cursor: z.string().trim().max(200).optional(),
  // eslint-disable-next-line no-restricted-syntax -- a page size is a count, not money
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
