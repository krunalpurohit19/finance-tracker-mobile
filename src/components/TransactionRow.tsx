import { Text, View } from "react-native";
import { money, negate } from "@finance/domain";

import { Amount, useMoneyText } from "./Amount";
import { IconTile } from "./IconTile";
import type { Transaction } from "../features/transactions/queries";
import { useTheme } from "../theme/tokens";

/** "Mon, 3 Nov" for a YYYY-MM-DD date. */
export function formatDay(date: string, locale = "en-IN"): string {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const options = { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" } as const;
  const day = new Date(Date.UTC(y, m - 1, d));
  try {
    return day.toLocaleDateString(locale, options);
  } catch {
    return day.toLocaleDateString("en-IN", options);
  }
}

/** The quiet date heading above a day's transactions. */
export function DayHeader({ date }: { date: string }) {
  const theme = useTheme();
  return (
    <Text accessibilityRole="header" style={{ color: theme.textSubtle, fontSize: 12.5, fontWeight: "600" }}>
      {formatDay(date)}
    </Text>
  );
}

/**
 * One transaction. Direction is carried by the sign and the icon, so the
 * amount can stay calm: spending in the text colour with a "−", income in
 * green with a "+", transfers neutral.
 */
export function TransactionRow({ tx, showDate = false }: { tx: Transaction; showDate?: boolean }) {
  const theme = useTheme();
  const moneyText = useMoneyText();
  const isTransfer = tx.type === "TRANSFER";
  const isExpense = tx.type === "EXPENSE";

  const title = tx.merchant ?? tx.categoryName ?? (isTransfer ? "Transfer" : tx.accountName);
  const detail = isTransfer
    ? `${tx.accountName} → ${tx.transferAccountName ?? ""}`
    : `${tx.categoryName ?? "Uncategorised"} · ${tx.accountName}`;

  return (
    <View accessible style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 44, paddingVertical: 8 }}>
      <IconTile
        icon={isTransfer ? "swap-horizontal" : isExpense ? "arrow-up" : "arrow-down"}
        color={isTransfer ? theme.textMuted : isExpense ? theme.expense : theme.income}
        background={isTransfer ? theme.fill : isExpense ? theme.expenseSoft : theme.incomeSoft}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.text, fontSize: 15, fontWeight: "600" }} numberOfLines={1}>
          {title}
        </Text>
        <Text style={{ color: theme.textSubtle, fontSize: 12.5 }} numberOfLines={1}>
          {showDate ? `${formatDay(tx.occurredOn)} · ${detail}` : detail}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Amount
          value={isExpense ? negate(money(tx.amount)) : money(tx.amount)}
          currency={tx.currency}
          size="sm"
          tone={tx.type === "INCOME" ? "income" : "neutral"}
          showSign={tx.type === "INCOME"}
        />
        {tx.currency !== tx.baseCurrency ? (
          <Text style={{ color: theme.textSubtle, fontSize: 12 }}>
            ≈ {moneyText(money(tx.baseAmount), tx.baseCurrency)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
