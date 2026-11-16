import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { money } from "@finance/domain";

import { Amount, useMoneyText } from "../../src/components/Amount";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { EmptyState } from "../../src/components/EmptyState";
import { Screen } from "../../src/components/Screen";
import { StatusPill } from "../../src/components/StatusPill";
import { GoalRing } from "../../src/components/charts/GoalRing";
import { ScreenSkeleton } from "../../src/components/Skeleton";
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
        <ScreenSkeleton />
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
        <Amount value={money(data.lifetime)} currency={currency} size="hero" />
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
              {data.thisMonthRate == null
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
            fontSize: 12.5,
            fontWeight: "600",
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
  const moneyText = useMoneyText();
  const ringColor = goal.achieved ? theme.income : goal.overdue ? theme.warning : theme.brand;

  return (
    <View style={[theme.card, { padding: 16, gap: 12 }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        {/* Over-funding is reported honestly in the numbers; only the ring is clamped. */}
        <GoalRing progress={goal.progress} color={ringColor} />
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: "600", flex: 1 }} numberOfLines={1}>
              {goal.name}
            </Text>
            {goal.achieved ? (
              <StatusPill label="Reached" tone="good" icon="checkmark-circle" />
            ) : goal.overdue ? (
              <StatusPill label="Past due" tone="warn" icon="time" />
            ) : null}
          </View>
          <View style={{ flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", columnGap: 6 }}>
            <Amount value={money(goal.saved)} currency={currency} size="md" tone="neutral" />
            <Text style={{ color: theme.textSubtle, fontSize: 13 }}>
              of {moneyText(money(goal.targetAmount), currency)}
            </Text>
          </View>
        </View>
      </View>

      <Text style={{ color: theme.textMuted, fontSize: 13, lineHeight: 19 }}>
        {goal.achieved
          ? "Target reached."
          : `${moneyText(money(goal.remaining), currency)} to go.`}
        {goal.requiredMonthly && !goal.achieved
          ? goal.overdue
            ? ` Needs ${moneyText(money(goal.requiredMonthly), currency)} to finish.`
            : ` Set aside ${moneyText(money(goal.requiredMonthly), currency)} a month to hit ${goal.targetDate}.`
          : ""}
      </Text>
    </View>
  );
}
