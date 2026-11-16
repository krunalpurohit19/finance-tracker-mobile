import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../theme/tokens";

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

const ICONS: Record<string, [idle: keyof typeof Ionicons.glyphMap, active: keyof typeof Ionicons.glyphMap]> = {
  index: ["home-outline", "home"],
  transactions: ["swap-vertical-outline", "swap-vertical"],
  analytics: ["bar-chart-outline", "bar-chart"],
  more: ["ellipsis-horizontal", "ellipsis-horizontal"],
};

/**
 * A quiet tab bar with one loud element: the floating add button. Tabs keep
 * their labels — "Insights" and "More" are hard to guess from an icon.
 *
 * The route named `addRoute` is not a tab: its slot holds the 52pt "+".
 */
export function TabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
  onAdd,
  addRoute = "add",
}: TabBarProps & { onAdd: () => void; addRoute?: string }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: theme.surface,
        borderTopWidth: 1,
        borderTopColor: theme.scheme === "dark" ? theme.border : theme.fill,
        paddingTop: 6,
        paddingBottom: Math.max(insets.bottom, 8),
      }}
    >
      {state.routes.map((route, index) => {
        if (route.name === addRoute) {
          return (
            <View key={route.key} style={{ flex: 1, alignItems: "center" }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add a transaction"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  onAdd();
                }}
                hitSlop={6}
                style={({ pressed }) => ({
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  // Floats above the bar's top edge.
                  marginTop: -24,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: theme.fab,
                  opacity: pressed ? 0.85 : 1,
                  shadowColor: "#000",
                  shadowOpacity: 0.18,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 6,
                })}
              >
                <Ionicons name="add" size={28} color={theme.onFab} />
              </Pressable>
            </View>
          );
        }

        const focused = state.index === index;
        const label = descriptors[route.key]?.options.title ?? route.name;
        const icons = ICONS[route.name] ?? ["ellipse-outline", "ellipse"];
        const color = focused ? theme.text : theme.textSubtle;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            onPress={() => {
              const event = emitter.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigateToTab(route.key);
            }}
            style={{ flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", gap: 3 }}
          >
            <Ionicons name={focused ? icons[1] : icons[0]} size={22} color={color} />
            <Text
              numberOfLines={1}
              // Labels must not push the bar apart at the largest system font.
              maxFontSizeMultiplier={1.3}
              style={{ color, fontSize: 11, fontWeight: focused ? "700" : "500" }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
