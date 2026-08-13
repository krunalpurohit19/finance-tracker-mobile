import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { createTransactionSchema, positiveMoneyString } from "@finance/validation";
import { today } from "@finance/domain";

import { Button } from "../../src/components/Button";
import { Field } from "../../src/components/Field";
import { Screen } from "../../src/components/Screen";
import { useAccounts } from "../../src/features/accounts/queries";
import { useCategories, useCreateTransaction } from "../../src/features/transactions/queries";
import { ApiRequestError } from "../../src/lib/api";
import { useTheme } from "../../src/theme/tokens";

type TxType = "EXPENSE" | "INCOME" | "TRANSFER";

const TYPES: { value: TxType; label: string }[] = [
  { value: "EXPENSE", label: "Expense" },
  { value: "INCOME", label: "Income" },
  { value: "TRANSFER", label: "Transfer" },
];

/**
 * Quick add.
 *
 * Amount holds focus on open and stays the largest thing on screen, because
 * fast entry is the single most frequent action in the app. Everything else
 * has a sensible default so a typical expense is: type a number, tap save.
 */
export default function NewTransactionScreen() {
  const theme = useTheme();
  const router = useRouter();

  const { data: accounts } = useAccounts();
  const [type, setType] = useState<TxType>("EXPENSE");
  const { data: categories } = useCategories(type === "TRANSFER" ? undefined : type);
  const createTransaction = useCreateTransaction();

  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState<string | null>(null);
  const [toAccountId, setToAccountId] = useState<string | null>(null);
  const [transferAmount, setTransferAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [merchant, setMerchant] = useState("");
  const [touched, setTouched] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Default to the user's default account, else the first one.
  useEffect(() => {
    if (!accountId && accounts?.length) {
      setAccountId((accounts.find((a) => a.isDefault) ?? accounts[0])!.id);
    }
  }, [accounts, accountId]);

  // A category from the wrong side of the ledger is rejected by the server,
  // so clear the selection whenever the type flips.
  useEffect(() => {
    setCategoryId(null);
  }, [type]);

  const source = accounts?.find((a) => a.id === accountId);
  const destination = accounts?.find((a) => a.id === toAccountId);
  const crossCurrency =
    type === "TRANSFER" && source && destination && source.currency !== destination.currency;

  const amountValidation = useMemo(() => {
    if (amount.trim() === "") return { state: "empty" as const };
    const result = positiveMoneyString.safeParse(amount);
    return result.success
      ? { state: "valid" as const }
      : {
          state: "invalid" as const,
          message: result.error.issues[0]?.message ?? "Invalid amount",
        };
  }, [amount]);

  const amountError =
    touched && amountValidation.state === "invalid" ? amountValidation.message : undefined;

  async function onSubmit() {
    setTouched(true);
    setFormError(null);

    const raw: Record<string, unknown> = {
      type,
      amount: amount.trim(),
      accountId,
      occurredOn: today("Asia/Kolkata"),
      merchant: merchant.trim() === "" ? undefined : merchant.trim(),
    };
    if (type === "TRANSFER") {
      raw.transferAccountId = toAccountId;
      if (crossCurrency && transferAmount.trim() !== "")
        raw.transferAmount = transferAmount.trim();
    } else if (categoryId) {
      raw.categoryId = categoryId;
    }

    const parsed = createTransactionSchema.safeParse(raw);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "_form");
        errors[key] ??= issue.message;
      }
      setFieldErrors(errors);
      if (!errors.amount && Object.keys(errors).length > 0) {
        setFormError("Check the highlighted fields.");
      }
      return;
    }
    setFieldErrors({});

    try {
      await createTransaction.mutateAsync(parsed.data);
      router.back();
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.fieldErrors) {
          setFieldErrors(
            Object.fromEntries(
              Object.entries(error.fieldErrors).map(([k, v]) => [k, v[0] ?? ""]),
            ),
          );
        }
        setFormError(error.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    }
  }

  const noAccounts = accounts?.length === 0;

  return (
    <Screen
      footer={
        noAccounts ? null : (
          <Button label="Save" onPress={onSubmit} loading={createTransaction.isPending} />
        )
      }
    >
      <View style={{ flexDirection: "row", gap: 8 }}>
        {TYPES.map((option) => {
          const selected = option.value === type;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => setType(option.value)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 10,
                alignItems: "center",
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
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ gap: 8, paddingTop: 8 }}>
        <Text style={{ color: theme.textSubtle, fontSize: 13, fontWeight: "600" }}>Amount</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ color: theme.textMuted, fontSize: 34, fontWeight: "700" }}>
            {source?.currency ?? "₹"}
          </Text>
          <TextInput
            autoFocus
            value={amount}
            onChangeText={setAmount}
            onBlur={() => setTouched(true)}
            placeholder="0"
            placeholderTextColor={theme.textSubtle}
            keyboardType="decimal-pad"
            inputMode="decimal"
            accessibilityLabel="Amount"
            style={{
              flex: 1,
              color: theme.text,
              fontSize: 34,
              fontWeight: "700",
              fontVariant: ["tabular-nums"],
              paddingVertical: 4,
            }}
          />
        </View>
        <View
          style={{ height: 1, backgroundColor: amountError ? theme.expense : theme.border }}
        />
        {amountError ? (
          <Text style={{ color: theme.expense, fontSize: 13 }}>{amountError}</Text>
        ) : null}
      </View>

      {noAccounts ? (
        <View
          style={{
            padding: 14,
            borderRadius: 12,
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: theme.border,
            gap: 8,
          }}
        >
          <Text style={{ color: theme.text, fontSize: 14, fontWeight: "600" }}>
            Add an account first
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 13, lineHeight: 19 }}>
            A transaction has to come from somewhere, so you need at least one account before
            you can record anything.
          </Text>
          <Button label="Add an account" onPress={() => router.replace("/accounts/new")} />
        </View>
      ) : (
        <>
          <Picker
            label={type === "TRANSFER" ? "From" : "Account"}
            options={(accounts ?? []).map((a) => ({
              id: a.id,
              label: a.name,
              hint: a.currency,
            }))}
            selectedId={accountId}
            onSelect={setAccountId}
            error={fieldErrors.accountId}
          />

          {type === "TRANSFER" ? (
            <Picker
              label="To"
              options={(accounts ?? [])
                .filter((a) => a.id !== accountId)
                .map((a) => ({ id: a.id, label: a.name, hint: a.currency }))}
              selectedId={toAccountId}
              onSelect={setToAccountId}
              error={fieldErrors.transferAccountId}
            />
          ) : (
            <Picker
              label="Category"
              options={(categories ?? []).map((c) => ({ id: c.id, label: c.name }))}
              selectedId={categoryId}
              onSelect={setCategoryId}
              error={fieldErrors.categoryId}
              optional
            />
          )}

          {crossCurrency ? (
            <Field
              label={`Amount received in ${destination?.currency}`}
              value={transferAmount}
              onChangeText={setTransferAmount}
              error={fieldErrors.transferAmount}
              hint="Different currencies, so enter what actually landed in the destination account."
              placeholder="0"
              keyboardType="decimal-pad"
              inputMode="decimal"
            />
          ) : null}

          {type !== "TRANSFER" ? (
            <Field
              label="Merchant"
              value={merchant}
              onChangeText={setMerchant}
              placeholder="Optional"
              autoCapitalize="words"
            />
          ) : null}

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

        </>
      )}
    </Screen>
  );
}

interface Option {
  id: string;
  label: string;
  hint?: string;
}

function Picker({
  label,
  options,
  selectedId,
  onSelect,
  error,
  optional = false,
}: {
  label: string;
  options: Option[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  error?: string | undefined;
  optional?: boolean;
}) {
  const theme = useTheme();

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: "600" }}>
        {label}
        {optional ? " (optional)" : ""}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {options.map((option) => {
          const selected = option.id === selectedId;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onSelect(option.id)}
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
                {option.label}
                {option.hint ? ` · ${option.hint}` : ""}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {error ? <Text style={{ color: theme.expense, fontSize: 13 }}>{error}</Text> : null}
    </View>
  );
}
