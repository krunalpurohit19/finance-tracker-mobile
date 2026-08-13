import { z } from "zod";
import { money } from "@finance/domain";
import {
  currencyCode,
  displayName,
  hexColor,
  id,
  moneyString,
  optionalText,
} from "./primitives";

export const ACCOUNT_TYPES = [
  "BANK",
  "CASH",
  "WALLET",
  "CREDIT_CARD",
  "INVESTMENT",
  "OTHER",
] as const;

export const ACCOUNT_CLASSES = ["ASSET", "LIABILITY"] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];
export type AccountClass = (typeof ACCOUNT_CLASSES)[number];

/**
 * Credit cards are liabilities; everything else defaults to an asset. The
 * client may still override, because a loan account could be typed OTHER.
 */
export function defaultClassFor(type: AccountType): AccountClass {
  return type === "CREDIT_CARD" ? "LIABILITY" : "ASSET";
}

export const createAccountSchema = z.object({
  name: displayName,
  type: z.enum(ACCOUNT_TYPES),
  class: z.enum(ACCOUNT_CLASSES).optional(),
  currency: currencyCode,
  // Negative is legitimate: a credit card usually opens owing money.
  // Money is a branded type, so the default must be branded too.
  openingBalance: moneyString.default(() => money("0")),
  institution: optionalText(80),
  last4: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Enter the last 4 digits")
    .optional(),
  color: hexColor.optional(),
  icon: optionalText(40),
  isDefault: z.boolean().default(false),
});

/**
 * Currency is absent on purpose — see accountService.update. Changing an
 * account's currency after it holds transactions would silently reinterpret
 * every amount already stored against it.
 */
export const updateAccountSchema = z.object({
  name: displayName.optional(),
  type: z.enum(ACCOUNT_TYPES).optional(),
  class: z.enum(ACCOUNT_CLASSES).optional(),
  openingBalance: moneyString.optional(),
  institution: optionalText(80),
  last4: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Enter the last 4 digits")
    .optional(),
  color: hexColor.optional(),
  icon: optionalText(40),
  isDefault: z.boolean().optional(),
});

export const reorderAccountsSchema = z.object({
  orderedIds: z.array(id).min(1, "Provide at least one account"),
});

export const listAccountsQuery = z.object({
  includeArchived: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .default(false)
    .transform((v) => v === true || v === "true"),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
