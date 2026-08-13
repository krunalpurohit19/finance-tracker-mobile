import "../global.css";

import { useEffect } from "react";
import { ActivityIndicator, View, useColorScheme } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useSession } from "../src/lib/auth-client";
import { useTheme } from "../src/theme/tokens";

/**
 * The auth gate.
 *
 * Redirects in an effect rather than rendering a <Redirect>, so navigation
 * only happens once the router has mounted and the session has actually
 * resolved — redirecting on an unresolved session would bounce a signed-in
 * user to the sign-in screen on every cold start.
 */
function useAuthGate(isPending: boolean, isSignedIn: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isPending) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isSignedIn && !inAuthGroup) {
      router.replace("/(auth)/sign-in");
    } else if (isSignedIn && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isPending, isSignedIn, segments, router]);
}

/**
 * One client for the app's lifetime. Financial data must not go stale
 * silently, so queries refetch on reconnect and when a screen regains focus,
 * but a short staleTime keeps rapid navigation from re-fetching constantly.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnReconnect: true,
    },
  },
});

export default function RootLayout() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const { data: session, isPending } = useSession();

  useAuthGate(isPending, Boolean(session));

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style={scheme === "dark" ? "light" : "dark"} />

          {isPending ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: theme.background,
              }}
            >
              <ActivityIndicator color={theme.brand} />
            </View>
          ) : (
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: theme.background },
                headerTintColor: theme.text,
                headerShadowVisible: false,
                contentStyle: { backgroundColor: theme.background },
              }}
            >
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="accounts" options={{ headerShown: false }} />
              <Stack.Screen name="budgets" options={{ headerShown: false }} />
              <Stack.Screen name="net-worth" options={{ headerShown: false }} />
              <Stack.Screen name="recurring" options={{ headerShown: false }} />
              <Stack.Screen name="savings" options={{ headerShown: false }} />
              <Stack.Screen name="settings" options={{ headerShown: false }} />
              <Stack.Screen
                name="transaction/new"
                options={{
                  // A full-screen sheet is the right shape for fast entry on a
                  // phone: it keeps the keyboard path short and is dismissable
                  // with a downward swipe.
                  presentation: "modal",
                  title: "Add transaction",
                }}
              />
            </Stack>
          )}
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
