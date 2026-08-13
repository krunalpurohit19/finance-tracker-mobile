import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { Button } from "../../src/components/Button";
import { Screen } from "../../src/components/Screen";
import { signOut, useSession } from "../../src/lib/auth-client";
import { useTheme } from "../../src/theme/tokens";

interface Item {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint: string;
  href: "/accounts" | "/budgets" | "/savings" | "/recurring" | "/net-worth" | "/settings";
}

/** The areas that don't earn a permanent tab slot. */
const ITEMS: Item[] = [
  {
    icon: "wallet-outline",
    label: "Accounts",
    hint: "Where your money is held",
    href: "/accounts",
  },
  {
    icon: "pie-chart-outline",
    label: "Budgets",
    hint: "Monthly spending limits",
    href: "/budgets",
  },
  {
    icon: "trending-up-outline",
    label: "Savings",
    hint: "What you keep, and your goals",
    href: "/savings",
  },
  {
    icon: "repeat-outline",
    label: "Recurring",
    hint: "Salary, rent, subscriptions",
    href: "/recurring",
  },
  {
    icon: "stats-chart-outline",
    label: "Net worth",
    hint: "What you own, less what you owe",
    href: "/net-worth",
  },
  {
    icon: "settings-outline",
    label: "Settings",
    hint: "Profile, currency, appearance, data",
    href: "/settings",
  },
];

export default function MoreScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data: session } = useSession();
  const [signingOut, setSigningOut] = useState(false);

  async function onSignOut() {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
    router.replace("/(auth)/sign-in");
  }

  return (
    <Screen>
      {session?.user ? (
        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: theme.border,
            padding: 16,
            gap: 2,
          }}
        >
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: "600" }}>
            {session.user.name ?? "Signed in"}
          </Text>
          <Text style={{ color: theme.textSubtle, fontSize: 13 }}>{session.user.email}</Text>
        </View>
      ) : null}

      <View
        style={{
          backgroundColor: theme.surface,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: theme.border,
          overflow: "hidden",
        }}
      >
        {ITEMS.map((item, index) => (
          <Pressable
            key={item.label}
            accessibilityRole="button"
            accessibilityLabel={`${item.label}. ${item.hint}.`}
            onPress={() => router.push(item.href)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderTopWidth: index === 0 ? 0 : 1,
              borderTopColor: theme.border,
            }}
          >
            <Ionicons name={item.icon} size={21} color={theme.textMuted} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontSize: 15, fontWeight: "600" }}>
                {item.label}
              </Text>
              <Text style={{ color: theme.textSubtle, fontSize: 13 }}>{item.hint}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSubtle} />
          </Pressable>
        ))}
      </View>

      <Button label="Sign out" variant="secondary" onPress={onSignOut} loading={signingOut} />
    </Screen>
  );
}
