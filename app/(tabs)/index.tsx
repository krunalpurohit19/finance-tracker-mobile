import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { money, today } from "@finance/domain";

import { AccountTile } from "../../src/components/AccountTile";
import { Amount } from "../../src/components/Amount";
import { BalanceHero } from "../../src/components/BalanceHero";
import { Card, SectionTitle } from "../../src/components/Card";
import { ChipGroup } from "../../src/components/Chip";
import { EmptyState } from "../../src/components/EmptyState";
import { InsightBanner, buildInsights } from "../../src/components/InsightBanner";
import { Screen } from "../../src/components/Screen";
import { ScreenSkeleton } from "../../src/components/Skeleton";
import { TransactionRow } from "../../src/components/TransactionRow";
import { UpcomingPaymentCard } from "../../src/components/UpcomingPaymentCard";
import { Sparkline } from "../../src/components/charts/Sparkline";
import { useAccounts } from "../../src/features/accounts/queries";
import { useBudgets } from "../../src/features/budgets/queries";
import {
  PERIOD_OPTIONS,
  useDashboard,
  type Dashboard,
  type PeriodPreset,
} from "../../src/features/dashboard/queries";
import { useNetWorth } from "../../src/features/networth/queries";
import { useUpcomingRecurring } from "../../src/features/recurring/queries";
import { useSettings } from "../../src/features/settings/queries";
import { useSession } from "../../src/lib/auth-client";
import { useTheme } from "../../src/theme/tokens";

export default function DashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: session } = useSession();
  const [preset, setPreset] = useState<PeriodPreset>("this-month");
  const { data, isPending, isError, error, refetch, isRefetching } = useDashboard(preset);

  // The shelves are extras: each simply stays away until (and unless) it loads.
  const accounts = useAccounts();
  const budgets = useBudgets();
  const upcoming = useUpcomingRecurring();
  const netWorth = useNetWorth(6);
  const { data: settings } = useSettings();

  if (isPending) {
    return (
      <Screen scroll={false}>
        <View style={{ paddingTop: insets.top }}>
          <ScreenSkeleton />
        </View>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <View style={{ paddingTop: insets.top }}>
          <EmptyState
            icon="cloud-offline-outline"
            title="Couldn't load your dashboard"
            body={error instanceof Error ? error.message : "Something went wrong."}
            actionLabel="Try again"
            onAction={() => void refetch()}
          />
        </View>
      </Screen>
    );
  }

  const currency = data.baseCurrency;
  const hasActivity =
    data.recentTransactions.length > 0 ||
    Number(data.income) !== 0 ||
    Number(data.expenses) !== 0;
  const periodLabel = PERIOD_OPTIONS.find((o) => o.value === preset)?.label ?? "";
  const firstName = session?.user.name?.trim().split(/\s+/)[0];
  const todayDate = today(settings?.preferences.timezone || "Asia/Kolkata");

  function refreshAll() {
    void refetch();
    void accounts.refetch();
    void budgets.refetch();
    void upcoming.refetch();
    void netWorth.refetch();
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, paddingBottom: 32, gap: 24 }}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refreshAll} tintColor={theme.brand} />
      }
    >
      <View style={{ gap: 16 }}>
        <Text accessibilityRole="header" style={{ color: theme.text, fontSize: 22, fontWeight: "600" }}>
          {firstName ? `Hi, ${firstName}` : "Home"}
        </Text>

        <BalanceHero
          label="Total balance"
          value={data.totalBalance}
          currency={currency}
          income={data.income}
          expenses={data.expenses}
          periodLabel={periodLabel}
        />

        <ChipGroup label="Period" options={PERIOD_OPTIONS} value={preset} onChange={setPreset} />

        {data.unconvertedAccounts.length > 0 ? <UnconvertedNotice data={data} /> : null}
      </View>

      {accounts.data && accounts.data.length > 0 ? (
        <View style={{ gap: 6 }}>
          <SectionTitle action={<SeeAll label="All accounts" onPress={() => router.push("/accounts")} />}>
            Accounts
          </SectionTitle>
          <Shelf>
            {accounts.data.map((account) => (
              <AccountTile
                key={account.id}
                account={account}
                onPress={() => router.push(`/accounts/${account.id}`)}
              />
            ))}
          </Shelf>
        </View>
      ) : null}

      <InsightBanner insights={buildInsights(data, budgets.data)} />

      {upcoming.data && upcoming.data.length > 0 ? (
        <View style={{ gap: 6 }}>
          <SectionTitle action={<SeeAll label="All recurring" onPress={() => router.push("/recurring")} />}>
            Upcoming
          </SectionTitle>
          <Shelf>
            {upcoming.data.slice(0, 10).map((rule) => (
              <UpcomingPaymentCard key={rule.id} rule={rule} today={todayDate} />
            ))}
          </Shelf>
        </View>
      ) : null}

      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Card eyebrow="Saved this period" style={{ flex: 1 }}>
            <Amount value={money(data.savings)} currency={currency} size="md" />
            <Text style={{ color: theme.textSubtle, fontSize: 12.5 }}>
              {/* null means undefined, not zero — never render "0%" here. */}
              {data.savingsRate == null
                ? "Rate needs some income"
                : `${data.savingsRate.toFixed(0)}% of income`}
            </Text>
          </Card>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Net worth. Opens the net worth breakdown."
          onPress={() => router.push("/net-worth")}
          style={{ flex: 1 }}
        >
          <Card eyebrow="Net worth" style={{ flex: 1 }}>
            <Amount value={money(data.netWorth)} currency={currency} size="md" tone="neutral" />
            {netWorth.data && netWorth.data.history.length > 1 ? (
              <Sparkline values={netWorth.data.history.map((p) => Number(p.netWorth))} height={28} />
            ) : (
              <Text style={{ color: theme.textSubtle, fontSize: 12.5 }}>Own, less owed</Text>
            )}
          </Card>
        </Pressable>
      </View>

      {data.recentTransactions.length > 0 ? (
        <View style={{ gap: 12 }}>
          <SectionTitle
            action={<SeeAll label="All activity" onPress={() => router.push("/(tabs)/transactions")} />}
          >
            Recent activity
          </SectionTitle>
          <Card style={{ paddingVertical: 8, gap: 0 }}>
            {data.recentTransactions.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} showDate />
            ))}
          </Card>
        </View>
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

/** A row that scrolls sideways and runs off the screen edge, hinting at more. */
function Shelf({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -16 }}
      // Vertical padding leaves room for the cards' soft shadow.
      contentContainerStyle={{ gap: 12, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 14 }}
    >
      {children}
    </ScrollView>
  );
}

function SeeAll({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={12}
      style={{ minHeight: 32, justifyContent: "center" }}
    >
      <Text style={{ color: theme.brand, fontSize: 13.5, fontWeight: "600" }}>See all</Text>
    </Pressable>
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
        borderRadius: 14,
        backgroundColor: theme.warningSoft,
      }}
    >
      <Ionicons name="alert-circle-outline" size={19} color={theme.warning} />
      <Text style={{ color: theme.text, fontSize: 13, lineHeight: 19, flex: 1 }}>
        Not included in these totals: {names}. Add an exchange rate to {data.baseCurrency} to
        count it.
      </Text>
    </View>
  );
}
