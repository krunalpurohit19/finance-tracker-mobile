import { z } from "zod";
import { calendarDateString, currencyCode } from "./primitives";

/** Rate: one unit of `fromCurrency` expressed in `toCurrency`. */
export const rateValue = z
  .string()
  .trim()
  .regex(/^\d{1,10}(\.\d{1,8})?$/, "Enter a valid rate")
  .refine((v) => Number(v) > 0, "Rate must be greater than zero");

export const upsertExchangeRateSchema = z
  .object({
    fromCurrency: currencyCode,
    toCurrency: currencyCode,
    rate: rateValue,
    /** Defaults to the start of time so the rate applies to all history. */
    effectiveFrom: calendarDateString.optional(),
  })
  .refine((data) => data.fromCurrency !== data.toCurrency, {
    message: "Choose two different currencies",
    path: ["toCurrency"],
  });

export const listExchangeRatesQuery = z.object({
  fromCurrency: currencyCode.optional(),
  toCurrency: currencyCode.optional(),
});

export type UpsertExchangeRateInput = z.infer<typeof upsertExchangeRateSchema>;
