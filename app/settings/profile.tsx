import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";

import { Button } from "../../src/components/Button";
import { Field } from "../../src/components/Field";
import { Screen } from "../../src/components/Screen";
import { useSettings, useUpdateProfile } from "../../src/features/settings/queries";
import { ApiRequestError } from "../../src/lib/api";
import { useTheme } from "../../src/theme/tokens";

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const settings = useSettings();
  const update = useUpdateProfile();

  const [name, setName] = useState("");
  const seeded = useRef(false);

  // Seeded exactly once, when the server's value first arrives. Re-seeding on
  // every refetch would wipe whatever the user is halfway through typing —
  // including a deliberately cleared field.
  useEffect(() => {
    if (seeded.current || !settings.data) return;
    seeded.current = true;
    setName(settings.data.profile.name ?? "");
  }, [settings.data]);

  const fieldErrors =
    update.error instanceof ApiRequestError ? update.error.fieldErrors : undefined;

  function onSave() {
    update.mutate({ name: name.trim() }, { onSuccess: () => router.back() });
  }

  return (
    <Screen>
      <Field
        label="Name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        autoComplete="name"
        placeholder="Your name"
        error={fieldErrors?.name?.[0]}
      />

      <View style={{ gap: 4 }}>
        <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: "600" }}>Email</Text>
        <Text style={{ color: theme.text, fontSize: 16 }}>
          {settings.data?.profile.email ?? "—"}
        </Text>
{settings.data?.profile.emailVerified ? (
          <Text style={{ color: theme.income, fontSize: 13, fontWeight: "600" }}>Verified</Text>
        ) : settings.data ? (
          <Button
            label="Verify this email"
            variant="secondary"
            onPress={() => router.push("/settings/verify-email")}
          />
        ) : null}
        <Text style={{ color: theme.textSubtle, fontSize: 13, lineHeight: 19 }}>
          Your email is how you sign in and reset your password. It can&apos;t be changed here yet.
        </Text>
      </View>

      {update.isError && !fieldErrors ? (
        <Text style={{ color: theme.expense, fontSize: 13 }}>
          {update.error instanceof Error ? update.error.message : "Couldn't save."}
        </Text>
      ) : null}

      <Button
        label="Save"
        onPress={onSave}
        loading={update.isPending}
        disabled={name.trim().length === 0}
      />
    </Screen>
  );
}
