import { Text, View } from "react-native";
import { calendarDate, daysBetween, money, negate, type CalendarDate } from "@finance/domain";

import { Amount } from "./Amount";
import type { RecurringRule } from "../features/recurring/queries";
import { useTheme, type Theme } from "../theme/tokens";

/** When a rule is next due, in words. The dot repeats the urgency; the words carry it. */
export function dueStatus(nextOccurrence: string, today: CalendarDate, theme: Theme) {
  const days = daysBetween(today, calendarDate(nextOccurrence));
  if (days < 0) {
    return { label: days === -1 ? "Overdue by 1 day" : `Overdue by ${-days} days`, color: theme.expense };
  }
  if (days === 0) return { label: "Due today", color: theme.warning };
  if (days <= 3) return { label: days === 1 ? "Due tomorrow" : `Due in ${days} days`, color: theme.warning };
  return { label: `Due in ${days} days`, color: theme.textSubtle };
}

/** A recurring payment (or income) that is coming up, for the Home shelf. */
export function UpcomingPaymentCard({ rule, today }: { rule: RecurringRule; today: CalendarDate }) {
  const theme = useTheme();
  const due = dueStatus(rule.nextOccurrence, today, theme);
  const amount = rule.type === "EXPENSE" ? negate(money(rule.amount)) : money(rule.amount);

  return (
    <View accessible style={[theme.card, { width: 176, padding: 14, gap: 12 }]}>
      <View style={{ gap: 2 }}>
        <Text style={{ color: theme.text, fontSize: 14, fontWeight: "600" }} numberOfLines={1}>
          {rule.name}
        </Text>
        <Text style={{ color: theme.textSubtle, fontSize: 12.5 }} numberOfLines={1}>
          {rule.type === "TRANSFER" ? "Transfer" : (rule.categoryName ?? rule.accountName)}
        </Text>
      </View>
      <Amount
        value={amount}
        currency={rule.currency}
        size="md"
        tone={rule.type === "INCOME" ? "income" : "neutral"}
        showSign={rule.type === "INCOME"}
      />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: due.color }} />
        <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: "600" }}>{due.label}</Text>
      </View>
    </View>
  );
}
