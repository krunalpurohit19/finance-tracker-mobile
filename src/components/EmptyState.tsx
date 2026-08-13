import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "../theme/tokens";

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Every screen gets a deliberate empty state rather than a blank area —
 * an empty finance app is the normal first-run experience, not an error.
 */
export function EmptyState({ icon, title, body, actionLabel, onAction }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={{ alignItems: "center", paddingVertical: 48, paddingHorizontal: 24, gap: 12 }}>
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.surfaceElevated,
          borderWidth: 1,
          borderColor: theme.border,
        }}
      >
        <Ionicons name={icon} size={26} color={theme.textSubtle} />
      </View>

      <Text style={{ color: theme.text, fontSize: 17, fontWeight: "600", textAlign: "center" }}>
        {title}
      </Text>

      <Text
        style={{
          color: theme.textMuted,
          fontSize: 14,
          lineHeight: 20,
          textAlign: "center",
          maxWidth: 300,
        }}
      >
        {body}
      </Text>

      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={{
            marginTop: 8,
            paddingHorizontal: 18,
            paddingVertical: 11,
            borderRadius: 10,
            backgroundColor: theme.brand,
          }}
        >
          <Text style={{ color: theme.onBrand, fontWeight: "600", fontSize: 15 }}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
