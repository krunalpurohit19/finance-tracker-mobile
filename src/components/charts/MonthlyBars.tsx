import { Text, View } from "react-native";
import { formatMoney, money, type Money } from "@finance/domain";

import { useTheme } from "../../theme/tokens";

export interface MonthPoint {
  month: string;
  income: string;
  expenses: string;
}

interface MonthlyBarsProps {
  data: MonthPoint[];
  currency: string;
  height?: number;
}

function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-IN", {
    month: "short",
    timeZone: "UTC",
  });
}

/**
 * Grouped bars: income beside expenses, one pair per month.
 *
 * Bars rather than lines because months are discrete buckets, not samples of
 * a continuous signal — a line between March and April implies values in
 * between that do not exist.
 *
 * One shared scale for both series. Two y-axes would let the reader compare
 * heights that are not comparable.
 */
export function MonthlyBars({ data, currency, height = 132 }: MonthlyBarsProps) {
  const theme = useTheme();

  const max = data.reduce(
    (acc, point) => Math.max(acc, Number(point.income), Number(point.expenses)),
    0,
  );

  // Nothing to scale against: say so rather than drawing a flat, meaningless axis.
  if (max === 0) {
    return (
      <View style={{ paddingVertical: 20, alignItems: "center" }}>
        <Text style={{ color: theme.textSubtle, fontSize: 13 }}>
          No income or spending in this range yet.
        </Text>
      </View>
    );
  }

  const peak = money(String(max));

  return (
    <View style={{ gap: 10 }}>
      <Legend />

      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 4, height }}>
        {data.map((point) => {
          const income = Number(point.income);
          const expenses = Number(point.expenses);
          const isPeak = Math.max(income, expenses) === max;

          return (
            <View key={point.month} style={{ flex: 1, alignItems: "center", gap: 6 }}>
              <View
                accessible
                accessibilityLabel={`${monthLabel(point.month)}: earned ${point.income}, spent ${point.expenses} ${currency}`}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-end",
                  // 2px of surface between the two marks so they never fuse.
                  gap: 2,
                  height: height - 18,
                }}
              >
                <Bar
                  value={income}
                  max={max}
                  available={height - 18}
                  color={theme.chartIncome}
                />
                <Bar
                  value={expenses}
                  max={max}
                  available={height - 18}
                  color={theme.chartExpense}
                />
              </View>

              <Text
                style={{
                  color: isPeak ? theme.textMuted : theme.textSubtle,
                  fontSize: 11,
                  fontWeight: isPeak ? "700" : "500",
                }}
              >
                {monthLabel(point.month)}
              </Text>
            </View>
          );
        })}
      </View>

      {/* One direct label, on the scale's ceiling. A number on every bar
          would be noise; a bare axis would leave the scale unreadable. */}
      <Text style={{ color: theme.textSubtle, fontSize: 11, textAlign: "right" }}>
        peak {formatMoney(peak, { currency })}
      </Text>
    </View>
  );
}

function Bar({
  value,
  max,
  available,
  color,
}: {
  value: number;
  max: number;
  available: number;
  color: string;
}) {
  // A non-zero value always shows at least a sliver, so "small" never reads
  // as "none". A true zero stays truly empty.
  const ratio = max === 0 ? 0 : value / max;
  const barHeight = value === 0 ? 0 : Math.max(3, ratio * available);

  return (
    <View
      style={{
        width: 11,
        height: barHeight,
        backgroundColor: color,
        // Rounded only at the data end; the baseline stays square so the
        // bar visibly sits on zero.
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
      }}
    />
  );
}

function Legend() {
  const theme = useTheme();

  return (
    <View style={{ flexDirection: "row", gap: 16 }}>
      {[
        { label: "Earned", color: theme.chartIncome },
        { label: "Spent", color: theme.chartExpense },
      ].map((entry) => (
        <View key={entry.label} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View
            style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: entry.color }}
          />
          {/* Text wears text tokens, never the series colour. */}
          <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: "600" }}>
            {entry.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export type { Money };
