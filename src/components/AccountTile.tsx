import { Pressable, Text } from "react-native";
import { money } from "@finance/domain";

import { Amount } from "./Amount";
import { IconTile } from "./IconTile";
import type { Account } from "../features/accounts/queries";
import { useTheme } from "../theme/tokens";

/** One account on the Home shelf: what it is and what it holds. */
export function AccountTile({ account, onPress }: { account: Account; onPress: () => void }) {
  const theme = useTheme();
  const liability = account.class === "LIABILITY";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${account.name} account. Opens its details.`}
      onPress={onPress}
      style={[theme.card, { width: 148, padding: 14, gap: 14 }]}
    >
      <IconTile
        icon={liability ? "card-outline" : account.type === "CASH" ? "cash-outline" : "wallet-outline"}
        color={theme.brand}
        background={theme.brandSoft}
      />
      <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: "500" }} numberOfLines={1}>
        {account.name}
      </Text>
      <Amount value={money(account.balance)} currency={account.currency} size="md" tone="neutral" />
    </Pressable>
  );
}
