import { z } from "zod";
import { displayName, hexColor, id, optionalText } from "./primitives";

export const CATEGORY_KINDS = ["EXPENSE", "INCOME"] as const;
export type CategoryKind = (typeof CATEGORY_KINDS)[number];

export const createCategorySchema = z.object({
  name: displayName,
  kind: z.enum(CATEGORY_KINDS),
  parentId: id.optional(),
  color: hexColor.optional(),
  icon: optionalText(40),
});

/**
 * `kind` is absent on purpose — see categoryService.update. Flipping a
 * category from EXPENSE to INCOME would retroactively move every transaction
 * filed under it from one side of the ledger to the other.
 */
export const updateCategorySchema = z.object({
  name: displayName.optional(),
  parentId: id.nullable().optional(),
  color: hexColor.optional(),
  icon: optionalText(40),
});

export const listCategoriesQuery = z.object({
  kind: z.enum(CATEGORY_KINDS).optional(),
  includeArchived: z
    .union([z.boolean(), z.enum(["true", "false"])])
    .default(false)
    .transform((v) => v === true || v === "true"),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
