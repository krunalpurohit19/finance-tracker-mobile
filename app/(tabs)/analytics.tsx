import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ZERO, compare, money, subtract, sum } from "@finance/domain";

import { Amount } from "../../src/components/Amount";
import { Card } from "../../src/components/Card";
import { ChipGroup } from "../../src/components/Chip";
import { EmptyState } from "../../src/components/EmptyState";
import { Screen } from "../../src/components/Screen";
import { SegmentedControl } from "../../src/components/SegmentedControl";
import { ScreenSkeleton } from "../../src/components/Skeleton";
import { CategoryRow } from "../../src/components/charts/CategoryRow";
import { IncomeExpenseBars } from "../../src/components/charts/IncomeExpenseBars";
import { NetWorthTrend } from "../../src/components/charts/NetWorthTrend";
import { SemiGauge } from "../../src/components/charts/SemiGauge";
import { useAnalytics, type Analytics } from "../../src/features/analytics/queries";
import { PERIOD_OPTIONS, type PeriodPreset } from "../../src/features/dashboard/queries";
import { useNetWorth } from "../../src/features/networth/queries";
import { useTheme } from "../../src/theme/tokens";

const VIEWS = [
  { value: "spending", label: "Spending" },
  { value: "cashflow", label: "Cash flow" },
  { value: "networth", label: "Net worth" },
] as const;
type ViewKey = (typeof VIEWS)[number]["value"];

/**
 * The five biggest categories, and everything else rolled into "Others", each
 * with its rank colour. Amounts are added with the money helpers; shares are
 * plain ratios.
 */
function rankCategories(rows: Analytics["byCategory"], totalSpent: string, colors: readonly string[]) {
  const top = rows.slice(0, 5).map((row, index) => ({
    key: row.categoryId ?? "none",
    label: row.categoryName,
    total: row.total,
    share: row.share,
    color: colors[index]!,
  }));
  if (rows.length > 5) {
    const rest = subtract(money(totalSpent), sum(top.map((r) => money(r.total))));
    if (compare(rest, ZERO) > 0) {
      top.push({
        key: "others",
        label: `Others (${rows.length - 5})`,
        total: rest,
        share: Math.max(0, 100 - top.reduce((acc, r) => acc + r.share, 0)),
        color: colors[5]!,
      });
    }
  }
  return top;
}

export default function AnalyticsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [preset, setPreset] = useState<PeriodPreset>("this-month");
  const [view, setView] = useState<ViewKey>("spending");
  const { data, isPending, isError, error, refetch, isRefetching } = useAnalytics(preset);
  // Net worth has its own range, independent of the period filter above: a
  // position is a running total, and showing only "this month" of it would
  // reduce the chart to a single column.
  const netWorth = useNetWorth(12);

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
          title="Couldn't load your insights"
          body={error instanceof Error ? error.message : "Something went wrong."}
          actionLabel="Try again"
          onAction={() => void refetch()}
        />
      </Screen>
    );
  }

  const currency = data.baseCurrency;
  const hasAnything =
    Number(data.totals.income) !== 0 ||
    Number(data.totals.expenses) !== 0 ||
    data.monthly.some((m) => Number(m.income) !== 0 || Number(m.expenses) !== 0);
  const categories = rankCategories(data.byCategory, data.totals.expenses, theme.category);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={() => {
            void refetch();
            void netWorth.refetch();
          }}
          tintColor={theme.brand}
        />
      }
    >
      {/* Filters sit above the charts, not between them. */}
      <ChipGroup label="Period" options={PERIOD_OPTIONS} value={preset} onChange={setPreset} />
      <SegmentedControl label="View" options={VIEWS} value={view} onChange={setView} />

      {view === "networth" ? (
        netWorth.data ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Net worth over the last twelve months. Opens the full breakdown."
            onPress={() => router.push("/net-worth")}
          >
            <Card eyebrow="Last 12 months" title="Net worth">
              <Amount
                value={money(netWorth.data.netWorth)}
                currency={netWorth.data.baseCurrency}
                size="lg"
                tone="neutral"
              />
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
                {Number(netWorth.data.monthChange) === 0 ? (
                  <Text style={{ color: theme.textSubtle, fontSize: 13 }}>Unchanged this month</Text>
                ) : (
                  <>
                    <Amount
                      value={money(netWorth.data.monthChange)}
                      currency={netWorth.data.baseCurrency}
                      size="sm"
                      showSign
                    />
                    <Text style={{ color: theme.textSubtle, fontSize: 13 }}>this month</Text>
                  </>
                )}
              </View>
              <NetWorthTrend
                data={netWorth.data.history}
                currency={netWorth.data.baseCurrency}
                height={120}
              />
            </Card>
          </Pressable>
        ) : netWorth.isError ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Couldn't load your net worth"
            body="Pull down to try again."
          />
        ) : (
          <ScreenSkeleton />
        )
      ) : !hasAnything ? (
        <EmptyState
          icon="bar-chart-outline"
          title="Nothing to chart yet"
          body="Spending trends, category breakdowns and your savings rate appear here once you've recorded a few weeks of activity."
        />
      ) : view === "spending" ? (
        <>
          <Card>
            {/* The gauge shows the split at a glance; every segment is named,
                with its share and amount, in the rows beneath it. */}
            <SemiGauge segments={categories}>
              <Text style={{ color: theme.textSubtle, fontSize: 12.5, fontWeight: "500" }}>Spent</Text>
              <Amount value={money(data.totals.expenses)} currency={currency} size="lg" tone="neutral" />
            </SemiGauge>

            {categories.length === 0 ? (
              <Text style={{ color: theme.textSubtle, fontSize: 13, textAlign: "center" }}>
                No spending recorded in this range.
              </Text>
            ) : (
              <View style={{ gap: 16, paddingTop: 12 }}>
                {categories.map((row) => (
                  <CategoryRow
                    key={row.key}
                    label={row.label}
                    total={row.total}
                    share={row.share}
                    color={row.color}
                    currency={currency}
                  />
                ))}
              </View>
            )}
          </Card>

          {data.categoryChange.some((c) => Number(c.change) !== 0) ? (
            <Card
              eyebrow={`vs ${data.previousPeriod.from} – ${data.previousPeriod.to}`}
              title="What changed"
            >
              <CategoryChange rows={data.categoryChange} currency={currency} />
            </Card>
          ) : null}

          {data.topMerchants.length > 0 ? (
            <Card title="Top merchants">
              {/* A ranked list, not a chart: the job is lookup, and a chart
                  would add ink without adding meaning. */}
              {data.topMerchants.slice(0, 8).map((merchant, index) => (
                <View
                  key={merchant.merchant}
                  style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 }}
                >
                  <Text
                    style={{ color: theme.textSubtle, fontSize: 12.5, width: 18, fontVariant: ["tabular-nums"] }}
                  >
                    {index + 1}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontSize: 15, fontWeight: "500" }} numberOfLines={1}>
                      {merchant.merchant}
                    </Text>
                    <Text style={{ color: theme.textSubtle, fontSize: 12.5 }}>
                      {merchant.count} {merchant.count === 1 ? "transaction" : "transactions"}
                    </Text>
                  </View>
                  <Amount value={money(merchant.total)} currency={currency} size="sm" tone="neutral" />
                </View>
              ))}
            </Card>
          ) : null}
        </>
      ) : (
        <>
          <Card eyebrow="Earned vs spent" title="Month by month">
            <IncomeExpenseBars data={data.monthly} currency={currency} />
          </Card>

          <Card eyebrow="This period" title="Savings">
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10 }}>
              <Amount value={money(data.totals.net)} currency={currency} size="lg" />
              <Text style={{ color: theme.textSubtle, fontSize: 14, fontWeight: "600" }}>
                {data.totals.savingsRate == null
                  ? "— rate"
                  : `${data.totals.savingsRate.toFixed(0)}% rate`}
              </Text>
            </View>
            <SavingsRateHistory data={data.monthly} />
          </Card>

          {data.byAccount.length > 1 ? (
            <Card title="By account">
              {data.byAccount.map((account) => (
                <View
                  key={account.accountId}
                  style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontSize: 15, fontWeight: "500" }} numberOfLines={1}>
                      {account.name}
                    </Text>
                    <Text style={{ color: theme.textSubtle, fontSize: 12.5 }}>
                      {account.transactionCount}{" "}
                      {account.transactionCount === 1 ? "transaction" : "transactions"}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Amount value={money(account.expenses)} currency={account.currency} size="sm" tone="neutral" />
                    <Text style={{ color: theme.textSubtle, fontSize: 12 }}>spent</Text>
                  </View>
                </View>
              ))}
            </Card>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

/**
 * Savings rate per month as small labelled rows.
 *
 * Months with no income have an undefined rate and are shown as "—" rather
 * than plotted as zero; a line chart would have to invent a point there.
 */
function SavingsRateHistory({
  data,
}: {
  data: { month: string; savingsRate: number | null }[];
}) {
  const theme = useTheme();
  const recent = data.slice(-6);

  return (
    <View style={{ flexDirection: "row", gap: 6, paddingTop: 6 }}>
      {recent.map((point) => {
        const [, m] = point.month.split("-").map(Number) as [number, number];
        const label = new Date(Date.UTC(2000, m - 1, 1)).toLocaleDateString("en-IN", {
          month: "narrow",
          timeZone: "UTC",
        });
        return (
          <View key={point.month} style={{ flex: 1, alignItems: "center", gap: 2 }}>
            <Text
              style={{
                color: point.savingsRate == null ? theme.textSubtle : theme.text,
                fontSize: 13,
                fontWeight: "600",
                fontVariant: ["tabular-nums"],
              }}
            >
              {point.savingsRate == null ? "—" : `${point.savingsRate.toFixed(0)}%`}
            </Text>
            <Text style={{ color: theme.textSubtle, fontSize: 10 }}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

function CategoryChange({
  rows,
  currency,
}: {
  rows: {
    categoryId: string | null;
    categoryName: string;
    change: string;
    changePercent: number | null;
  }[];
  currency: string;
}) {
  const theme = useTheme();

  const moved = rows
    .filter((row) => Number(row.change) !== 0)
    .sort((a, b) => Math.abs(Number(b.change)) - Math.abs(Number(a.change)))
    .slice(0, 6);

  return (
    <View style={{ gap: 8 }}>
      {moved.map((row) => {
        const change = Number(row.change);
        const up = change > 0;
        return (
          <View
            key={row.categoryId ?? "none"}
            style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
          >
            {/* An arrow plus a signed amount, so direction never depends on
                colour alone. */}
            <Ionicons
              name={up ? "trending-up" : "trending-down"}
              size={16}
              color={up ? theme.expense : theme.income}
            />
            <Text style={{ color: theme.text, fontSize: 14, flex: 1 }} numberOfLines={1}>
              {row.categoryName}
            </Text>
            {row.changePercent !== null ? (
              <Text
                style={{ color: theme.textSubtle, fontSize: 12, fontVariant: ["tabular-nums"] }}
              >
                {up ? "+" : ""}
                {row.changePercent.toFixed(0)}%
              </Text>
            ) : (
              <Text style={{ color: theme.textSubtle, fontSize: 12 }}>new</Text>
            )}
            <Amount
              value={money(row.change)}
              currency={currency}
              size="sm"
              tone={up ? "expense" : "income"}
            />
          </View>
        );
      })}
    </View>
  );
}
