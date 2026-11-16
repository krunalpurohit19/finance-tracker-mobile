import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { money } from "@finance/domain";

import { Amount, toggleHideAmounts, useHideAmounts } from "./Amount";
import { type as typeScale, useTheme } from "../theme/tokens";

/**
 * The one number that owns the screen, with money in and out on a single
 * line beneath it and the switch that hides every amount in the app.
 */
export function BalanceHero({
  label,
  value,
  currency,
  income,
  expenses,
  periodLabel,
}: {
  label: string;
  value: string;
  currency: string;
  income: string;
  expenses: string;
  periodLabel: string;
}) {
  const theme = useTheme();
  const hidden = useHideAmounts();

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={[typeScale.label, { color: theme.textSubtle }]}>{label}</Text>
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{ checked: hidden }}
          accessibilityLabel="Hide amounts"
          onPress={toggleHideAmounts}
          style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center", margin: -10 }}
        >
          <Ionicons name={hidden ? "eye-off-outline" : "eye-outline"} size={20} color={theme.textMuted} />
        </Pressable>
      </View>

      <Amount value={money(value)} currency={currency} size="hero" tone="neutral" />

      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 14, rowGap: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons name="arrow-down-circle" size={16} color={theme.income} />
          <Amount value={money(income)} currency={currency} size="sm" tone="income" />
          <Text style={{ color: theme.textSubtle, fontSize: 13 }}>in</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons name="arrow-up-circle" size={16} color={theme.expense} />
          <Amount value={money(expenses)} currency={currency} size="sm" tone="expense" />
          <Text style={{ color: theme.textSubtle, fontSize: 13 }}>out</Text>
        </View>
        <Text style={{ color: theme.textSubtle, fontSize: 13, marginLeft: "auto" }}>{periodLabel}</Text>
      </View>
    </View>
  );
}
