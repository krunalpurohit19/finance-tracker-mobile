import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { money, sum, type Money } from "@finance/domain";

import { Amount } from "../../src/components/Amount";
import { Button } from "../../src/components/Button";
import { EmptyState } from "../../src/components/EmptyState";
import { Screen } from "../../src/components/Screen";
import { useAccounts, type Account } from "../../src/features/accounts/queries";
import { useTheme } from "../../src/theme/tokens";

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  BANK: "business-outline",
  CASH: "cash-outline",
  WALLET: "wallet-outline",
  CREDIT_CARD: "card-outline",
  INVESTMENT: "trending-up-outline",
  OTHER: "ellipse-outline",
};

/**
 * Totals are only shown per currency.
 *
 * Adding a USD balance to an INR one requires a conversion rate, and inventing
 * one would be worse than showing two numbers. Cross-currency net worth
 * arrives in Phase 10, where the rate is explicit.
 */
function totalsByCurrency(accounts: Account[]): { currency: string; total: Money }[] {
  const groups = new Map<string, Money[]>();
  for (const account of accounts) {
    const list = groups.get(account.currency) ?? [];
    list.push(money(account.balance));
    groups.set(account.currency, list);
  }
  return [...groups.entries()].map(([currency, values]) => ({
    currency,
    total: sum(values),
  }));
}

export default function AccountsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data: accounts, isPending, isError, error, refetch } = useAccounts();

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
          title="Couldn't load your accounts"
          body={error instanceof Error ? error.message : "Something went wrong."}
          actionLabel="Try again"
          onAction={() => void refetch()}
        />
      </Screen>
    );
  }

  if (accounts.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon="wallet-outline"
          title="No accounts yet"
          body="Add the places your money actually sits — a bank account, cash in your wallet, a credit card. Balances are calculated from your transactions."
          actionLabel="Add an account"
          onAction={() => router.push("/accounts/new")}
        />
      </Screen>
    );
  }

  const totals = totalsByCurrency(accounts);

  return (
    <Screen>
      <View style={{ gap: 4 }}>
        <Text style={{ color: theme.textSubtle, fontSize: 13, fontWeight: "600" }}>
          {totals.length === 1 ? "Total balance" : "Totals by currency"}
        </Text>
        {totals.map((entry) => (
          <Amount
            key={entry.currency}
            value={entry.total}
            currency={entry.currency}
            size={totals.length === 1 ? "xl" : "lg"}
            tone="neutral"
          />
        ))}
      </View>

      <View
        style={{
          backgroundColor: theme.surface,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: theme.border,
          overflow: "hidden",
        }}
      >
        {accounts.map((account, index) => (
          <Pressable
            key={account.id}
            accessibilityRole="button"
            accessibilityLabel={`${account.name}, balance ${account.balance} ${account.currency}`}
            onPress={() => router.push(`/accounts/${account.id}`)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderTopWidth: index === 0 ? 0 : 1,
              borderTopColor: theme.border,
            }}
          >
            <Ionicons
              name={TYPE_ICONS[account.type] ?? "ellipse-outline"}
              size={20}
              color={account.color ?? theme.textMuted}
            />

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ color: theme.text, fontSize: 15, fontWeight: "600" }}>
                  {account.name}
                </Text>
                {account.isDefault ? (
                  <Text style={{ color: theme.textSubtle, fontSize: 11, fontWeight: "700" }}>
                    DEFAULT
                  </Text>
                ) : null}
              </View>
              <Text style={{ color: theme.textSubtle, fontSize: 13 }}>
                {account.currency}
                {/* Liability is stated in words, not signalled by colour alone. */}
                {account.class === "LIABILITY" ? " · owed" : ""}
                {account.last4 ? ` · ••${account.last4}` : ""}
              </Text>
            </View>

            <Amount value={money(account.balance)} currency={account.currency} size="md" />
          </Pressable>
        ))}
      </View>

      <Button label="Add an account" onPress={() => router.push("/accounts/new")} />
    </Screen>
  );
}
