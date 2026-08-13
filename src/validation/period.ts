import { z } from "zod";
import { PERIOD_PRESETS } from "@finance/domain";
import { calendarDateString } from "./primitives";

/** Period selection used by the dashboard and analytics screens. */
export const periodQuery = z
  .object({
    preset: z.enum(PERIOD_PRESETS).default("this-month"),
    from: calendarDateString.optional(),
    to: calendarDateString.optional(),
  })
  .refine((value) => value.preset !== "custom" || (value.from && value.to), {
    message: "A custom period needs both a start and an end date",
    path: ["from"],
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: "Start date must not be after end date",
    path: ["to"],
  });

export type PeriodQuery = z.infer<typeof periodQuery>;
