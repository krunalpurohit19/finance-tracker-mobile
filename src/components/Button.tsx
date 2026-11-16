import { ActivityIndicator, Pressable, Text, View } from "react-native";
import * as Haptics from "expo-haptics";

import { useTheme } from "../theme/tokens";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  loading?: boolean;
  disabled?: boolean;
}

/**
 * Every important action needs loading and disabled states, so they live in
 * the button rather than being re-implemented per screen.
 */
export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
}: ButtonProps) {
  const theme = useTheme();
  const inactive = disabled || loading;
  const primary = variant === "primary";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      onPress={() => {
        // Haptics mark primary actions only; a failure to buzz is not an error.
        if (primary) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      disabled={inactive}
      style={({ pressed }) => ({
        minHeight: 50,
        paddingVertical: 13,
        paddingHorizontal: 16,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: primary ? theme.brand : theme.fill,
        opacity: inactive ? 0.5 : pressed ? 0.85 : 1,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {loading ? (
          <ActivityIndicator size="small" color={primary ? theme.onBrand : theme.text} />
        ) : null}
        <Text
          style={{
            color: primary ? theme.onBrand : theme.text,
            fontWeight: "600",
            fontSize: 16,
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
