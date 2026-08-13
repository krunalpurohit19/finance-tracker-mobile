import type { ReactNode } from "react";
import { Text, View } from "react-native";

import { useTheme } from "../theme/tokens";

interface CardProps {
  children: ReactNode;
  title?: string;
  /** Small uppercase label above the title, e.g. "This month". */
  eyebrow?: string;
}

export function Card({ children, title, eyebrow }: CardProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        backgroundColor: theme.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.border,
        padding: 16,
        gap: 10,
      }}
    >
      {eyebrow ? (
        <Text
          style={{
            color: theme.textSubtle,
            fontSize: 11,
            fontWeight: "700",
            letterSpacing: 0.8,
            textTransform: "uppercase",
          }}
        >
          {eyebrow}
        </Text>
      ) : null}

      {title ? (
        <Text style={{ color: theme.text, fontSize: 16, fontWeight: "600" }}>{title}</Text>
      ) : null}

      {children}
    </View>
  );
}
