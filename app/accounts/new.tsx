import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { createAccountSchema, defaultClassFor, ACCOUNT_TYPES } from "@finance/validation";
import { SUPPORTED_CURRENCIES } from "@finance/domain";

import { Button } from "../../src/components/Button";
import { Field } from "../../src/components/Field";
import { Screen } from "../../src/components/Screen";
import { useCreateAccount } from "../../src/features/accounts/queries";
import { ApiRequestError } from "../../src/lib/api";
import { useTheme } from "../../src/theme/tokens";

const TYPE_LABELS: Record<string, string> = {
  BANK: "Bank",
  CASH: "Cash",
  WALLET: "Wallet",
  CREDIT_CARD: "Credit card",
  INVESTMENT: "Investment",
  OTHER: "Other",
};

export default function NewAccountScreen() {
  const theme = useTheme();
  const router = useRouter();
  const createAccount = useCreateAccount();

  const [name, setName] = useState("");
  const [type, setType] = useState<(typeof ACCOUNT_TYPES)[number]>("BANK");
  const [currency, setCurrency] = useState("INR");
  const [openingBalance, setOpeningBalance] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const isLiability = defaultClassFor(type) === "LIABILITY";

  async function onSubmit() {
    setFormError(null);

    const parsed = createAccountSchema.safeParse({
      name,
      type,
      currency,
      openingBalance: openingBalance.trim() === "" ? "0" : openingBalance.trim(),
      isDefault: false,
    });

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "_form");
        errors[key] ??= issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    try {
      await createAccount.mutateAsync(parsed.data);
      router.back();
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.fieldErrors) {
          setFieldErrors(
            Object.fromEntries(
              Object.entries(error.fieldErrors).map(([key, messages]) => [
                key,
                messages[0] ?? "",
              ]),
            ),
          );
        }
        setFormError(error.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <Screen
      footer={<Button label="Add account" onPress={onSubmit} loading={createAccount.isPending} />}
    >
      <Field
        label="Account name"
        value={name}
        onChangeText={setName}
        error={fieldErrors.name}
        placeholder="HDFC Bank"
        autoFocus
        autoCapitalize="words"
      />

      <View style={{ gap: 8 }}>
        <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: "600" }}>Type</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {ACCOUNT_TYPES.map((option) => {
            const selected = option === type;
            return (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setType(option)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                  borderRadius: 999,
                  backgroundColor: selected ? theme.brand : theme.surface,
                  borderWidth: 1,
                  borderColor: selected ? theme.brand : theme.border,
                }}
              >
                <Text
                  style={{
                    color: selected ? theme.onBrand : theme.textMuted,
                    fontWeight: "600",
                    fontSize: 14,
                  }}
                >
                  {TYPE_LABELS[option]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: "600" }}>
          Currency
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {SUPPORTED_CURRENCIES.map((option) => {
            const selected = option.code === currency;
            return (
              <Pressable
                key={option.code}
                accessibilityRole="radio"
                accessibilityLabel={option.name}
                accessibilityState={{ selected }}
                onPress={() => setCurrency(option.code)}
                style={{
                  paddingHorizontal: 13,
                  paddingVertical: 9,
                  borderRadius: 999,
                  backgroundColor: selected ? theme.brand : theme.surface,
                  borderWidth: 1,
                  borderColor: selected ? theme.brand : theme.border,
                }}
              >
                <Text
                  style={{
                    color: selected ? theme.onBrand : theme.textMuted,
                    fontWeight: "600",
                    fontSize: 14,
                  }}
                >
                  {option.symbol} {option.code}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={{ color: theme.textSubtle, fontSize: 13 }}>
          An account's currency is fixed once it has transactions, so pick the one it really
          holds.
        </Text>
      </View>

      <Field
        label="Current balance"
        value={openingBalance}
        onChangeText={setOpeningBalance}
        error={fieldErrors.openingBalance}
        hint={
          isLiability
            ? "Enter what you currently owe as a negative amount, e.g. -4000."
            : "What's in this account right now. Leave blank for zero."
        }
        placeholder="0"
        keyboardType="numbers-and-punctuation"
        inputMode="decimal"
      />

      {formError ? (
        <View
          style={{
            padding: 12,
            borderRadius: 10,
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: theme.expense,
          }}
        >
          <Text style={{ color: theme.expense, fontSize: 14 }}>{formError}</Text>
        </View>
      ) : null}

    </Screen>
  );
}
