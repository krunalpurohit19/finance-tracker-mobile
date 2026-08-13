import { z } from "zod";
import { SUPPORTED_CURRENCIES } from "@finance/domain";
import {
  calendarDateString,
  currencyCode,
  displayName,
  optionalText,
  positiveMoneyString,
  timezone,
} from "./primitives";

export const THEMES = ["LIGHT", "DARK", "SYSTEM"] as const;
export type ThemeName = (typeof THEMES)[number];

/**
 * Date formats offered in Settings.
 *
 * A closed list rather than free text: the format string is handed to a
 * formatter, and an arbitrary one would either throw or silently render
 * something unreadable. These four cover the conventions our locales use.
 */
export const DATE_FORMATS = ["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd", "d MMM yyyy"] as const;
export type DateFormat = (typeof DATE_FORMATS)[number];

export const LOCALES = ["en-IN", "en-US", "en-GB", "en-AU", "en-CA", "en-SG"] as const;

export const updateProfileSchema = z.object({
  name: displayName,
});

/**
 * Presentation preferences. Every field is optional so a screen can save one
 * toggle without having to resend the others — a full-object PATCH would let
 * a stale form silently revert a setting changed on another device.
 */
export const updatePreferencesSchema = z
  .object({
    locale: z.enum(LOCALES).optional(),
    timezone: timezone.optional(),
    dateFormat: z.enum(DATE_FORMATS).optional(),
    theme: z.enum(THEMES).optional(),
    /** 0 = Sunday … 6 = Saturday, matching date-fns and Intl. */
    // eslint-disable-next-line no-restricted-syntax -- a weekday index is a count, not money
    weekStartsOn: z.coerce.number().int().min(0).max(6).optional(),
  })
  .refine((value) => Object.values(value).some((v) => v !== undefined), {
    message: "Nothing to change",
  });

/**
 * Changing the base currency is a data migration, not a preference.
 *
 * Every transaction stores `baseAmount` — its value in the base currency at
 * the rate in force when it happened — and a CHECK constraint ties that to
 * `amount * fxRate`. Switching the base currency therefore has to recompute
 * every row; leaving them alone would reinterpret ₹450 as $450.
 *
 * `confirm` must repeat the new code, so this cannot be triggered by a stray
 * tap on a currency picker.
 */
export const changeBaseCurrencySchema = z
  .object({
    baseCurrency: currencyCode.refine(
      (code) => SUPPORTED_CURRENCIES.some((c) => c.code === code),
      { message: "That currency isn't supported yet" },
    ),
    confirm: z.string().trim().toUpperCase(),
  })
  .refine((value) => value.confirm === value.baseCurrency, {
    message: "Type the currency code to confirm",
    path: ["confirm"],
  });

export const EXPORT_FORMATS = ["csv", "json"] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const exportQuery = z
  .object({
    format: z.enum(EXPORT_FORMATS).default("csv"),
    from: calendarDateString.optional(),
    to: calendarDateString.optional(),
    /** CSV only: the ledger, or everything the account holds. */
    scope: z.enum(["transactions", "all"]).default("transactions"),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: "Start date must not be after end date",
    path: ["to"],
  });

export type ExportQuery = z.infer<typeof exportQuery>;

/**
 * One row of an import file, as it arrives — every field a string, because
 * that is what a CSV gives you.
 *
 * V1 ships the VALIDATOR, not the importer (§26 Phase 11). A dry run tells the
 * user exactly which rows would fail and why, before anything is written. The
 * writing half is deliberately absent: a half-correct importer that silently
 * mangles a thousand rows is far worse than no importer at all.
 */
export const importRowSchema = z.object({
  type: z.enum(["EXPENSE", "INCOME", "TRANSFER"]),
  amount: positiveMoneyString,
  occurredOn: calendarDateString,
  account: displayName,
  transferAccount: optionalText(60),
  category: optionalText(60),
  merchant: optionalText(120),
  notes: optionalText(500),
});

export const importPreviewSchema = z.object({
  /** Parsed rows. Capped so one request cannot pin the process. */
  rows: z.array(z.record(z.string(), z.unknown())).min(1).max(5000),
});

export type ImportRow = z.infer<typeof importRowSchema>;
export type ImportPreviewInput = z.infer<typeof importPreviewSchema>;

/**
 * Deleting the account. Two independent confirmations:
 *
 *  - the current password, re-entered (a live session is not enough — a
 *    borrowed unlocked phone must not be able to erase someone's finances);
 *  - the literal word DELETE, so the intent is unambiguous.
 */
export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Enter your password"),
  confirm: z.literal("DELETE", {
    message: "Type DELETE to confirm",
  }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
export type ChangeBaseCurrencyInput = z.infer<typeof changeBaseCurrencySchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
