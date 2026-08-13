import { z } from "zod";
import { startOfMonth, type CalendarDate } from "@finance/domain";
import { calendarDateString, id, positiveMoneyString } from "./primitives";

/**
 * The share of a budget at which it counts as "near limit".
 *
 * A product constant, defined once. Scattering `0.8` through components is
 * how a threshold ends up meaning three different things on three screens.
 */
export const NEAR_LIMIT_THRESHOLD = 80;

export const BUDGET_STATUSES = ["OK", "NEAR_LIMIT", "EXCEEDED"] as const;
export type BudgetStatus = (typeof BUDGET_STATUSES)[number];

/**
 * A month, normalised to its first day.
 *
 * The database enforces `date_trunc('month', effectiveFrom) = effectiveFrom`,
 * so accepting any day and snapping it here means a caller can pass "today"
 * without having to know that rule.
 */
export const monthStart = calendarDateString.transform((value): CalendarDate =>
  startOfMonth(value),
);

export const createBudgetSchema = z.object({
  /** Omit for an overall budget across every category. */
  categoryId: id.optional(),
  amount: positiveMoneyString,
  /** Defaults to the current month on the server. */
  effectiveFrom: monthStart.optional(),
});

/**
 * Changing the amount does NOT rewrite the existing row — the service closes
 * it and opens a new one, so months already reported keep the budget they
 * actually had. See docs/IMPLEMENTATION_PLAN.md §11.
 */
export const updateBudgetSchema = z.object({
  amount: positiveMoneyString,
  /** The month the new amount starts applying. Defaults to the current month. */
  effectiveFrom: monthStart.optional(),
});

export const budgetMonthQuery = z.object({
  /** Any date in the month of interest; snapped to the 1st. */
  month: monthStart.optional(),
});

export const budgetHistoryQuery = z.object({
  // eslint-disable-next-line no-restricted-syntax -- a month count is not money
  months: z.coerce.number().int().min(1).max(24).default(6),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
