import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import type { BudgetProgress } from "../features/budgets/queries";
import type { Dashboard } from "../features/dashboard/queries";
import { useTheme } from "../theme/tokens";

export interface Insight {
  id: string;
  text: string;
}

/**
 * One plain sentence at a time, from simple rules over figures the server
 * already calculated — the worst news first. No amounts, so nothing here
 * needs hiding when amounts are hidden.
 */
export function buildInsights(dashboard: Dashboard, budgets: BudgetProgress[] | undefined): Insight[] {
  const insights: Insight[] = [];
  const name = (b: BudgetProgress) => b.categoryName ?? "overall";

  for (const b of budgets ?? []) {
    if (b.status === "EXCEEDED") {
      insights.push({ id: `over-${b.id}`, text: `You've gone over your ${name(b)} budget this month.` });
    }
  }
  for (const b of budgets ?? []) {
    if (b.status === "NEAR_LIMIT" && b.percentUsed != null) {
      insights.push({
        id: `near-${b.id}`,
        text: `Your ${name(b)} budget is ${b.percentUsed.toFixed(0)}% used. Go easy for the rest of the month.`,
      });
    }
  }
  if (dashboard.savingsRate != null && dashboard.savingsRate < 0) {
    insights.push({ id: "overspent", text: "You've spent more than you earned in this period." });
  }
  const top = dashboard.spendingByCategory[0];
  if (top && top.share >= 40) {
    insights.push({
      id: `top-${top.categoryId ?? "none"}`,
      text: `${top.categoryName} makes up ${top.share.toFixed(0)}% of your spending in this period.`,
    });
  }
  if (dashboard.savingsRate != null && dashboard.savingsRate >= 20) {
    insights.push({
      id: "saving-well",
      text: `You kept ${dashboard.savingsRate.toFixed(0)}% of what you earned in this period. Nicely done.`,
    });
  }
  return insights;
}

// Dismissals last for the session: the same sentence coming back on every
// pull-to-refresh would be nagging, but next launch it may matter again.
const dismissed = new Set<string>();

export function InsightBanner({ insights }: { insights: Insight[] }) {
  const theme = useTheme();
  const [, rerender] = useState(0);
  const [index, setIndex] = useState(0);

  const visible = insights.filter((i) => !dismissed.has(i.id));
  if (visible.length === 0) return null;
  const current = visible[index % visible.length]!;

  return (
    <View
      accessibilityLiveRegion="polite"
      style={{ backgroundColor: theme.brand, borderRadius: 20, padding: 16, gap: 8 }}
    >
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Text style={{ color: theme.onBrand, fontSize: 15, fontWeight: "500", lineHeight: 21, flex: 1 }}>
          {current.text}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss this insight"
          onPress={() => {
            dismissed.add(current.id);
            rerender((n) => n + 1);
          }}
          style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center", margin: -10 }}
        >
          <Ionicons name="close" size={20} color={theme.onBrand} />
        </Pressable>
      </View>

      {visible.length > 1 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Show the next insight"
          onPress={() => setIndex((i) => i + 1)}
          style={{ minHeight: 44, marginBottom: -12, flexDirection: "row", alignItems: "center", gap: 6 }}
        >
          <Text style={{ color: theme.onBrand, fontSize: 12.5, fontWeight: "600", opacity: 0.9 }}>
            {(index % visible.length) + 1} of {visible.length} · Next
          </Text>
          <Ionicons name="arrow-forward" size={13} color={theme.onBrand} />
        </Pressable>
      ) : null}
    </View>
  );
}
