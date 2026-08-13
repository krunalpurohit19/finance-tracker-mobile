import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { EmptyState } from "../../src/components/EmptyState";
import { Screen } from "../../src/components/Screen";
import { useSettings } from "../../src/features/settings/queries";
import { useTheme } from "../../src/theme/tokens";

interface Row {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  href: Href;
  /** Rendered in the warning colour with an icon, never colour alone. */
  destructive?: boolean;
}

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data, isPending, isError, error, refetch } = useSettings();

  if (isPending) {
    return (
      <Screen scroll={false}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={theme.brand} />
        </View>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <EmptyState
          icon="cloud-offline-outline"
          title="Couldn't load your settings"
          body={error instanceof Error ? error.message : "Something went wrong."}
          actionLabel="Try again"
          onAction={() => void refetch()}
        />
      </Screen>
    );
  }

  const sections: { title: string; rows: Row[] }[] = [
    {
      title: "Account",
      rows: [
        {
          icon: "person-outline",
          label: "Profile",
          value: data.profile.name ?? data.profile.email,
          href: "/settings/profile",
        },
      ],
    },
    {
      title: "Presentation",
      rows: [
        {
          icon: "color-palette-outline",
          label: "Appearance & format",
          value: `${data.preferences.theme.toLowerCase()} · ${data.preferences.dateFormat}`,
          href: "/settings/preferences",
        },
        {
          icon: "cash-outline",
          label: "Base currency",
          value: data.preferences.baseCurrency,
          href: "/settings/currency",
        },
      ],
    },
    {
      title: "Manage",
      rows: [
        {
          icon: "wallet-outline",
          label: "Accounts",
          value: String(data.counts.accounts),
          href: "/accounts",
        },
        {
          icon: "pricetag-outline",
          label: "Categories",
          value: String(data.counts.categories),
          href: "/categories",
        },
        {
          icon: "repeat-outline",
          label: "Recurring rules",
          value: String(data.counts.recurring),
          href: "/recurring",
        },
      ],
    },
    {
      title: "Data",
      rows: [
        {
          icon: "download-outline",
          label: "Export & import",
          value: `${data.counts.transactions} transactions`,
          href: "/settings/data",
        },
        {
          icon: "trash-outline",
          label: "Delete account",
          href: "/settings/danger",
          destructive: true,
        },
      ],
    },
  ];

  return (
    <Screen>
      {sections.map((section) => (
        <View key={section.title} style={{ gap: 8 }}>
          <Text
            style={{
              color: theme.textSubtle,
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 0.8,
              textTransform: "uppercase",
            }}
          >
            {section.title}
          </Text>

          <View
            style={{
              backgroundColor: theme.surface,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: theme.border,
              overflow: "hidden",
            }}
          >
            {section.rows.map((row, index) => (
              <Pressable
                key={row.label}
                accessibilityRole="button"
                accessibilityLabel={row.value ? `${row.label}, ${row.value}` : row.label}
                onPress={() => router.push(row.href)}
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
                <Ionicons
                  name={row.icon}
                  size={20}
                  color={row.destructive ? theme.expense : theme.textMuted}
                />
                <Text
                  style={{
                    color: row.destructive ? theme.expense : theme.text,
                    fontSize: 15,
                    fontWeight: "600",
                    flex: 1,
                  }}
                >
                  {row.label}
                </Text>
                {row.value ? (
                  <Text style={{ color: theme.textSubtle, fontSize: 13 }} numberOfLines={1}>
                    {row.value}
                  </Text>
                ) : null}
                <Ionicons name="chevron-forward" size={17} color={theme.textSubtle} />
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      <Text style={{ color: theme.textSubtle, fontSize: 12, lineHeight: 18 }}>
        Signed in as {data.profile.email}. Member since {data.profile.createdAt.slice(0, 10)}.
      </Text>
    </Screen>
  );
}
