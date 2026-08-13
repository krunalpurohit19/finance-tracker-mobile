import { z } from "zod";

/**
 * How much history the net-worth trend should cover.
 *
 * A month count rather than a date range: the series is always anchored to the
 * current month, because "net worth as of some past date" is a different
 * question from "how my position has moved", and only the second one is what
 * this screen answers.
 *
 * Capped at 120 months. The history query fans out accounts x months, so an
 * unbounded value would let a request ask the database for arbitrary work.
 */
export const netWorthQuery = z.object({
  // eslint-disable-next-line no-restricted-syntax -- a month count is a count, not money
  months: z.coerce.number().int().min(2).max(120).default(12),
});

export type NetWorthQuery = z.infer<typeof netWorthQuery>;
