import { z } from "zod";
import {
  calendarDateString,
  id,
  moneyString,
  optionalText,
  positiveMoneyString,
} from "./primitives";

export const TRANSACTION_TYPES = ["EXPENSE", "INCOME", "TRANSFER"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const TRANSACTION_SOURCES = ["MANUAL", "CSV", "SMS", "BANK", "API", "OTHER"] as const;

/** Fields every transaction type shares. */
const common = {
  amount: positiveMoneyString,
  accountId: id,
  occurredOn: calendarDateString,
  merchant: optionalText(120),
  notes: optionalText(500),
  /**
   * Override the rate used to convert into the base currency. Normally the
   * server resolves it from the user's stored rates; supplying it lets the
   * client record the rate a bank actually applied.
   */
  fxRate: z
    .string()
    .trim()
    .regex(/^\d{1,10}(\.\d{1,8})?$/, "Enter a valid exchange rate")
    .refine((v) => Number(v) > 0, "Exchange rate must be greater than zero")
    .optional(),
};

/**
 * A discriminated union, so the type system enforces the same shape the
 * database CHECK constraint does: a TRANSFER has a destination and no
 * category, and nothing else may carry transfer fields.
 *
 * `categoryId` stays optional for expense and income — requiring it at entry
 * would slow the single most frequent action in the app, and "uncategorised"
 * is an honest bucket that analytics can report on.
 */
export const createTransactionSchema = z
  .discriminatedUnion("type", [
    z.object({
      type: z.literal("EXPENSE"),
      ...common,
      categoryId: id.optional(),
    }),
    z.object({
      type: z.literal("INCOME"),
      ...common,
      categoryId: id.optional(),
    }),
    z.object({
      type: z.literal("TRANSFER"),
      ...common,
      transferAccountId: id,
      /**
       * What actually ARRIVED, in the destination account's currency.
       * Required only when the two accounts hold different currencies —
       * the server derives it for a same-currency transfer.
       */
      transferAmount: positiveMoneyString.optional(),
    }),
  ])
  .superRefine((data, ctx) => {
    if (data.type === "TRANSFER" && data.accountId === data.transferAccountId) {
      ctx.addIssue({
        code: "custom",
        message: "Choose two different accounts",
        path: ["transferAccountId"],
      });
    }
  });

export const updateTransactionSchema = z.object({
  amount: positiveMoneyString.optional(),
  accountId: id.optional(),
  transferAccountId: id.optional(),
  transferAmount: positiveMoneyString.optional(),
  categoryId: id.nullable().optional(),
  occurredOn: calendarDateString.optional(),
  merchant: optionalText(120),
  notes: optionalText(500),
  fxRate: common.fxRate,
});

/**
 * List filters. Cursor pagination, never OFFSET: at a deep page OFFSET is
 * slow and can skip or repeat rows when data changes mid-scroll.
 */
export const listTransactionsQuery = z.object({
  type: z.enum(TRANSACTION_TYPES).optional(),
  accountId: id.optional(),
  categoryId: id.optional(),
  from: calendarDateString.optional(),
  to: calendarDateString.optional(),
  minAmount: moneyString.optional(),
  maxAmount: moneyString.optional(),
  q: z.string().trim().max(120).optional(),
  cursor: z.string().trim().max(200).optional(),
  // eslint-disable-next-line no-restricted-syntax -- a page size is a count, not money
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuery>;
