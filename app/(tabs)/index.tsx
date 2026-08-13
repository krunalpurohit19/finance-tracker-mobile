import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { money, negate } from "@finance/domain";

import { Amount } from "../../src/components/Amount";
import { Card } from "../../src/components/Card";
import { EmptyState } from "../../src/components/EmptyState";
import { Screen } from "../../src/components/Screen";
import {
  PERIOD_OPTIONS,
  useDashboard,
  type Dashboard,
  type PeriodPreset,
} from "../../src/features/dashboard/queries";
import { useTheme } from "../../src/theme/tokens";

export default function DashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [preset, setPreset] = useState<PeriodPreset>("this-month");
  const { data, isPending, isError, error, refetch, isRefetching } = useDashboard(preset);

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
          title="Couldn't load your dashboard"
          body={error instanceof Error ? error.message : "Something went wrong."}
          actionLabel="Try again"
          onAction={() => void refetch()}
        />
      </Screen>
    );
  }

  const currency = data.baseCurrency;
  const hasActivity =
    data.recentTransactions.length > 0 ||
    Number(data.income) !== 0 ||
    Number(data.expenses) !== 0;

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
      <PeriodFilter selected={preset} onSelect={setPreset} />

      <View style={{ gap: 4 }}>
        <Text style={{ color: theme.textSubtle, fontSize: 13, fontWeight: "600" }}>
          Total balance
        </Text>
        <Amount value={money(data.totalBalance)} currency={currency} size="xl" tone="neutral" />
        <Text style={{ color: theme.textMuted, fontSize: 13 }}>Across all accounts</Text>
      </View>

      {data.unconvertedAccounts.length > 0 ? <UnconvertedNotice data={data} /> : null}

      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Card eyebrow="Earned">
            <Amount value={money(data.income)} currency={currency} size="md" tone="income" />
          </Card>
        </View>
        <View style={{ flex: 1 }}>
          <Card eyebrow="Spent">
            <Amount value={money(data.expenses)} currency={currency} size="md" tone="expense" />
          </Card>
        </View>
      </View>

      <Card eyebrow="Saved this period">
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10 }}>
          <Amount value={money(data.savings)} currency={currency} size="lg" />
          <Text style={{ color: theme.textSubtle, fontSize: 14, fontWeight: "600" }}>
            {/* null means undefined, not zero — never render "0%" here. */}
            {data.savingsRate == null ? "—" : `${data.savingsRate.toFixed(0)}%`} rate
          </Text>
        </View>
        {data.savingsRate == null ? (
          <Text style={{ color: theme.textMuted, fontSize: 13, lineHeight: 19 }}>
            Your savings rate needs some income to measure against, so it stays undefined until
            you record some.
          </Text>
        ) : null}
      </Card>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Net worth ${data.netWorth}. Opens the net worth breakdown.`}
          onPress={() => router.push("/net-worth")}
          style={{ flex: 1 }}
        >
          <Card eyebrow="Net worth">
            <Amount value={money(data.netWorth)} currency={currency} size="md" tone="neutral" />
            {Number(data.liabilities) !== 0 ? (
              <Text style={{ color: theme.textSubtle, fontSize: 12 }}>
                after {money(data.liabilities).replace("-", "")} owed
              </Text>
            ) : null}
          </Card>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Card eyebrow="Lifetime saved">
            <Amount
              value={money(data.lifetimeSavings)}
              currency={currency}
              size="md"
              tone="neutral"
            />
          </Card>
        </View>
      </View>

      {data.spendingByCategory.length > 0 ? (
        <Card title="Where it went">
          {data.spendingByCategory.slice(0, 6).map((row) => (
            <View key={row.categoryId ?? "none"} style={{ gap: 5, paddingVertical: 4 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                <Text style={{ color: theme.text, fontSize: 14 }} numberOfLines={1}>
                  {row.categoryName}
                </Text>
                <View style={{ flexDirection: "row", gap: 8, alignItems: "baseline" }}>
                  <Text
                    style={{
                      color: theme.textSubtle,
                      fontSize: 12,
                      fontVariant: ["tabular-nums"],
                    }}
                  >
                    {row.share.toFixed(0)}%
                  </Text>
                  <Amount
                    value={money(row.total)}
                    currency={currency}
                    size="sm"
                    tone="neutral"
                  />
                </View>
              </View>
              {/* The bar repeats the percentage already shown as text, so it
                  never becomes the only way to read the value. */}
              <View
                style={{ height: 6, borderRadius: 3, backgroundColor: theme.surfaceElevated }}
              >
                <View
                  style={{
                    height: 6,
                    borderRadius: 3,
                    width: `${Math.max(2, Math.min(100, row.share))}%`,
                    backgroundColor: row.color ?? theme.brand,
                  }}
                />
              </View>
            </View>
          ))}
        </Card>
      ) : null}

      {data.recentTransactions.length > 0 ? (
        <Card title="Recent activity">
          {data.recentTransactions.map((tx) => {
            const isExpense = tx.type === "EXPENSE";
            const displayed = isExpense ? negate(money(tx.amount)) : money(tx.amount);
            return (
              <View
                key={tx.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  paddingVertical: 5,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontSize: 14 }} numberOfLines={1}>
                    {tx.merchant ?? tx.categoryName ?? tx.accountName}
                  </Text>
                  <Text style={{ color: theme.textSubtle, fontSize: 12 }}>{tx.occurredOn}</Text>
                </View>
                <Amount
                  value={displayed}
                  currency={tx.currency}
                  size="sm"
                  tone={tx.type === "TRANSFER" ? "neutral" : "auto"}
                />
              </View>
            );
          })}
        </Card>
      ) : null}

      {!hasActivity ? (
        <EmptyState
          icon="sparkles-outline"
          title="Nothing recorded yet"
          body="Add your first transaction and this screen fills in. Every figure here is calculated from your ledger — nothing is estimated."
          actionLabel="Add a transaction"
          onAction={() => router.push("/transaction/new")}
        />
      ) : null}
    </ScrollView>
  );
}

function PeriodFilter({
  selected,
  onSelect,
}: {
  selected: PeriodPreset;
  onSelect: (value: PeriodPreset) => void;
}) {
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}
    >
      {PERIOD_OPTIONS.map((option) => {
        const active = option.value === selected;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(option.value)}
            style={{
              paddingHorizontal: 13,
              paddingVertical: 7,
              borderRadius: 999,
              backgroundColor: active ? theme.brand : theme.surface,
              borderWidth: 1,
              borderColor: active ? theme.brand : theme.border,
            }}
          >
            <Text
              style={{
                color: active ? theme.onBrand : theme.textMuted,
                fontWeight: "600",
                fontSize: 13,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/**
 * Missing exchange rates understate every converted total, so this says so
 * plainly rather than letting the user read a wrong number as a right one.
 */
function UnconvertedNotice({ data }: { data: Dashboard }) {
  const theme = useTheme();
  const names = data.unconvertedAccounts.map((a) => `${a.name} (${a.currency})`).join(", ");

  return (
    <View
      style={{
        flexDirection: "row",
        gap: 10,
        padding: 12,
        borderRadius: 12,
        backgroundColor: theme.surface,
        borderWidth: 1,
        borderColor: theme.warning,
      }}
    >
      <Ionicons name="alert-circle-outline" size={19} color={theme.warning} />
      <Text style={{ color: theme.textMuted, fontSize: 13, lineHeight: 19, flex: 1 }}>
        Not included in these totals: {names}. Add an exchange rate to {data.baseCurrency} to
        count it.
      </Text>
    </View>
  );
}
