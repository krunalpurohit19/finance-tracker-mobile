import { z } from "zod";

/**
 * Credential rules, shared by the API and the mobile app so the client shows
 * the same requirement the server will actually enforce. Nothing is more
 * annoying than a form that accepts input the server then rejects.
 */

export const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter your email")
  .email("Enter a valid email address")
  .max(254);

/**
 * 10 characters minimum, matching `minPasswordLength` in the Better Auth
 * config. Length is the property that actually resists brute force —
 * composition rules mostly push people toward "Password1!".
 */
export const password = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(128, "Keep it under 128 characters");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
});

export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(80),
  email,
  password,
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
