import { Stack } from "expo-router";

import { useTheme } from "../../src/theme/tokens";

export default function CategoriesLayout() {
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
      <Stack.Screen name="index" options={{ title: "Categories" }} />
      <Stack.Screen
        name="new"
        options={{ presentation: "modal", title: "Add category" }}
      />
      <Stack.Screen
        name="[id]"
        options={{ presentation: "modal", title: "Edit category" }}
      />
    </Stack>
  );
}
