import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { money } from "@finance/domain";

import { Amount } from "../../src/components/Amount";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { EmptyState } from "../../src/components/EmptyState";
import { Screen } from "../../src/components/Screen";
import { useGoals, useSavings, type Goal } from "../../src/features/savings/queries";
import { useTheme } from "../../src/theme/tokens";

function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function SavingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const savings = useSavings();
  const goals = useGoals();

  if (savings.isPending || goals.isPending) {
    return (
      <Screen scroll={false}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={theme.brand} />
        </View>
      </Screen>
    );
  }

  if (savings.isError) {
    return (
      <Screen>
        <EmptyState
          icon="cloud-offline-outline"
          title="Couldn't load your savings"
          body={
            savings.error instanceof Error ? savings.error.message : "Something went wrong."
          }
          actionLabel="Try again"
          onAction={() => void savings.refetch()}
        />
      </Screen>
    );
  }

  const data = savings.data;
  const currency = data.baseCurrency;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}
      refreshControl={
        <RefreshControl
          refreshing={savings.isRefetching}
          onRefresh={() => void savings.refetch()}
          tintColor={theme.brand}
        />
      }
    >
      <View style={{ gap: 4 }}>
        <Text style={{ color: theme.textSubtle, fontSize: 13, fontWeight: "600" }}>
          Saved over your lifetime
        </Text>
        <Amount value={money(data.lifetime)} currency={currency} size="xl" />
        <Text style={{ color: theme.textMuted, fontSize: 13 }}>
          Everything you&apos;ve earned, less everything you&apos;ve spent. Money you already
          had when you started isn&apos;t counted here.
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Card eyebrow="This month">
            <Amount value={money(data.thisMonth)} currency={currency} size="md" />
            <Text style={{ color: theme.textSubtle, fontSize: 12 }}>
              {data.thisMonthRate === null
                ? "— rate"
                : `${data.thisMonthRate.toFixed(0)}% rate`}
            </Text>
          </Card>
        </View>
        <View style={{ flex: 1 }}>
          <Card eyebrow="Monthly average">
            {data.averageMonthly ? (
              <Amount value={money(data.averageMonthly)} currency={currency} size="md" />
            ) : (
              <Text style={{ color: theme.textSubtle, fontSize: 17, fontWeight: "600" }}>
                —
              </Text>
            )}
            <Text style={{ color: theme.textSubtle, fontSize: 12 }}>since you started</Text>
          </Card>
        </View>
      </View>

      {data.best || data.worst ? (
        <Card title="Best and worst months">
          {data.best ? (
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
              <Text style={{ color: theme.textMuted, fontSize: 14 }}>
                Best · {monthLabel(data.best.month)}
              </Text>
              <Amount value={money(data.best.saved)} currency={currency} size="sm" />
            </View>
          ) : null}
          {data.worst ? (
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
              <Text style={{ color: theme.textMuted, fontSize: 14 }}>
                Worst · {monthLabel(data.worst.month)}
              </Text>
              <Amount value={money(data.worst.saved)} currency={currency} size="sm" />
            </View>
          ) : null}
        </Card>
      ) : null}

      <View style={{ gap: 12 }}>
        <Text
          style={{
            color: theme.textSubtle,
            fontSize: 12,
            fontWeight: "700",
            letterSpacing: 0.6,
            textTransform: "uppercase",
          }}
        >
          Goals
        </Text>

        {goals.data && goals.data.length > 0 ? (
          goals.data.map((goal) => <GoalCard key={goal.id} goal={goal} currency={currency} />)
        ) : (
          <EmptyState
            icon="flag-outline"
            title="No goals yet"
            body="Set a target — an emergency fund, a laptop, a trip — and track what you've set aside toward it. Contributions record intent; they don't move money on their own."
          />
        )}

        <Button
          label="Add a goal"
          variant={goals.data && goals.data.length > 0 ? "secondary" : "primary"}
          onPress={() => router.push("/savings/new")}
        />
      </View>
    </ScrollView>
  );
}

function GoalCard({ goal, currency }: { goal: Goal; currency: string }) {
  const theme = useTheme();
  const progress = goal.progress ?? 0;

  // Over-funding is reported honestly in the numbers; only the bar is clamped,
  // because a bar wider than its track has nowhere to go.
  const barWidth = Math.max(2, Math.min(100, progress));
  const barColor = goal.achieved ? theme.income : goal.overdue ? theme.warning : theme.brand;

  return (
    <View
      style={{
        backgroundColor: theme.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.border,
        padding: 16,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text
          style={{ color: theme.text, fontSize: 16, fontWeight: "600", flex: 1 }}
          numberOfLines={1}
        >
          {goal.name}
        </Text>
        {goal.achieved ? (
          <>
            <Ionicons name="checkmark-circle" size={16} color={theme.income} />
            <Text style={{ color: theme.income, fontSize: 12, fontWeight: "700" }}>
              Reached
            </Text>
          </>
        ) : goal.overdue ? (
          <>
            <Ionicons name="time-outline" size={16} color={theme.warning} />
            <Text style={{ color: theme.warning, fontSize: 12, fontWeight: "700" }}>
              Past due
            </Text>
          </>
        ) : null}
      </View>

      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
        <Amount value={money(goal.saved)} currency={currency} size="md" tone="neutral" />
        <Text style={{ color: theme.textSubtle, fontSize: 14 }}>
          of {money(goal.targetAmount)}
        </Text>
      </View>

      <View style={{ height: 8, borderRadius: 4, backgroundColor: theme.surfaceElevated }}>
        <View
          style={{
            height: 8,
            borderRadius: 4,
            width: `${barWidth}%`,
            backgroundColor: barColor,
          }}
        />
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
        <Text style={{ color: theme.textMuted, fontSize: 13 }}>
          {goal.achieved ? "Target reached" : `${money(goal.remaining)} to go`}
        </Text>
        <Text style={{ color: theme.textSubtle, fontSize: 13, fontVariant: ["tabular-nums"] }}>
          {progress.toFixed(0)}%
        </Text>
      </View>

      {goal.requiredMonthly && !goal.achieved ? (
        <Text style={{ color: theme.textSubtle, fontSize: 13 }}>
          {goal.overdue
            ? `Needs ${money(goal.requiredMonthly)} to finish`
            : `Set aside ${money(goal.requiredMonthly)} a month to hit ${goal.targetDate}`}
        </Text>
      ) : null}
    </View>
  );
}
