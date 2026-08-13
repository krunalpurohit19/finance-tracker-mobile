import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { createGoalSchema } from "@finance/validation";

import { Button } from "../../src/components/Button";
import { Field } from "../../src/components/Field";
import { Screen } from "../../src/components/Screen";
import { useCreateGoal } from "../../src/features/savings/queries";
import { ApiRequestError } from "../../src/lib/api";
import { useTheme } from "../../src/theme/tokens";

export default function NewGoalScreen() {
  const theme = useTheme();
  const router = useRouter();
  const createGoal = useCreateGoal();

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit() {
    setFormError(null);

    const parsed = createGoalSchema.safeParse({
      name,
      targetAmount: targetAmount.trim(),
      ...(targetDate.trim() === "" ? {} : { targetDate: targetDate.trim() }),
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
      await createGoal.mutateAsync({
        name: parsed.data.name,
        targetAmount: parsed.data.targetAmount,
        ...(parsed.data.targetDate ? { targetDate: parsed.data.targetDate } : {}),
      });
      router.back();
    } catch (error) {
      setFormError(
        error instanceof ApiRequestError
          ? error.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  return (
    <Screen>
      <Field
        label="What are you saving for?"
        value={name}
        onChangeText={setName}
        error={fieldErrors.name}
        placeholder="Emergency Fund"
        autoFocus
        autoCapitalize="words"
      />

      <Field
        label="Target amount"
        value={targetAmount}
        onChangeText={setTargetAmount}
        error={fieldErrors.targetAmount}
        placeholder="100000"
        keyboardType="decimal-pad"
        inputMode="decimal"
      />

      <Field
        label="Target date"
        value={targetDate}
        onChangeText={setTargetDate}
        error={fieldErrors.targetDate}
        hint="Optional, as YYYY-MM-DD. With a date we'll work out what to set aside each month."
        placeholder="2027-02-15"
        autoCapitalize="none"
      />

      <View
        style={{
          padding: 12,
          borderRadius: 10,
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.border,
        }}
      >
        <Text style={{ color: theme.textMuted, fontSize: 13, lineHeight: 19 }}>
          Contributions to a goal record what you&apos;ve set aside. They don&apos;t move money
          between accounts and they don&apos;t change your savings total — that already reflects
          what you earned and spent.
        </Text>
      </View>

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

      <Button label="Create goal" onPress={onSubmit} loading={createGoal.isPending} />
    </Screen>
  );
}
