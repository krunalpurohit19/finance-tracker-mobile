import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../theme/tokens";

let show: ((message: string) => void) | null = null;

/** Confirm something that just happened ("Transaction saved"). */
export function showToast(message: string) {
  AccessibilityInfo.announceForAccessibility(message);
  show?.(message);
}

/** Mounted once, in the root layout. */
export function ToastHost() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    show = (next) => {
      clearTimeout(timer);
      setMessage(next);
      void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
        Animated.timing(opacity, {
          toValue: 1,
          duration: reduced ? 0 : 160,
          useNativeDriver: true,
        }).start();
      });
      timer = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }).start(
          () => setMessage(null),
        );
      }, 2400);
    };
    return () => {
      show = null;
      clearTimeout(timer);
    };
  }, [opacity]);

  if (!message) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: insets.bottom + 96,
        alignItems: "center",
        opacity,
      }}
    >
      <Text
        style={{
          backgroundColor: theme.fab,
          color: theme.onFab,
          fontSize: 14,
          fontWeight: "600",
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        {message}
      </Text>
    </Animated.View>
  );
}
