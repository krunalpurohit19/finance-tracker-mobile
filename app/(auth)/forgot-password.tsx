import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { email as emailSchema, resetPasswordSchema } from "@finance/validation";

import { Button } from "../../src/components/Button";
import { Field } from "../../src/components/Field";
import { Screen } from "../../src/components/Screen";
import { forgotPassword, resetPassword } from "../../src/lib/auth-client";
import { useTheme } from "../../src/theme/tokens";

/**
 * Two steps on one screen: ask for the email, then the emailed 6-digit code
 * and a new password. The first step answers the same whether or not the
 * address has an account, so this screen can't be used to find out who does.
 */
export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [step, setStep] = useState<"email" | "code" | "done">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function sendCode() {
    setFormError(null);
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setFieldErrors({ email: parsed.error.issues[0]?.message ?? "Enter a valid email address" });
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    const { error } = await forgotPassword(parsed.data);
    setSubmitting(false);
    if (error) {
      setFormError(error.message ?? "Something went wrong. Please try again.");
      return;
    }
    setEmail(parsed.data);
    setStep("code");
  }

  async function setNewPassword() {
    setFormError(null);
    const parsed = resetPasswordSchema.safeParse({ email, code, password });
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) errors[String(issue.path[0] ?? "_form")] ??= issue.message;
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    const { error } = await resetPassword(parsed.data);
    setSubmitting(false);
    if (error) {
      const serverFields: Record<string, string[]> = error.fieldErrors ?? {};
      const mapped: Record<string, string> = {};
      for (const [key, messages] of Object.entries(serverFields)) {
        if (messages[0]) mapped[key] = messages[0];
      }
      setFieldErrors(mapped);
      if (Object.keys(mapped).length === 0) {
        setFormError(error.message ?? "Something went wrong. Please try again.");
      }
      return;
    }
    setStep("done");
  }

  const footer =
    step === "email" ? (
      <Button label="Email me a code" onPress={sendCode} loading={submitting} />
    ) : step === "code" ? (
      <View style={{ gap: 12 }}>
        <Button label="Set new password" onPress={setNewPassword} loading={submitting} />
        <Button label="Send a new code" variant="secondary" onPress={sendCode} disabled={submitting} />
      </View>
    ) : (
      <Button label="Sign in" onPress={() => router.replace("/(auth)/sign-in")} />
    );

  return (
    <Screen footer={<View style={{ paddingTop: 8 }}>{footer}</View>}>
      <View style={{ gap: 6, paddingTop: 24, paddingBottom: 8 }}>
        <Text style={{ color: theme.text, fontSize: 28, fontWeight: "700" }}>
          {step === "done" ? "Password changed" : "Reset your password"}
        </Text>
        <Text style={{ color: theme.textMuted, fontSize: 15, lineHeight: 22 }}>
          {step === "email"
            ? "Enter your email and we'll send you a 6-digit code."
            : step === "code"
              ? `If ${email} has an account, a code is on its way. It works for 15 minutes.`
              : "You've been signed out on every device. Sign in with your new password."}
        </Text>
      </View>

      {step === "email" ? (
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          error={fieldErrors.email}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          autoCorrect={false}
          onSubmitEditing={sendCode}
          returnKeyType="send"
        />
      ) : null}

      {step === "code" ? (
        <>
          <Field
            label="6-digit code"
            value={code}
            onChangeText={setCode}
            error={fieldErrors.code}
            placeholder="123456"
            keyboardType="number-pad"
            maxLength={6}
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
          />
          <Field
            label="New password"
            value={password}
            onChangeText={setPassword}
            error={fieldErrors.password}
            placeholder="At least 10 characters"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            onSubmitEditing={setNewPassword}
            returnKeyType="go"
          />
        </>
      ) : null}

      {formError ? (
        <View style={{ padding: 12, borderRadius: 10, backgroundColor: theme.expenseSoft }}>
          <Text style={{ color: theme.expense, fontSize: 14 }}>{formError}</Text>
        </View>
      ) : null}
    </Screen>
  );
}
