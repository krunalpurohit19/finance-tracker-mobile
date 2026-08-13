import { useMemo } from "react";
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { money, negate } from "@finance/domain";

import { Amount } from "../../src/components/Amount";
import { EmptyState } from "../../src/components/EmptyState";
import { Screen } from "../../src/components/Screen";
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

function formatDay(date: string): string {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export default function TransactionsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data, isPending, isError, error, refetch, isRefetching, fetchNextPage, hasNextPage } =
    useTransactions();

  const items = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);
  const groups = useMemo(() => groupByDate(items), [items]);

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
      renderItem={({ item: group }) => (
        <View style={{ gap: 8 }}>
          <Text
            style={{
              color: theme.textSubtle,
              fontSize: 12,
              fontWeight: "700",
              letterSpacing: 0.6,
              textTransform: "uppercase",
            }}
          >
            {formatDay(group.date)}
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
            {group.items.map((tx, index) => (
              <Row key={tx.id} tx={tx} first={index === 0} />
            ))}
          </View>
        </View>
      )}
      ListFooterComponent={
        hasNextPage ? (
          <View style={{ paddingVertical: 16 }}>
            <ActivityIndicator color={theme.brand} />
          </View>
        ) : null
      }
    />
  );
}

function Row({ tx, first }: { tx: Transaction; first: boolean }) {
  const theme = useTheme();

  const isTransfer = tx.type === "TRANSFER";
  const isExpense = tx.type === "EXPENSE";

  // Expenses are shown negative so the sign carries the direction — the row
  // never depends on colour alone to say which way money moved.
  const displayed = isExpense ? negate(money(tx.amount)) : money(tx.amount);

  const title = tx.merchant ?? tx.categoryName ?? (isTransfer ? "Transfer" : tx.accountName);
  const subtitle = isTransfer
    ? `${tx.accountName} → ${tx.transferAccountName ?? ""}`
    : `${tx.categoryName ?? "Uncategorised"} · ${tx.accountName}`;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: theme.border,
      }}
    >
      <Ionicons
        name={isTransfer ? "swap-horizontal" : isExpense ? "arrow-up" : "arrow-down"}
        size={18}
        color={isTransfer ? theme.textMuted : isExpense ? theme.expense : theme.income}
      />

      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.text, fontSize: 15, fontWeight: "600" }} numberOfLines={1}>
          {title}
        </Text>
        <Text style={{ color: theme.textSubtle, fontSize: 13 }} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      <View style={{ alignItems: "flex-end" }}>
        <Amount
          value={displayed}
          currency={tx.currency}
          size="md"
          tone={isTransfer ? "neutral" : "auto"}
        />
        {tx.currency !== tx.baseCurrency ? (
          <Text style={{ color: theme.textSubtle, fontSize: 12 }}>
            ≈ {tx.baseAmount} {tx.baseCurrency}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
