import { Stack } from "expo-router";

import { useTheme } from "../../src/theme/tokens";

export default function AccountsLayout() {
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
      <Stack.Screen name="index" options={{ title: "Accounts" }} />
      <Stack.Screen name="new" options={{ title: "New account", presentation: "modal" }} />
      <Stack.Screen name="[id]" options={{ title: "Account" }} />
    </Stack>
  );
}
