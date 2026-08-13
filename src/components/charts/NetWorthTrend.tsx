import { Text, View } from "react-native";
import { formatMoney, money } from "@finance/domain";

import { useTheme } from "../../theme/tokens";

export interface NetWorthTrendPoint {
  month: string;
  netWorth: string;
}

function monthLabel(month: string, withYear = false): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-IN", {
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });
}

/**
 * Net worth month by month, as columns rising and falling from a zero line.
 *
 * Built from layout primitives — this app ships no charting library (D-21).
 *
 * Two things this chart has to get right that a spending chart does not:
 *
 *  1. **Net worth can be negative.** The plot area is split around a real zero
 *     rule, proportionally to how far the series actually goes each way, so a
 *     debt of ₹40,000 and savings of ₹40,000 are drawn the same size. Clamping
 *     negatives to zero would hide exactly the situation a user most needs to
 *     see.
 *
 *  2. **The axis does not start at zero by accident.** Columns are measured
 *     from zero, not from the minimum value, so a series that drifts between
 *     ₹9.8L and ₹10L looks flat — because it is. Zooming the baseline would
 *     turn ordinary noise into a dramatic cliff.
 *
 * Colour is never the only channel: the sign is carried by which side of the
 * zero rule a column sits on, and the figures are printed as text beneath.
 */
export function NetWorthTrend({
  data,
  currency,
  height = 140,
}: {
  data: NetWorthTrendPoint[];
  currency: string;
  height?: number;
}) {
  const theme = useTheme();

  // Extremes are tracked as the ORIGINAL strings, not as recomputed numbers:
  // the labels below print money, and money never round-trips through a float
  // in this codebase. Numbers appear only in the pixel arithmetic.
  const peak = data.reduce<string | null>(
    (acc, point) =>
      acc === null || Number(point.netWorth) > Number(acc) ? point.netWorth : acc,
    null,
  );
  const low = data.reduce<string | null>(
    (acc, point) =>
      acc === null || Number(point.netWorth) < Number(acc) ? point.netWorth : acc,
    null,
  );

  const maxPositive = Math.max(0, Number(peak ?? 0));
  const maxNegative = Math.abs(Math.min(0, Number(low ?? 0)));
  const span = maxPositive + maxNegative;

  if (data.length === 0 || span === 0) {
    return (
      <View style={{ paddingVertical: 20, alignItems: "center" }}>
        <Text style={{ color: theme.textSubtle, fontSize: 13, textAlign: "center" }}>
          Nothing to plot yet. Add an account balance or a transaction and your position appears
          here.
        </Text>
      </View>
    );
  }

  // The zero rule sits where the two halves meet, so both are on one scale.
  const positiveArea = Math.round((maxPositive / span) * height);
  const negativeArea = height - positiveArea;

  const last = data.length - 1;

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "stretch", gap: 3 }}>
        {data.map((point, index) => {
          const value = Number(point.netWorth);
          const negative = value < 0;

          const barHeight = negative
            ? maxNegative === 0
              ? 0
              : Math.max(2, (Math.abs(value) / maxNegative) * negativeArea)
            : maxPositive === 0
              ? 0
              : value === 0
                ? 0
                : Math.max(2, (value / maxPositive) * positiveArea);

          // A crowded axis is unreadable at 375px, so only the ends and each
          // year turn are labelled; the rest keep their column width.
          const labelled = index === 0 || index === last || point.month.endsWith("-01");

          return (
            <View key={point.month} style={{ flex: 1, gap: 4 }}>
              <View
                accessible
                accessibilityLabel={`${monthLabel(point.month, true)}: ${formatMoney(
                  money(point.netWorth),
                  { currency },
                )}`}
                style={{ height }}
              >
                <View style={{ height: positiveArea, justifyContent: "flex-end" }}>
                  {!negative ? (
                    <View
                      style={{
                        height: barHeight,
                        backgroundColor: theme.chartIncome,
                        borderTopLeftRadius: 3,
                        borderTopRightRadius: 3,
                      }}
                    />
                  ) : null}
                </View>

                {/* The zero rule. Columns are read against it, so it is drawn
                    rather than implied by the edge of the plot area. */}
                <View style={{ height: 1, backgroundColor: theme.border }} />

                <View style={{ height: Math.max(0, negativeArea - 1) }}>
                  {negative ? (
                    <View
                      style={{
                        height: barHeight,
                        backgroundColor: theme.chartExpense,
                        borderBottomLeftRadius: 3,
                        borderBottomRightRadius: 3,
                      }}
                    />
                  ) : null}
                </View>
              </View>

              <Text
                numberOfLines={1}
                style={{
                  color: index === last ? theme.textMuted : theme.textSubtle,
                  fontSize: 10,
                  fontWeight: index === last ? "700" : "500",
                  textAlign: "center",
                }}
              >
                {labelled ? monthLabel(point.month) : " "}
              </Text>
            </View>
          );
        })}
      </View>

      {/* One direct label on the scale's ceiling, and the floor only when the
          series actually goes below zero. A number on every column would be
          noise; a bare axis would leave the scale unreadable. */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
        <Text style={{ color: theme.textSubtle, fontSize: 11 }}>
          {maxNegative > 0 && low
            ? `low ${formatMoney(money(low), { currency })}`
            : "from zero"}
        </Text>
        <Text style={{ color: theme.textSubtle, fontSize: 11 }}>
          {maxPositive > 0 && peak ? `peak ${formatMoney(money(peak), { currency })}` : ""}
        </Text>
      </View>
    </View>
  );
}
