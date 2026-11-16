import type { ReactNode } from "react";
import { Text, View, type ViewStyle } from "react-native";

import { type as typeScale, useTheme } from "../theme/tokens";

interface CardProps {
  children: ReactNode;
  title?: string;
  /** Small quiet label above the title, e.g. "This month". */
  eyebrow?: string;
  style?: ViewStyle;
}

/** Soft white surface, radius 20, no border in light mode (see theme.card). */
export function Card({ children, title, eyebrow, style }: CardProps) {
  const theme = useTheme();

  return (
    <View style={[theme.card, { padding: 16, gap: 10 }, style]}>
      {eyebrow ? (
        <Text style={[typeScale.label, { color: theme.textSubtle }]}>{eyebrow}</Text>
      ) : null}

      {title ? (
        <Text style={{ color: theme.text, fontSize: 16, fontWeight: "600" }}>{title}</Text>
      ) : null}

      {children}
    </View>
  );
}

/** A section heading above a group of cards or a shelf. */
export function SectionTitle({ children, action }: { children: string; action?: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 16, fontWeight: "600" }}>
        {children}
      </Text>
      {action}
    </View>
  );
}
