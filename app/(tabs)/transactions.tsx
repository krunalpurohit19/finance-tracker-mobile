import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { Card } from "../../src/components/Card";
import { ChipGroup } from "../../src/components/Chip";
import { EmptyState } from "../../src/components/EmptyState";
import { Screen } from "../../src/components/Screen";
import { ScreenSkeleton } from "../../src/components/Skeleton";
import { DayHeader, TransactionRow } from "../../src/components/TransactionRow";
import { useTransactions, type Transaction } from "../../src/features/transactions/queries";
import { useTheme } from "../../src/theme/tokens";

/** Group by day, so the list reads as a diary rather than a flat table. */
function groupByDate(items: Transaction[]) {
  const groups: { date: string; items: Transaction[] }[] = [];
  for (const item of items) {
    const last = groups.at(-1);
    if (last && last.date === item.occurredOn) last.items.push(item);
    else groups.push({ date: item.occurredOn, items: [item] });
  }
  return groups;
}

const FILTERS = [
  { value: "ALL", label: "All" },
  { value: "EXPENSE", label: "Spending" },
  { value: "INCOME", label: "Income" },
  { value: "TRANSFER", label: "Transfers" },
] as const;
type Filter = (typeof FILTERS)[number]["value"];

export default function TransactionsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data, isPending, isError, error, refetch, isRefetching, fetchNextPage, hasNextPage } =
    useTransactions();

  const [filter, setFilter] = useState<Filter>("ALL");

  const items = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);
  // Filters what has been loaded; scrolling on keeps loading more to filter.
  const groups = useMemo(
    () => groupByDate(filter === "ALL" ? items : items.filter((tx) => tx.type === filter)),
    [items, filter],
  );

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
          title="Couldn't load your activity"
          body={error instanceof Error ? error.message : "Something went wrong."}
          actionLabel="Try again"
          onAction={() => void refetch()}
        />
      </Screen>
    );
  }

  if (items.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon="receipt-outline"
          title="No activity yet"
          body="Every expense, income and transfer you record shows up here, newest first."
          actionLabel="Add a transaction"
          onAction={() => router.push("/transaction/new")}
        />
      </Screen>
    );
  }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 18 }}
      data={groups}
      keyExtractor={(group) => group.date}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => void refetch()}
          tintColor={theme.brand}
        />
      }
      onEndReached={() => {
        if (hasNextPage) void fetchNextPage();
      }}
      onEndReachedThreshold={0.5}
      ListHeaderComponent={
        <ChipGroup label="Show" options={FILTERS} value={filter} onChange={setFilter} />
      }
      ListEmptyComponent={
        <Text style={{ color: theme.textSubtle, fontSize: 14, textAlign: "center", paddingVertical: 24 }}>
          Nothing of this kind in what's loaded so far.
        </Text>
      }
      renderItem={({ item: group }) => (
        <View style={{ gap: 8 }}>
          <DayHeader date={group.date} />
          <Card style={{ paddingVertical: 8, gap: 0 }}>
            {group.items.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </Card>
        </View>
      )}
      ListFooterComponent={
        hasNextPage ? (
          <View style={{ paddingVertical: 16 }}>
            <ActivityIndicator color={theme.brand} />
          </View>
        ) : undefined
      }
    />
  );
}
