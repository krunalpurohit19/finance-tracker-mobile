import { useState, useEffect } from "react";
import { ActivityIndicator, Alert, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Button } from "../../src/components/Button";
import { Field } from "../../src/components/Field";
import { Screen } from "../../src/components/Screen";
import { useCategory, useUpdateCategory, useDeleteCategory } from "../../src/features/categories/queries";
import { ApiRequestError } from "../../src/lib/api";
import { useTheme } from "../../src/theme/tokens";

export default function EditCategoryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: category, isPending: isLoading } = useCategory(id);
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setIcon(category.icon ?? "");
    }
  }, [category]);

  if (isLoading) {
    return (
      <Screen scroll={false}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={theme.brand} />
        </View>
      </Screen>
    );
  }

  if (!category) {
    return (
      <Screen>
        <Text style={{ color: theme.text }}>Category not found.</Text>
      </Screen>
    );
  }

  async function onSubmit() {
    setFormError(null);
    setFieldErrors({});

    if (!name.trim()) {
      setFieldErrors({ name: "Name is required" });
      return;
    }

    try {
      await updateCategory.mutateAsync({
        id,
        input: {
          name: name.trim(),
          icon: icon.trim() || undefined,
        },
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

  function onDelete() {
    Alert.alert(
      "Delete this category?",
      "If this category is used by transactions or budgets, deletion will fail. You cannot undo this.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCategory.mutateAsync(id);
              router.back();
            } catch (error) {
              if (error instanceof ApiRequestError) {
                setFormError(error.message);
              }
            }
          },
        },
      ],
    );
  }

  return (
    <Screen
      footer={<Button label="Save changes" onPress={onSubmit} loading={updateCategory.isPending} />}
    >
      <Field
        label="Category name"
        value={name}
        onChangeText={setName}
        error={fieldErrors.name}
        placeholder="e.g. Groceries"
        autoCapitalize="words"
      />

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

      {!category.isSystem && (
        <View style={{ marginTop: 24 }}>
          <Button
            label="Delete category"
            variant="secondary"
            onPress={onDelete}
            loading={deleteCategory.isPending}
          />
        </View>
      )}
    </Screen>
  );
}
