import { useSyncExternalStore } from "react";
import { Text } from "react-native";
import * as SecureStore from "expo-secure-store";
import { formatMoney, isNegative, isZero, type Money } from "@finance/domain";

import { useSettings } from "../features/settings/queries";
import { useTheme } from "../theme/tokens";

type Tone = "auto" | "income" | "expense" | "neutral";

interface AmountProps {
  value: Money;
  currency?: string;
  /** Defaults to the locale in the user's settings (en-IN groups as 1,25,850). */
  locale?: string;
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  tone?: Tone;
  /** Render a leading + / − glyph. */
  showSign?: boolean;
}

const SIZES = { sm: 14, md: 17, lg: 24, xl: 34, hero: 38 } as const;

// ─── Hide amounts ────────────────────────────────────────────────────────────
// One switch for the whole app (the eye on the Home hero), remembered across
// launches. Every <Amount> masks itself, so no screen can forget to.

const HIDE_KEY = "finance.hide_amounts";
let hidden = false;
const listeners = new Set<() => void>();
try {
  hidden = SecureStore.getItem(HIDE_KEY) === "1";
} catch {
  // Unavailable store: amounts simply start visible.
}

export function useHideAmounts(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => hidden,
  );
}

export function toggleHideAmounts() {
  hidden = !hidden;
  SecureStore.setItemAsync(HIDE_KEY, hidden ? "1" : "0").catch(() => {});
  listeners.forEach((l) => l());
}

/** The user's number locale; falls back when settings haven't loaded. */
export function useLocale(): string {
  return useSettings().data?.preferences.locale || "en-IN";
}

/** formatMoney, but a locale tag the runtime rejects can't crash a screen. */
export function formatMoneySafe(
  value: Money,
  options: { currency?: string | undefined; locale?: string; showSign?: boolean },
): string {
  try {
    return formatMoney(value, { ...options, currency: options.currency ?? "INR" });
  } catch {
    return formatMoney(value, { ...options, currency: options.currency ?? "INR", locale: "en-IN" });
  }
}

/** Money as inline text ("₹600 to go"), following the locale and the hide switch. */
export function useMoneyText(): (value: Money, currency?: string) => string {
  const locale = useLocale();
  const hide = useHideAmounts();
  return (value, currency) => (hide ? "••••" : formatMoneySafe(value, { currency, locale }));
}

/**
 * Renders money.
 *
 * Rules baked in rather than left to callers:
 *
 *  1. Tabular figures, so columns of numbers align and don't jitter.
 *  2. Financial state is never communicated by colour alone — a negative
 *     value carries an explicit "−" glyph.
 *  3. On large sizes the decimals drop to the subtle colour, so the eye
 *     reads the rupees first.
 */
export function Amount({
  value,
  currency = "INR",
  locale,
  size = "md",
  tone = "auto",
  showSign = false,
}: AmountProps) {
  const theme = useTheme();
  const userLocale = useLocale();
  const hide = useHideAmounts();
  const negative = isNegative(value);

  const resolvedTone: Tone =
    tone === "auto" ? (isZero(value) ? "neutral" : negative ? "expense" : "income") : tone;

  const color =
    resolvedTone === "income"
      ? theme.income
      : resolvedTone === "expense"
        ? theme.expense
        : theme.text;

  const big = size === "hero" || size === "xl" || size === "lg";
  const text = formatMoneySafe(value, {
    currency,
    locale: locale ?? userLocale,
    showSign: showSign && !negative,
  });
  // "₹1,25,850.98" → ["₹1,25,850", ".98"]; anything unexpected stays whole.
  const parts = big ? /^(.*\d)([.,]\d+)(\D*)$/.exec(text) : null;

  return (
    <Text
      accessibilityLabel={hide ? "Amount hidden" : text}
      // The hero must not push the layout apart at the largest system font.
      maxFontSizeMultiplier={big ? 1.4 : 2}
      numberOfLines={1}
      adjustsFontSizeToFit={big}
      style={{
        color,
        fontSize: SIZES[size],
        fontWeight: big ? "600" : "600",
        fontVariant: ["tabular-nums"],
        letterSpacing: size === "hero" ? -1 : size === "xl" ? -0.5 : 0,
      }}
    >
      {hide ? (
        "••••••"
      ) : parts ? (
        <>
          {parts[1]}
          <Text style={{ color: theme.textSubtle }}>
            {parts[2]}
            {parts[3]}
          </Text>
        </>
      ) : (
        text
      )}
    </Text>
  );
}
