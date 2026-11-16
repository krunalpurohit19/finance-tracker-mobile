import { useEffect, useRef } from "react";
import { AccessibilityInfo, Animated, View, type DimensionValue } from "react-native";

import { useTheme } from "../theme/tokens";

/** A placeholder block. Pulses gently unless the user asked for reduced motion. */
export function Skeleton({
  height,
  width = "100%",
  radius = 14,
}: {
  height: number;
  width?: DimensionValue;
  radius?: number;
}) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (reduced || cancelled) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        ]),
      );
      loop.start();
    });
    return () => {
      cancelled = true;
      loop?.stop();
    };
  }, [opacity]);

  return (
    <Animated.View
      style={{ height, width, borderRadius: radius, backgroundColor: theme.fill, opacity }}
    />
  );
}

/** The loading state of a card-based screen: a hero block and a few cards. */
export function ScreenSkeleton() {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      style={{ padding: 16, gap: 16 }}
    >
      <Skeleton height={14} width={110} radius={7} />
      <Skeleton height={42} width={220} radius={10} />
      <Skeleton height={96} radius={20} />
      <Skeleton height={140} radius={20} />
      <Skeleton height={140} radius={20} />
    </View>
  );
}
