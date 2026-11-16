import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { useTheme, type Theme } from "../theme/tokens";

export type PillTone = "good" | "warn" | "bad" | "brand" | "neutral";

export function toneColors(tone: PillTone, theme: Theme): { fg: string; bg: string } {
  switch (tone) {
    case "good":
      return { fg: theme.income, bg: theme.incomeSoft };
    case "warn":
      return { fg: theme.warning, bg: theme.warningSoft };
    case "bad":
      return { fg: theme.expense, bg: theme.expenseSoft };
    case "brand":
      return { fg: theme.brand, bg: theme.brandSoft };
    default:
      return { fg: theme.textMuted, bg: theme.fill };
  }
}

/** Status as a word (and optional icon) on a soft ground — never colour alone. */
export function StatusPill({
  label,
  tone,
  icon,
}: {
  label: string;
  tone: PillTone;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const theme = useTheme();
  const { fg, bg } = toneColors(tone, theme);
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: bg,
      }}
    >
      {icon ? <Ionicons name={icon} size={12} color={fg} /> : null}
      <Text style={{ color: fg, fontSize: 11.5, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}
