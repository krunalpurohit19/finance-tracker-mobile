import { Text, View } from "react-native";
import { formatMoney, isNegative, isZero, type Money } from "@finance/domain";

import { useTheme } from "../theme/tokens";

type Tone = "auto" | "income" | "expense" | "neutral";

interface AmountProps {
  value: Money;
  currency?: string;
  locale?: string;
  size?: "sm" | "md" | "lg" | "xl";
  tone?: Tone;
  /** Render a leading + / − glyph. */
  showSign?: boolean;
}

const SIZES = {
  sm: 14,
  md: 17,
  lg: 24,
  xl: 34,
} as const;

/**
 * Renders money.
 *
 * Two rules are baked in rather than left to callers:
 *
 *  1. Tabular figures, so columns of numbers align and don't jitter as
 *     values change.
 *  2. Financial state is never communicated by colour alone — a negative
 *     value carries an explicit "−" glyph, so it survives greyscale,
 *     colour-blindness and low-contrast outdoor screens.
 */
export function Amount({
  value,
  currency = "INR",
  locale = "en-IN",
  size = "md",
  tone = "auto",
  showSign = false,
}: AmountProps) {
  const theme = useTheme();
  const negative = isNegative(value);

  const resolvedTone: Tone =
    tone === "auto" ? (isZero(value) ? "neutral" : negative ? "expense" : "income") : tone;

  const color =
    resolvedTone === "income"
      ? theme.income
      : resolvedTone === "expense"
        ? theme.expense
        : theme.text;

  return (
    <View accessibilityRole="text" style={{ flexDirection: "row", alignItems: "baseline" }}>
      <Text
        style={{
          color,
          fontSize: SIZES[size],
          fontWeight: size === "xl" || size === "lg" ? "700" : "600",
          fontVariant: ["tabular-nums"],
          letterSpacing: size === "xl" ? -0.5 : 0,
        }}
      >
        {formatMoney(value, { currency, locale, showSign: showSign && !negative })}
      </Text>
    </View>
  );
}
