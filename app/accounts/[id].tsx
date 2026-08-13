import { ActivityIndicator, Alert, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { money } from "@finance/domain";

import { Amount } from "../../src/components/Amount";
import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { EmptyState } from "../../src/components/EmptyState";
import { Screen } from "../../src/components/Screen";
import { useAccounts, useArchiveAccount } from "../../src/features/accounts/queries";
import { useTheme } from "../../src/theme/tokens";

export default function AccountDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: accounts, isPending } = useAccounts(true);
  const archive = useArchiveAccount();
  const account = accounts?.find((a) => a.id === id);

  if (isPending) {
    return (
      <Screen scroll={false}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={theme.brand} />
        </View>
      </Screen>
    );
  }

  if (!account) {
    return (
      <Screen>
        <EmptyState
          icon="help-circle-outline"
          title="Account not found"
          body="It may have been deleted."
          actionLabel="Back to accounts"
          onAction={() => router.replace("/accounts")}
        />
      </Screen>
    );
  }

  function onArchive() {
    Alert.alert(
      "Archive this account?",
      "It stays in your history and keeps counting toward your net worth — it just stops appearing when you add a transaction.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          style: "destructive",
          onPress: () => {
            archive.mutate(account!.id, { onSuccess: () => router.back() });
          },
        },
      ],
    );
  }

  return (
    <Screen>
      <View style={{ gap: 4 }}>
        <Text style={{ color: theme.textSubtle, fontSize: 13, fontWeight: "600" }}>
          Current balance
        </Text>
        <Amount value={money(account.balance)} currency={account.currency} size="xl" />
        {account.class === "LIABILITY" ? (
          <Text style={{ color: theme.textMuted, fontSize: 13 }}>
            This is a liability, so a negative balance means money owed.
          </Text>
        ) : null}
      </View>

      <Card title="Details">
        <Row label="Type" value={account.type.replace("_", " ").toLowerCase()} />
        <Row label="Currency" value={account.currency} />
        <Row label="Opening balance" value={account.openingBalance} />
        {account.institution ? <Row label="Institution" value={account.institution} /> : null}
        {account.last4 ? <Row label="Card ending" value={`••${account.last4}`} /> : null}
        {account.archived ? <Row label="Status" value="Archived" /> : null}
      </Card>

      <Card title="Transactions">
        <Text style={{ color: theme.textMuted, fontSize: 14, lineHeight: 20 }}>
          This account's transaction history appears here once transactions can be recorded, in
          Phase 4.
        </Text>
      </Card>

      {!account.archived ? (
        <Button
          label="Archive account"
          variant="secondary"
          onPress={onArchive}
          loading={archive.isPending}
        />
      ) : null}
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
      <Text style={{ color: theme.textMuted, fontSize: 14 }}>{label}</Text>
      <Text
        style={{
          color: theme.text,
          fontSize: 14,
          fontWeight: "600",
          textTransform: "capitalize",
        }}
      >
        {value}
      </Text>
    </View>
  );
}
