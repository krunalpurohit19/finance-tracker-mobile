import { Text, View } from "react-native";
import { absolute, money } from "@finance/domain";

import { Amount } from "./Amount";
import { ProgressBar } from "./ProgressBar";
import { StatusPill, toneColors, type PillTone } from "./StatusPill";
import type { BudgetProgress } from "../features/budgets/queries";
import { useTheme } from "../theme/tokens";

/**
 * Status comes from the server (it owns the "near limit" threshold) and is
 * shown as a word and an icon as well as a colour.
 */
const STATUS: Record<
  BudgetProgress["status"],
  { label: string; tone: PillTone; icon: "checkmark-circle" | "warning" | "alert-circle" }
> = {
  OK: { label: "OK", tone: "good", icon: "checkmark-circle" },
  NEAR_LIMIT: { label: "Near limit", tone: "warn", icon: "warning" },
  EXCEEDED: { label: "Exceeded", tone: "bad", icon: "alert-circle" },
};

export function BudgetCard({
  budget,
  title,
  currency,
  prominent = false,
}: {
  budget: BudgetProgress;
  title: string;
  currency?: string;
  prominent?: boolean;
}) {
  const theme = useTheme();
  const status = STATUS[budget.status];
  const percent = budget.percentUsed ?? 0;
  const over = budget.status === "EXCEEDED";

  return (
    <View accessible style={[theme.card, { padding: 16, gap: 12 }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text
          style={{ color: theme.text, fontSize: prominent ? 17 : 15, fontWeight: "600", flex: 1 }}
          numberOfLines={1}
        >
          {title}
        </Text>
        <StatusPill label={status.label} tone={status.tone} icon={status.icon} />
      </View>

      <View style={{ flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", columnGap: 6 }}>
        <Amount value={money(budget.spent)} currency={currency} size={prominent ? "lg" : "md"} tone="neutral" />
        <Text style={{ color: theme.textSubtle, fontSize: 14 }}>of</Text>
        <Amount value={money(budget.amount)} currency={currency} size="sm" tone="neutral" />
      </View>

      <ProgressBar percent={percent} color={toneColors(status.tone, theme).fg} />

      <View style={{ flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap", columnGap: 12 }}>
        {/* Words, not just a bar: "₹600 left" or "₹1,200 over". */}
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
          <Amount value={absolute(money(budget.remaining))} currency={currency} size="sm" tone="neutral" />
          <Text style={{ color: theme.textMuted, fontSize: 13 }}>{over ? "over" : "left"}</Text>
        </View>
        <Text style={{ color: theme.textSubtle, fontSize: 13, fontVariant: ["tabular-nums"] }}>
          {percent.toFixed(0)}% used
        </Text>
      </View>
    </View>
  );
}
