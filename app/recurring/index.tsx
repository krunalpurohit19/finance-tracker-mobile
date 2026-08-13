import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { money, negate } from "@finance/domain";

import { Amount } from "../../src/components/Amount";
import { EmptyState } from "../../src/components/EmptyState";
import { Screen } from "../../src/components/Screen";
import {
  useRecurring,
  useToggleRecurring,
  type RecurringRule,
} from "../../src/features/recurring/queries";
import { useTheme } from "../../src/theme/tokens";

function cadence(rule: RecurringRule): string {
  const unit =
    rule.frequency === "DAILY"
      ? "day"
      : rule.frequency === "WEEKLY"
        ? "week"
        : rule.frequency === "MONTHLY"
          ? "month"
          : "year";
  return rule.interval === 1 ? `Every ${unit}` : `Every ${rule.interval} ${unit}s`;
}

export default function RecurringScreen() {
  const theme = useTheme();
  const { data, isPending, isError, error, refetch, isRefetching } = useRecurring();
  const toggle = useToggleRecurring();

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
          title="Couldn't load your recurring items"
          body={error instanceof Error ? error.message : "Something went wrong."}
          actionLabel="Try again"
          onAction={() => void refetch()}
        />
      </Screen>
    );
  }

  if (data.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon="repeat-outline"
          title="Nothing recurring yet"
          body="Salary, rent, subscriptions — set them up once and they record themselves. They're added when you open the app, and never added twice."
        />
      </Screen>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 12 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          tintColor={theme.brand}
        />
      }
    >
      {data.map((rule) => {
        const isExpense = rule.type === "EXPENSE";
        const displayed = isExpense ? negate(money(rule.amount)) : money(rule.amount);

        return (
          <View
            key={rule.id}
            style={{
              backgroundColor: theme.surface,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: theme.border,
              padding: 16,
              gap: 8,
              opacity: rule.isActive ? 1 : 0.6,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ color: theme.text, fontSize: 16, fontWeight: "600" }}
                  numberOfLines={1}
                >
                  {rule.name}
                </Text>
                <Text style={{ color: theme.textSubtle, fontSize: 13 }}>
                  {cadence(rule)} · {rule.accountName}
                </Text>
              </View>
              <Amount
                value={displayed}
                currency={rule.currency}
                size="md"
                tone={rule.type === "TRANSFER" ? "neutral" : "auto"}
              />
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Ionicons
                name={rule.isActive ? "time-outline" : "pause-circle-outline"}
                size={15}
                color={theme.textSubtle}
              />
              <Text style={{ color: theme.textMuted, fontSize: 13, flex: 1 }}>
                {rule.isActive ? `Next on ${rule.nextOccurrence}` : "Paused"}
                {rule.endOn ? ` · ends ${rule.endOn}` : ""}
              </Text>

              <Pressable
                accessibilityRole="switch"
                accessibilityState={{ checked: rule.isActive }}
                accessibilityLabel={`${rule.isActive ? "Pause" : "Resume"} ${rule.name}`}
                onPress={() => toggle.mutate({ id: rule.id, isActive: !rule.isActive })}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: theme.border,
                  backgroundColor: theme.surfaceElevated,
                }}
              >
                <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: "600" }}>
                  {rule.isActive ? "Pause" : "Resume"}
                </Text>
              </Pressable>
            </View>
          </View>
        );
      })}

      <Text
        style={{
          color: theme.textSubtle,
          fontSize: 13,
          lineHeight: 19,
          textAlign: "center",
          paddingHorizontal: 12,
          paddingTop: 4,
        }}
      >
        These are added when you open the app. Opening it twice never records them twice.
      </Text>
    </ScrollView>
  );
}
