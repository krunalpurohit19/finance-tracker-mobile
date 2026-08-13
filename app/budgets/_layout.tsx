import { Stack } from "expo-router";

import { useTheme } from "../../src/theme/tokens";

export default function BudgetsLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Budgets" }} />
      <Stack.Screen name="new" options={{ title: "New budget", presentation: "modal" }} />
    </Stack>
  );
}
