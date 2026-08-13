/**
 * Supported currencies.
 *
 * Lives in @finance/domain, not @finance/db, because the mobile app needs it
 * too — and importing the db package into a React Native bundle would drag
 * Prisma along with it.
 *
 * `decimals` drives display rounding only. Storage is always NUMERIC(18,4),
 * which is why a 0-decimal currency like JPY and a 3-decimal one like KWD
 * both fit without a schema change.
 */

export interface SupportedCurrency {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
}

export const SUPPORTED_CURRENCIES: readonly SupportedCurrency[] = [
  { code: "INR", name: "Indian Rupee", symbol: "₹", decimals: 2 },
  { code: "USD", name: "US Dollar", symbol: "$", decimals: 2 },
  { code: "EUR", name: "Euro", symbol: "€", decimals: 2 },
  { code: "GBP", name: "British Pound", symbol: "£", decimals: 2 },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", decimals: 2 },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", decimals: 2 },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", decimals: 2 },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", decimals: 2 },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", decimals: 0 },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", decimals: 2 },
] as const;

export function isSupportedCurrency(code: string): boolean {
  return SUPPORTED_CURRENCIES.some((c) => c.code === code);
}

export function findCurrency(code: string): SupportedCurrency | undefined {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code);
}
