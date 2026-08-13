import type { ReactNode } from "react";
import { ScrollView, View, KeyboardAvoidingView, Platform } from "react-native";

import { useTheme } from "../theme/tokens";

interface ScreenProps {
  children: ReactNode;
  /** Set false for screens that manage their own scrolling (e.g. a list). */
  scroll?: boolean;
  /** Pinned bottom content, typically used for primary call-to-action buttons. */
  footer?: ReactNode;
}

export function Screen({ children, scroll = true, footer }: ScreenProps) {
  const theme = useTheme();

  const content = scroll ? (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={{ flex: 1, backgroundColor: theme.background }}>{children}</View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {content}
      {footer ? (
        <View style={{ padding: 16, paddingBottom: 32, backgroundColor: theme.background }}>
          {footer}
        </View>
      ) : null}
    </View>
  );
}
