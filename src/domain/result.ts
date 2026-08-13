/**
 * Services return Result rather than throwing for *expected* failures
 * (docs/IMPLEMENTATION_PLAN.md §21). Throwing is reserved for genuine bugs,
 * which makes an unhandled exception a real signal instead of control flow.
 */

export type Result<T, E = ServiceError> =
  { readonly ok: true; readonly data: T } | { readonly ok: false; readonly error: E };

export function ok<T>(data: T): Result<T, never> {
  return { ok: true, data };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is { ok: true; data: T } {
  return result.ok;
}

export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return !result.ok;
}

/** Unwrap or throw. Only for tests and scripts, never in request handling. */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) return result.data;
  throw new Error(`Attempted to unwrap a failed Result: ${JSON.stringify(result.error)}`);
}

// ─── Errors ────────────────────────────────────────────────────────────────

export const ERROR_CODES = [
  "VALIDATION_FAILED",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "ACCOUNT_ARCHIVED",
  "SAME_ACCOUNT_TRANSFER",
  "CURRENCY_MISMATCH",
  "MISSING_EXCHANGE_RATE",
  "CATEGORY_IN_USE",
  "ACCOUNT_IN_USE",
  "DUPLICATE_RECURRENCE",
  "BUDGET_OVERLAP",
  "GOAL_ARCHIVED",
  "RATE_LIMITED",
  "INTERNAL",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

/** Field-level messages, keyed by form field name. */
export type FieldErrors = Record<string, string[]>;

export interface ServiceError {
  readonly code: ErrorCode;
  /** Safe to show a user. Never contains SQL, table names or stack traces. */
  readonly message: string;
  readonly fieldErrors?: FieldErrors;
}

export function serviceError(
  code: ErrorCode,
  message: string,
  fieldErrors?: FieldErrors,
): ServiceError {
  return fieldErrors ? { code, message, fieldErrors } : { code, message };
}

/**
 * HTTP status per error code. Note NOT_FOUND and FORBIDDEN both map to 404:
 * every query is scoped by userId, so another user's id simply returns no
 * rows and the API must not confirm the resource exists (§21).
 */
export const ERROR_STATUS: Record<ErrorCode, number> = {
  VALIDATION_FAILED: 422,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 404,
  NOT_FOUND: 404,
  CONFLICT: 409,
  ACCOUNT_ARCHIVED: 409,
  SAME_ACCOUNT_TRANSFER: 422,
  CURRENCY_MISMATCH: 422,
  MISSING_EXCHANGE_RATE: 422,
  CATEGORY_IN_USE: 409,
  ACCOUNT_IN_USE: 409,
  DUPLICATE_RECURRENCE: 409,
  BUDGET_OVERLAP: 409,
  GOAL_ARCHIVED: 409,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};
