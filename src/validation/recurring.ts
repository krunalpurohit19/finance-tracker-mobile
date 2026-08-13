import { z } from "zod";
import { FREQUENCIES } from "@finance/domain";
import {
  calendarDateString,
  displayName,
  id,
  optionalText,
  positiveMoneyString,
} from "./primitives";
import { TRANSACTION_TYPES } from "./transactions";

export const createRecurringSchema = z
  .object({
    name: displayName,
    type: z.enum(TRANSACTION_TYPES),
    amount: positiveMoneyString,
    accountId: id,
    transferAccountId: id.optional(),
    categoryId: id.optional(),
    merchant: optionalText(120),
    notes: optionalText(500),

    frequency: z.enum(FREQUENCIES),
    // eslint-disable-next-line no-restricted-syntax -- a repeat interval is a count, not money
    interval: z.coerce.number().int().min(1).max(365).default(1),
    startOn: calendarDateString,
    endOn: calendarDateString.optional(),
    /** MONTHLY only. Defaults to the day-of-month of startOn. */
    // eslint-disable-next-line no-restricted-syntax -- a day-of-month is a count, not money
    dayOfMonth: z.coerce.number().int().min(1).max(31).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "TRANSFER") {
      if (!data.transferAccountId) {
        ctx.addIssue({
          code: "custom",
          message: "Choose a destination account",
          path: ["transferAccountId"],
        });
      } else if (data.transferAccountId === data.accountId) {
        ctx.addIssue({
          code: "custom",
          message: "Choose two different accounts",
          path: ["transferAccountId"],
        });
      }
    } else if (data.transferAccountId) {
      ctx.addIssue({
        code: "custom",
        message: "Only transfers have a destination account",
        path: ["transferAccountId"],
      });
    }

    if (data.endOn && data.endOn < data.startOn) {
      ctx.addIssue({
        code: "custom",
        message: "The end date can't be before the start date",
        path: ["endOn"],
      });
    }
  });

export const updateRecurringSchema = z.object({
  name: displayName.optional(),
  amount: positiveMoneyString.optional(),
  categoryId: id.nullable().optional(),
  merchant: optionalText(120),
  notes: optionalText(500),
  endOn: calendarDateString.nullable().optional(),
  isActive: z.boolean().optional(),
});

export type CreateRecurringInput = z.infer<typeof createRecurringSchema>;
export type UpdateRecurringInput = z.infer<typeof updateRecurringSchema>;
