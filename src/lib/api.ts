import type { ErrorCode, FieldErrors } from "@finance/domain";

import { API_BASE_URL, getSessionToken } from "./auth-client";

/**
 * Typed client for the API's response envelope.
 *
 * The JWT token is read directly from SecureStore, preventing token logic
 * from leaking into feature code.
 */

export interface ApiError {
  code: ErrorCode;
  message: string;
  fieldErrors?: FieldErrors;
}

export class ApiRequestError extends Error {
  readonly code: ErrorCode;
  readonly fieldErrors: FieldErrors | undefined;
  readonly status: number;

  constructor(status: number, error: ApiError) {
    super(error.message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = error.code;
    this.fieldErrors = error.fieldErrors;
  }
}

type Envelope<T> = { ok: true; data: T } | { ok: false; error: ApiError };

async function request<T>(
  path: string,
  init: RequestInit & { query?: Record<string, string | boolean | undefined> } = {},
): Promise<T> {
  const { query, ...rest } = init;

  const url = new URL(`${API_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        // Attaches the stored JWT token
        Authorization: `Bearer ${getSessionToken() || ""}`,
        ...(rest.headers ?? {}),
      },
    });
  } catch {
    // A network failure is not the same as a rejected request, and the
    // message a user sees should say so rather than "something went wrong".
    throw new ApiRequestError(0, {
      code: "INTERNAL",
      message: "Can't reach the server. Check your connection and try again.",
    });
  }

  let body: Envelope<T>;
  try {
    body = (await response.json()) as Envelope<T>;
  } catch {
    throw new ApiRequestError(response.status, {
      code: "INTERNAL",
      message: "The server sent something unexpected.",
    });
  }

  if (!body.ok) throw new ApiRequestError(response.status, body.error);
  return body.data;
}

export const api = {
  get: <T>(path: string, query?: Record<string, string | boolean | undefined>) =>
    request<T>(path, { method: "GET", query }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),

  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),

  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
