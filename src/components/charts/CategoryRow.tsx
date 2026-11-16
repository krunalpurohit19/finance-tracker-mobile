import { Text, View } from "react-native";
import { money } from "@finance/domain";

import { Amount } from "../Amount";
import { useTheme } from "../../theme/tokens";

const TICKS = 30;

/**
 * One ranked category: name, share and amount as text, with a 30-tick bar
 * repeating the share. The bar never carries information alone.
 */
export function CategoryRow({
  label,
  total,
  share,
  color,
  currency,
}: {
  label: string;
  total: string;
  /** 0–100, from the server. */
  share: number;
  color: string;
  currency: string;
}) {
  const theme = useTheme();
  // A non-zero share always lights at least one tick.
  const lit = share <= 0 ? 0 : Math.max(1, Math.min(TICKS, Math.round((share / 100) * TICKS)));

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
        <Text style={{ color: theme.text, fontSize: 15, fontWeight: "500", flex: 1 }} numberOfLines={1}>
          {label}
        </Text>
        <Text style={{ color: theme.textSubtle, fontSize: 13, fontVariant: ["tabular-nums"] }}>
          {share.toFixed(0)}%
        </Text>
        <Amount value={money(total)} currency={currency} size="sm" tone="neutral" />
      </View>
      <View
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={{ flexDirection: "row", gap: 2.5, height: 18 }}
      >
        {Array.from({ length: TICKS }, (_, i) => (
          <View
            key={i}
            style={{ flex: 1, borderRadius: 2, backgroundColor: i < lit ? color : theme.fill }}
          />
        ))}
      </View>
    </View>
  );
}
