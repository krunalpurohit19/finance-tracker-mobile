import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "../../src/components/Button";
import { Field } from "../../src/components/Field";
import { Screen } from "../../src/components/Screen";
import { useDeleteAccount, useSettings } from "../../src/features/settings/queries";
import { ApiRequestError } from "../../src/lib/api";
import { signOut } from "../../src/lib/auth-client";
import { useTheme } from "../../src/theme/tokens";

export default function DangerScreen() {
  const theme = useTheme();
  const router = useRouter();
  const settings = useSettings();
  const remove = useDeleteAccount();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const counts = settings.data?.counts;
  const fieldErrors =
    remove.error instanceof ApiRequestError ? remove.error.fieldErrors : undefined;

  function onDelete() {
    remove.mutate(
      { password, confirm: "DELETE" },
      {
        onSuccess: async () => {
          // The session is already gone server-side; clearing it locally stops
          // the app trying to use a token that no longer resolves.
          await signOut().catch(() => undefined);
          router.replace("/(auth)/sign-in");
        },
      },
    );
  }

  return (
    <Screen>
      <View
        style={{
          flexDirection: "row",
          gap: 10,
          padding: 14,
          borderRadius: 12,
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.expense,
        }}
      >
        <Ionicons name="warning-outline" size={20} color={theme.expense} />
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={{ color: theme.text, fontSize: 15, fontWeight: "700" }}>
            This cannot be undone
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 13, lineHeight: 19 }}>
            Deleting your account erases everything permanently — there is no soft delete and no
            recovery window. If you might want this data later, export it first.
          </Text>
        </View>
      </View>

      {counts ? (
        <View style={{ gap: 4 }}>
          <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: "600" }}>
            What will be erased
          </Text>
          {[
            [counts.transactions, "transactions"],
            [counts.accounts, "accounts"],
            [counts.categories, "categories"],
            [counts.budgets, "budgets"],
            [counts.goals, "savings goals"],
            [counts.recurring, "recurring rules"],
            [counts.exchangeRates, "exchange rates"],
          ].map(([count, label]) => (
            <Text key={String(label)} style={{ color: theme.textSubtle, fontSize: 13 }}>
              {count} {label}
            </Text>
          ))}
        </View>
      ) : null}

      <Field
        label="Your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        placeholder="Re-enter it to confirm it's you"
        hint="Being signed in isn't enough — an unlocked phone shouldn't be able to erase your finances."
        error={fieldErrors?.password?.[0]}
      />

      <Field
        label="Type DELETE"
        value={confirm}
        onChangeText={(value) => setConfirm(value.toUpperCase())}
        autoCapitalize="characters"
        autoCorrect={false}
        placeholder="DELETE"
      />

      {remove.isError && !fieldErrors ? (
        <Text style={{ color: theme.expense, fontSize: 13 }}>
          {remove.error instanceof Error
            ? remove.error.message
            : "Couldn't delete the account."}
        </Text>
      ) : null}

      <Button
        label="Permanently delete my account"
        onPress={onDelete}
        loading={remove.isPending}
        disabled={confirm !== "DELETE" || password.length === 0}
      />
    </Screen>
  );
}
