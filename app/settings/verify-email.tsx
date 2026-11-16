import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "../../src/components/Button";
import { Field } from "../../src/components/Field";
import { Screen } from "../../src/components/Screen";
import { useSettings } from "../../src/features/settings/queries";
import { ApiRequestError, api } from "../../src/lib/api";
import { useTheme } from "../../src/theme/tokens";

/** Confirms the sign-in email with a 6-digit code. A code is sent when the screen opens. */
export default function VerifyEmailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const settings = useSettings();
  const [code, setCode] = useState("");

  const send = useMutation({
    mutationFn: () => api.post<{ sent: boolean }>("/api/v1/me/verify-email/send"),
  });
  const verify = useMutation({
    mutationFn: () => api.post<{ done: boolean }>("/api/v1/me/verify-email", { code: code.trim() }),
    onSuccess: () => {
      void queryClient.invalidateQueries();
      router.back();
    },
  });

  const sentOnce = useRef(false);
  useEffect(() => {
    if (sentOnce.current) return;
    sentOnce.current = true;
    send.mutate();
  }, [send]);

  const codeError =
    verify.error instanceof ApiRequestError
      ? (verify.error.fieldErrors?.code?.[0] ?? verify.error.message)
      : undefined;

  return (
    <Screen
      footer={
        <View style={{ gap: 12, paddingTop: 8 }}>
          <Button
            label="Verify"
            onPress={() => verify.mutate()}
            loading={verify.isPending}
            disabled={code.trim().length !== 6}
          />
          <Button
            label="Send a new code"
            variant="secondary"
            onPress={() => send.mutate()}
            disabled={send.isPending}
          />
        </View>
      }
    >
      <Text style={{ color: theme.textMuted, fontSize: 15, lineHeight: 22 }}>
        We sent a 6-digit code to {settings.data?.profile.email ?? "your email"}. It works for 15
        minutes.
      </Text>
      <Field
        label="6-digit code"
        value={code}
        onChangeText={setCode}
        error={codeError}
        placeholder="123456"
        keyboardType="number-pad"
        maxLength={6}
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
      />
      {send.isError ? (
        <Text style={{ color: theme.expense, fontSize: 14 }}>
          Couldn&apos;t send the code. Check your connection and try again.
        </Text>
      ) : null}
    </Screen>
  );
}
