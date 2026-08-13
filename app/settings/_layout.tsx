import { Stack } from "expo-router";

import { useTheme } from "../../src/theme/tokens";

export default function SettingsLayout() {
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
      <Stack.Screen name="index" options={{ title: "Settings" }} />
      <Stack.Screen name="profile" options={{ title: "Profile" }} />
      <Stack.Screen name="preferences" options={{ title: "Appearance & format" }} />
      <Stack.Screen name="currency" options={{ title: "Base currency" }} />
      <Stack.Screen name="data" options={{ title: "Your data" }} />
      <Stack.Screen name="danger" options={{ title: "Delete account" }} />
    </Stack>
  );
}
