import { useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { Pressable, View } from "react-native";

import { useGenerateRecurring } from "../../src/features/recurring/queries";
import { useTheme } from "../../src/theme/tokens";

/**
 * Five slots is the practical maximum for a phone tab bar, so the seven
 * areas in the product brief collapse to: Home, Transactions, Add,
 * Analytics, More. Savings, Budgets, Accounts and Settings live under More.
 *
 * The centre slot is a prominent quick-add action rather than a tab — adding
 * a transaction is the single most frequent thing a user does here.
 */
export default function TabsLayout() {
  const theme = useTheme();
  const router = useRouter();

  // Materialise anything that fell due while the app was closed. Runs once
  // per launch; the server is idempotent, so a repeat is harmless (D-22).
  const generate = useGenerateRecurring();
  const hasGenerated = useRef(false);
  useEffect(() => {
    if (hasGenerated.current) return;
    hasGenerated.current = true;
    generate.mutate();
  }, [generate]);

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerShadowVisible: false,
        tabBarActiveTintColor: theme.brand,
        tabBarInactiveTintColor: theme.textSubtle,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        sceneStyle: { backgroundColor: theme.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="transactions"
        options={{
          title: "Activity",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="swap-vertical-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="add"
        options={{
          title: "",
          tabBarAccessibilityLabel: "Add a transaction",
          tabBarButton: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add a transaction"
              onPress={() => router.push("/transaction/new")}
              style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
              hitSlop={8}
            >
              <View
                style={{
                  width: 52,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: theme.brand,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="add" size={26} color={theme.onBrand} />
              </View>
            </Pressable>
          ),
        }}
      />

      <Tabs.Screen
        name="analytics"
        options={{
          title: "Insights",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipsis-horizontal" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
