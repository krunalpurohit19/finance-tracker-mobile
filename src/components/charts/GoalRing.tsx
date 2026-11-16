import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { useTheme } from "../../theme/tokens";

/** Progress toward a goal as a ring, with the percentage printed inside it. */
export function GoalRing({
  progress,
  color,
  size = 64,
}: {
  /** 0–100; null when there is no target to measure against. Overshoot is clamped on the ring only. */
  progress: number | null;
  color?: string;
  size?: number;
}) {
  const theme = useTheme();
  const stroke = 7;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const filled = (Math.max(0, Math.min(100, progress ?? 0)) / 100) * circumference;

  return (
    <View
      accessible
      accessibilityLabel={progress == null ? "No progress yet" : `${progress.toFixed(0)} percent`}
      style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}
    >
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={theme.fill} strokeWidth={stroke} fill="none" />
        {filled > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color ?? theme.brand}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference}`}
            fill="none"
            // Start at twelve o'clock.
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </Svg>
      <Text
        maxFontSizeMultiplier={1.2}
        style={{ color: theme.text, fontSize: 13, fontWeight: "600", fontVariant: ["tabular-nums"] }}
      >
        {progress == null ? "—" : `${progress.toFixed(0)}%`}
      </Text>
    </View>
  );
}
