import { RefreshControl, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";

import { BudgetCard } from "../../src/components/BudgetCard";
import { Button } from "../../src/components/Button";
import { SectionTitle } from "../../src/components/Card";
import { EmptyState } from "../../src/components/EmptyState";
import { Screen } from "../../src/components/Screen";
import { ScreenSkeleton } from "../../src/components/Skeleton";
import { useBudgets } from "../../src/features/budgets/queries";
import { useSettings } from "../../src/features/settings/queries";
import { useTheme } from "../../src/theme/tokens";

export default function BudgetsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data, isPending, isError, error, refetch, isRefetching } = useBudgets();
  // Budgets are kept in the base currency.
  const { data: settings } = useSettings();

  if (isPending) {
    return (
      <Screen scroll={false}>
        <ScreenSkeleton />
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

  const currency = settings?.preferences.baseCurrency;
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
      {overall ? <BudgetCard budget={overall} title="Everything" currency={currency} prominent /> : null}

      {categories.length > 0 ? (
        <View style={{ gap: 12 }}>
          <SectionTitle>By category</SectionTitle>
          {categories.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              currency={currency}
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
