import { Pressable, ScrollView, Text } from "react-native";

import { useTheme } from "../theme/tokens";

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      // 36pt pill + 4pt slop each side = a 44pt target without a taller row.
      hitSlop={{ top: 4, bottom: 4 }}
      style={[
        selected ? null : theme.card,
        {
          minHeight: 36,
          paddingHorizontal: 14,
          borderRadius: 999,
          alignItems: "center",
          justifyContent: "center",
        },
        selected ? { backgroundColor: theme.brand } : null,
      ]}
    >
      <Text
        style={{
          color: selected ? theme.onBrand : theme.textMuted,
          fontWeight: selected ? "600" : "500",
          fontSize: 13.5,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** A single-choice row of pills that scrolls off the edge. */
export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  /** Read by screen readers as the group's name. */
  label: string;
}) {
  return (
    <ScrollView
      horizontal
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      showsHorizontalScrollIndicator={false}
      // Negative margin lets the shelf run to the screen edge; padding keeps
      // the first chip on the grid and leaves room for the card shadow.
      style={{ marginHorizontal: -16 }}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 6 }}
      keyboardShouldPersistTaps="handled"
    >
      {options.map((option) => (
        <Chip
          key={option.value}
          label={option.label}
          selected={option.value === value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </ScrollView>
  );
}
