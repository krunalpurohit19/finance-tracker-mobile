import { View } from "react-native";

import { useTheme } from "../theme/tokens";

/**
 * A track and a fill. Decorative: callers always print the value as text next
 * to it, so it is hidden from screen readers.
 */
export function ProgressBar({ percent, color }: { percent: number; color?: string }) {
  const theme = useTheme();
  // A non-zero value always shows a sliver; overshoot is clamped to the track.
  const width = percent <= 0 ? 0 : Math.max(2, Math.min(100, percent));
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={{ height: 8, borderRadius: 999, backgroundColor: theme.fill, overflow: "hidden" }}
    >
      <View
        style={{
          height: 8,
          borderRadius: 999,
          width: `${width}%`,
          backgroundColor: color ?? theme.brand,
        }}
      />
    </View>
  );
}
