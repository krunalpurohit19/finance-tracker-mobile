import { useEffect, useRef } from "react";
import { Tabs, useRouter } from "expo-router";

import { TabBar } from "../../src/components/TabBar";
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
      tabBar={(props) => <TabBar {...props} onAdd={() => router.push("/transaction/new")} />}
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerTitleStyle: { fontSize: 22, fontWeight: "600" },
        headerTitleAlign: "left",
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: theme.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          // Home draws its own greeting; a second "Home" title above it is noise.
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="transactions"
        options={{
          title: "Activity",
        }}
      />

      <Tabs.Screen
        name="add"
        options={{
          title: "Add",
        }}
      />

      <Tabs.Screen
        name="analytics"
        options={{
          title: "Insights",
        }}
      />

      <Tabs.Screen
        name="more"
        options={{
          title: "More",
        }}
      />
    </Tabs>
  );
}
