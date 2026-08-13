import { z } from "zod";
import {
  calendarDateString,
  displayName,
  hexColor,
  id,
  moneyString,
  optionalText,
  positiveMoneyString,
} from "./primitives";

export const GOAL_STATUSES = ["ACTIVE", "ACHIEVED", "ARCHIVED"] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];

export const createGoalSchema = z.object({
  name: displayName,
  targetAmount: positiveMoneyString,
  targetDate: calendarDateString.optional(),
  /** Optional pointer to where the money actually sits. */
  accountId: id.optional(),
  color: hexColor.optional(),
  icon: optionalText(40),
});

export const updateGoalSchema = z.object({
  name: displayName.optional(),
  targetAmount: positiveMoneyString.optional(),
  targetDate: calendarDateString.nullable().optional(),
  accountId: id.nullable().optional(),
  color: hexColor.optional(),
  icon: optionalText(40),
});

/**
 * A contribution DESIGNATES money toward a goal; it does not move money.
 *
 * The amount may be negative — that is a withdrawal from the goal — so this
 * uses `moneyString` rather than the positive-only variant. Zero is rejected
 * by a CHECK constraint because a zero contribution means nothing.
 */
export const createContributionSchema = z.object({
  amount: moneyString.refine((value) => Number(value) !== 0, {
    message: "Enter an amount above or below zero",
  }),
  occurredOn: calendarDateString.optional(),
  /** Optional link to the transfer that actually moved the money. */
  transactionId: id.optional(),
  notes: optionalText(200),
});

export const listGoalsQuery = z.object({
  includeArchived: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .default(false)
    .transform((v) => v === true || v === "true"),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type CreateContributionInput = z.infer<typeof createContributionSchema>;
