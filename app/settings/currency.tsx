import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SUPPORTED_CURRENCIES } from "@finance/domain";

import { Button } from "../../src/components/Button";
import { Card } from "../../src/components/Card";
import { Field } from "../../src/components/Field";
import { Screen } from "../../src/components/Screen";
import { useChangeBaseCurrency, useSettings } from "../../src/features/settings/queries";
import { ApiRequestError } from "../../src/lib/api";
import { useTheme } from "../../src/theme/tokens";

export default function CurrencyScreen() {
  const theme = useTheme();
  const settings = useSettings();
  const change = useChangeBaseCurrency();

  const [target, setTarget] = useState<string | null>(null);
  const [confirm, setConfirm] = useState("");

  if (settings.isPending) {
    return (
      <Screen scroll={false}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={theme.brand} />
        </View>
      </Screen>
    );
  }

  const current = settings.data?.preferences.baseCurrency ?? "INR";
  const transactions = settings.data?.counts.transactions ?? 0;
  const fieldErrors =
    change.error instanceof ApiRequestError ? change.error.fieldErrors : undefined;

  if (change.isSuccess && change.data) {
    return (
      <Screen>
        <Card eyebrow="Done" title={`Now reporting in ${change.data.to}`}>
          <Text style={{ color: theme.textMuted, fontSize: 14, lineHeight: 20 }}>
            {change.data.repriced} transaction{change.data.repriced === 1 ? "" : "s"} were
            recalculated at the exchange rate that applied on the day each one happened, so your
            history keeps the value it actually had.
          </Text>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ gap: 4 }}>
        <Text style={{ color: theme.textSubtle, fontSize: 13, fontWeight: "600" }}>
          Currently reporting in
        </Text>
        <Text style={{ color: theme.text, fontSize: 28, fontWeight: "700" }}>{current}</Text>
      </View>

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
          This is not a display setting. Every one of your {transactions} transactions stores
          its value in the base currency, so switching recalculates all of them — using the rate
          that applied on each transaction&apos;s own date, not today&apos;s. Accounts keep
          their own currency. If a rate is missing, nothing changes and you&apos;ll be told
          which one to add.
        </Text>
      </View>

      <Card title="Switch to">
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {SUPPORTED_CURRENCIES.filter((c) => c.code !== current).map((currency) => {
            const active = currency.code === target;
            return (
              <Pressable
                key={currency.code}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${currency.name}, ${currency.code}`}
                onPress={() => {
                  setTarget(currency.code);
                  setConfirm("");
                  change.reset();
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: active ? theme.brand : theme.surfaceElevated,
                  borderWidth: 1,
                  borderColor: active ? theme.brand : theme.border,
                }}
              >
                {active ? <Ionicons name="checkmark" size={14} color={theme.onBrand} /> : null}
                <Text
                  style={{
                    color: active ? theme.onBrand : theme.textMuted,
                    fontSize: 13,
                    fontWeight: "600",
                  }}
                >
                  {currency.symbol} {currency.code}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {target ? (
        <>
          <Field
            label={`Type ${target} to confirm`}
            value={confirm}
            onChangeText={(value) => setConfirm(value.toUpperCase())}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder={target}
            error={fieldErrors?.confirm?.[0]}
          />

          {change.isError ? (
            <Text style={{ color: theme.expense, fontSize: 13, lineHeight: 19 }}>
              {change.error instanceof Error ? change.error.message : "Couldn't switch."}
            </Text>
          ) : null}

          <Button
            label={`Recalculate everything in ${target}`}
            onPress={() => change.mutate({ baseCurrency: target, confirm })}
            loading={change.isPending}
            disabled={confirm !== target}
          />
        </>
      ) : null}
    </Screen>
  );
}
