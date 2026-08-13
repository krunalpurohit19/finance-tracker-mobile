import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { Button } from "../../src/components/Button";
import { Field } from "../../src/components/Field";
import { Screen } from "../../src/components/Screen";
import { useCreateCategory } from "../../src/features/categories/queries";
import { ApiRequestError } from "../../src/lib/api";
import { useTheme } from "../../src/theme/tokens";

export default function NewCategoryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const createCategory = useCreateCategory();

  const [name, setName] = useState("");
  const [kind, setKind] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [icon, setIcon] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit() {
    setFormError(null);
    setFieldErrors({});

    if (!name.trim()) {
      setFieldErrors({ name: "Name is required" });
      return;
    }

    try {
      await createCategory.mutateAsync({
        name: name.trim(),
        kind,
        icon: icon.trim() || undefined,
      });
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
      footer={<Button label="Add category" onPress={onSubmit} loading={createCategory.isPending} />}
    >
      <Field
        label="Category name"
        value={name}
        onChangeText={setName}
        error={fieldErrors.name}
        placeholder="e.g. Groceries"
        autoFocus
        autoCapitalize="words"
      />

      <View style={{ gap: 8 }}>
        <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: "600" }}>Type</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {(["EXPENSE", "INCOME"] as const).map((option) => {
            const selected = option === kind;
            return (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setKind(option)}
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
                  {option === "EXPENSE" ? "Expense" : "Income"}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Field
        label="Icon name (optional)"
        value={icon}
        onChangeText={setIcon}
        error={fieldErrors.icon}
        placeholder="e.g. cart-outline"
        hint="Ionicons name. Leave blank for default."
        autoCapitalize="none"
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
