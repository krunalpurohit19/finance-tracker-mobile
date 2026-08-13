import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { money } from "@finance/domain";

import { Amount } from "../../src/components/Amount";
import { Button } from "../../src/components/Button";
import { EmptyState } from "../../src/components/EmptyState";
import { Screen } from "../../src/components/Screen";
import { useBudgets, type BudgetProgress } from "../../src/features/budgets/queries";
import { useTheme, type Theme } from "../../src/theme/tokens";

/**
 * Status is carried by an icon and a word as well as a colour, so an
 * over-budget category is legible in greyscale and to colourblind readers.
 */
function statusPresentation(status: BudgetProgress["status"], theme: Theme) {
  switch (status) {
    case "EXCEEDED":
      return { color: theme.expense, icon: "alert-circle" as const, label: "Over budget" };
    case "NEAR_LIMIT":
      return { color: theme.warning, icon: "warning-outline" as const, label: "Near limit" };
    default:
      return {
        color: theme.income,
        icon: "checkmark-circle-outline" as const,
        label: "On track",
      };
  }
}

export default function BudgetsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data, isPending, isError, error, refetch, isRefetching } = useBudgets();

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
          title="Couldn't load your budgets"
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
          icon="pie-chart-outline"
          title="No budgets yet"
          body="Set a monthly limit for a category, or one overall limit for everything. Spending counts toward it automatically — transfers between your own accounts never do."
          actionLabel="Set a budget"
          onAction={() => router.push("/budgets/new")}
        />
      </Screen>
    );
  }

  const overall = data.find((b) => b.categoryId == null);
  const categories = data.filter((b) => b.categoryId !== null);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          tintColor={theme.brand}
        />
      }
    >
      {overall ? <BudgetRow budget={overall} title="Everything" prominent /> : null}

      {categories.length > 0 ? (
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
            By category
          </Text>
          {categories.map((budget) => (
            <BudgetRow
              key={budget.id}
              budget={budget}
              title={budget.categoryName ?? "Category"}
            />
          ))}
        </View>
      ) : null}

      <Button
        label="Set another budget"
        variant="secondary"
        onPress={() => router.push("/budgets/new")}
      />
    </ScrollView>
  );
}

function BudgetRow({
  budget,
  title,
  prominent = false,
}: {
  budget: BudgetProgress;
  title: string;
  prominent?: boolean;
}) {
  const theme = useTheme();
  const presentation = statusPresentation(budget.status, theme);

  const percent = budget.percentUsed ?? 0;
  const overspent = budget.status === "EXCEEDED";
  const remaining = money(budget.remaining);

  return (
    <View
      style={{
        backgroundColor: theme.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: overspent ? presentation.color : theme.border,
        padding: 16,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text
          style={{
            color: theme.text,
            fontSize: prominent ? 17 : 15,
            fontWeight: "600",
            flex: 1,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Ionicons name={presentation.icon} size={16} color={presentation.color} />
        <Text style={{ color: presentation.color, fontSize: 12, fontWeight: "700" }}>
          {presentation.label}
        </Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
        <Amount value={money(budget.spent)} size={prominent ? "lg" : "md"} tone="neutral" />
        <Text style={{ color: theme.textSubtle, fontSize: 14 }}>of {money(budget.amount)}</Text>
      </View>

      <View style={{ height: 8, borderRadius: 4, backgroundColor: theme.surfaceElevated }}>
        <View
          style={{
            height: 8,
            borderRadius: 4,
            width: `${Math.max(2, Math.min(100, percent))}%`,
            backgroundColor: presentation.color,
          }}
        />
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
        <Text style={{ color: theme.textMuted, fontSize: 13 }}>
          {/* Words, not just a bar: "₹600 left" or "₹1,200 over". */}
          {overspent ? <>{money(remaining).replace("-", "")} over</> : <>{remaining} left</>}
        </Text>
        <Text style={{ color: theme.textSubtle, fontSize: 13, fontVariant: ["tabular-nums"] }}>
          {percent.toFixed(0)}% used
        </Text>
      </View>
    </View>
  );
}
