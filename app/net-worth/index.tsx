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
import { absolute, money } from "@finance/domain";

import { Amount } from "../../src/components/Amount";
import { Card } from "../../src/components/Card";
import { EmptyState } from "../../src/components/EmptyState";
import { Screen } from "../../src/components/Screen";
import { NetWorthTrend } from "../../src/components/charts/NetWorthTrend";
import {
  useNetWorth,
  type NetWorth,
  type NetWorthAccount,
} from "../../src/features/networth/queries";
import { useTheme } from "../../src/theme/tokens";

const RANGES = [
  { months: 6, label: "6 months" },
  { months: 12, label: "1 year" },
  { months: 24, label: "2 years" },
  { months: 60, label: "5 years" },
] as const;

export default function NetWorthScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [months, setMonths] = useState<number>(12);
  const { data, isPending, isError, error, refetch, isRefetching } = useNetWorth(months);

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
          title="Couldn't load your net worth"
          body={error instanceof Error ? error.message : "Something went wrong."}
          actionLabel="Try again"
          onAction={() => void refetch()}
        />
      </Screen>
    );
  }

  const currency = data.baseCurrency;
  const hasAccounts = data.assetAccounts.length > 0 || data.liabilityAccounts.length > 0;

  if (!hasAccounts) {
    return (
      <Screen>
        <EmptyState
          icon="stats-chart-outline"
          title="No accounts yet"
          body="Net worth is everything you own less everything you owe. Add an account — with what's in it today — and it starts tracking from there."
          actionLabel="Add an account"
          onAction={() => router.push("/accounts/new")}
        />
      </Screen>
    );
  }

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
      <View style={{ gap: 4 }}>
        <Text style={{ color: theme.textSubtle, fontSize: 13, fontWeight: "600" }}>
          Net worth
        </Text>
        <Amount value={money(data.netWorth)} currency={currency} size="xl" tone="neutral" />
        <MonthChange data={data} />
      </View>

      {data.unconvertedAccounts.length > 0 ? <UnconvertedNotice data={data} /> : null}

      <Card eyebrow="Month by month" title="How it has moved">
        <RangeFilter selected={months} onSelect={setMonths} />
        <NetWorthTrend data={data.history} currency={currency} />
      </Card>

      {/* Assets and liabilities as two halves of one bar, so the reader sees
          the proportion before reading either number. */}
      <Card title="What it's made of">
        <CompositionBar data={data} />

        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
            <View
              style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: theme.brand }}
            />
            <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: "600" }}>
              Owned
            </Text>
          </View>
          <Amount value={money(data.assets)} currency={currency} size="sm" tone="neutral" />
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
            <View
              style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: theme.warning }}
            />
            <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: "600" }}>
              Owed
            </Text>
          </View>
          {/* Liabilities arrive negative. Shown as a positive "owed" figure
              because the label already carries the direction — but the sum
              above is still assets + liabilities, with no sign juggling. */}
          <Amount
            value={absolute(money(data.liabilities))}
            currency={currency}
            size="sm"
            tone="neutral"
          />
        </View>
      </Card>

      <AccountSection
        title="Assets"
        subtitle="What you own"
        accounts={data.assetAccounts}
        currency={currency}
        emptyLabel="No asset accounts yet."
      />

      {data.liabilityAccounts.length > 0 ? (
        <AccountSection
          title="Liabilities"
          subtitle="What you owe"
          accounts={data.liabilityAccounts}
          currency={currency}
          emptyLabel="No debts recorded."
        />
      ) : null}

      <Text style={{ color: theme.textSubtle, fontSize: 12, lineHeight: 18 }}>
        Figures are as of {data.asOf}, in {currency}. Archived accounts are still counted —
        archiving hides an account from pickers, it doesn&apos;t make the money disappear.
      </Text>
    </ScrollView>
  );
}

/**
 * The headline movement.
 *
 * The direction is carried by an arrow and a signed amount, not by colour, so
 * it survives greyscale and colour-blindness. The percentage is omitted
 * entirely when the server sends null — a percentage of a zero or negative
 * base would invert its own meaning.
 */
function MonthChange({ data }: { data: NetWorth }) {
  const theme = useTheme();
  const change = Number(data.monthChange);

  if (change === 0) {
    return (
      <Text style={{ color: theme.textMuted, fontSize: 13 }}>
        Unchanged since the end of last month
      </Text>
    );
  }

  const up = change > 0;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <Ionicons
        name={up ? "trending-up" : "trending-down"}
        size={16}
        color={up ? theme.income : theme.expense}
      />
      <Amount
        value={money(data.monthChange)}
        currency={data.baseCurrency}
        size="sm"
        showSign
        tone={up ? "income" : "expense"}
      />
      {data.monthChangePercent !== null ? (
        <Text style={{ color: theme.textSubtle, fontSize: 13, fontVariant: ["tabular-nums"] }}>
          ({up ? "+" : ""}
          {data.monthChangePercent.toFixed(1)}%)
        </Text>
      ) : null}
      <Text style={{ color: theme.textMuted, fontSize: 13 }}>since last month</Text>
    </View>
  );
}

function RangeFilter({
  selected,
  onSelect,
}: {
  selected: number;
  onSelect: (months: number) => void;
}) {
  const theme = useTheme();

  return (
    <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
      {RANGES.map((range) => {
        const active = range.months === selected;
        return (
          <Pressable
            key={range.months}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(range.months)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
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
                fontSize: 12,
              }}
            >
              {range.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Assets against debts as one bar. Both figures are printed below it. */
function CompositionBar({ data }: { data: NetWorth }) {
  const theme = useTheme();

  const assets = Math.abs(Number(data.assets));
  const debts = Math.abs(Number(data.liabilities));
  const total = assets + debts;

  if (total === 0) {
    return (
      <Text style={{ color: theme.textSubtle, fontSize: 13 }}>
        Every account is sitting at zero.
      </Text>
    );
  }

  const assetShare = (assets / total) * 100;

  return (
    <View
      accessible
      accessibilityLabel={`Owned ${data.assets}, owed ${data.liabilities} ${data.baseCurrency}`}
      style={{
        flexDirection: "row",
        height: 10,
        borderRadius: 5,
        overflow: "hidden",
        backgroundColor: theme.surfaceElevated,
      }}
    >
      <View style={{ width: `${assetShare}%`, backgroundColor: theme.brand }} />
      <View style={{ flex: 1, backgroundColor: theme.warning }} />
    </View>
  );
}

function AccountSection({
  title,
  subtitle,
  accounts,
  currency,
  emptyLabel,
}: {
  title: string;
  subtitle: string;
  accounts: NetWorthAccount[];
  currency: string;
  emptyLabel: string;
}) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Card eyebrow={subtitle} title={title}>
      {accounts.length === 0 ? (
        <Text style={{ color: theme.textSubtle, fontSize: 13 }}>{emptyLabel}</Text>
      ) : (
        accounts.map((account) => (
          <Pressable
            key={account.accountId}
            accessibilityRole="button"
            accessibilityLabel={`${account.name}, ${account.balance} ${account.currency}`}
            onPress={() => router.push(`/accounts/${account.accountId}`)}
            style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ color: theme.text, fontSize: 14 }} numberOfLines={1}>
                  {account.name}
                </Text>
                {account.archived ? (
                  <Text style={{ color: theme.textSubtle, fontSize: 11, fontWeight: "600" }}>
                    ARCHIVED
                  </Text>
                ) : null}
              </View>

              {account.convertible ? (
                <Text style={{ color: theme.textSubtle, fontSize: 12 }}>
                  {account.share.toFixed(0)}% of {title.toLowerCase()}
                  {account.currency === currency ? "" : ` · ${account.currency}`}
                </Text>
              ) : (
                /* A missing rate means this account counts as zero. Saying so
                   is the whole point — a silently understated total reads as
                   a correct one. */
                <Text style={{ color: theme.warning, fontSize: 12 }}>
                  Not counted — no {account.currency}→{currency} rate
                </Text>
              )}
            </View>

            <View style={{ alignItems: "flex-end" }}>
              <Amount
                value={money(account.balance)}
                currency={account.currency}
                size="sm"
                tone="neutral"
              />
              {account.currency !== currency && account.convertible ? (
                <Text style={{ color: theme.textSubtle, fontSize: 11 }}>
                  {money(account.baseBalance)} {currency}
                </Text>
              ) : null}
            </View>

            <Ionicons name="chevron-forward" size={16} color={theme.textSubtle} />
          </Pressable>
        ))
      )}
    </Card>
  );
}

/**
 * Missing exchange rates understate every converted total, so this says so
 * plainly rather than letting the user read a wrong number as a right one.
 */
function UnconvertedNotice({ data }: { data: NetWorth }) {
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
        Not included in these figures: {names}. Add an exchange rate to {data.baseCurrency} to
        count it — a guessed rate would be worse than an honest gap.
      </Text>
    </View>
  );
}
