import { Pressable, Text, View } from "react-native";

import { useTheme } from "../theme/tokens";

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={label}
      style={{ flexDirection: "row", backgroundColor: theme.fill, borderRadius: 14, padding: 3 }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={{
              flex: 1,
              minHeight: 44,
              paddingHorizontal: 4,
              borderRadius: 11,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: selected ? theme.surface : "transparent",
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                color: selected ? theme.text : theme.textMuted,
                fontSize: 13.5,
                fontWeight: selected ? "600" : "500",
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
