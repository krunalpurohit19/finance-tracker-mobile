import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { positiveMoneyString } from "@finance/validation";

import { Button } from "../../src/components/Button";
import { Field } from "../../src/components/Field";
import { Screen } from "../../src/components/Screen";
import { useCreateBudget } from "../../src/features/budgets/queries";
import { useCategories } from "../../src/features/transactions/queries";
import { ApiRequestError } from "../../src/lib/api";
import { useTheme } from "../../src/theme/tokens";

export default function NewBudgetScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data: categories } = useCategories("EXPENSE");
  const createBudget = useCreateBudget();

  const [scope, setScope] = useState<"OVERALL" | "CATEGORY">("CATEGORY");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit() {
    setFormError(null);

    const parsedAmount = positiveMoneyString.safeParse(amount.trim());
    if (!parsedAmount.success) {
      setFieldErrors({ amount: parsedAmount.error.issues[0]?.message ?? "Enter an amount" });
      return;
    }
    if (scope === "CATEGORY" && !categoryId) {
      setFieldErrors({ categoryId: "Pick a category" });
      return;
    }
    setFieldErrors({});

    try {
      await createBudget.mutateAsync({
        amount: parsedAmount.data,
        ...(scope === "CATEGORY" && categoryId ? { categoryId } : {}),
      });
      router.back();
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setFormError(error.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <Screen>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {(["CATEGORY", "OVERALL"] as const).map((option) => {
          const selected = option === scope;
          return (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => setScope(option)}
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
                {option === "CATEGORY" ? "One category" : "Everything"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {scope === "CATEGORY" ? (
        <View style={{ gap: 8 }}>
          <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: "600" }}>
            Category
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {(categories ?? []).map((category) => {
              const selected = category.id === categoryId;
              return (
                <Pressable
                  key={category.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setCategoryId(category.id)}
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
                    {category.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {fieldErrors.categoryId ? (
            <Text style={{ color: theme.expense, fontSize: 13 }}>{fieldErrors.categoryId}</Text>
          ) : null}
        </View>
      ) : null}

      <Field
        label="Monthly limit"
        value={amount}
        onChangeText={setAmount}
        error={fieldErrors.amount}
        hint="Applies from this month onward. Changing it later leaves past months reporting the limit they actually had."
        placeholder="6000"
        keyboardType="decimal-pad"
        inputMode="decimal"
        autoFocus
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

      <Button label="Set budget" onPress={onSubmit} loading={createBudget.isPending} />
    </Screen>
  );
}
