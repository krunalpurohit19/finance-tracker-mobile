import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { signUpSchema } from "@finance/validation";

import { Button } from "../../src/components/Button";
import { Field } from "../../src/components/Field";
import { Screen } from "../../src/components/Screen";
import { signUp } from "../../src/lib/auth-client";
import { useTheme } from "../../src/theme/tokens";

export default function SignUpScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    setFormError(null);

    const parsed = signUpSchema.safeParse({ name, email, password });
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
    setSubmitting(true);

    const { error } = await signUp.email({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
    });

    setSubmitting(false);

    if (error) {
      setFormError(
        error.status === 422 || error.status === 400
          ? "We couldn't create that account. It may already exist."
          : "Something went wrong. Please try again.",
      );
      return;
    }

    router.replace("/(tabs)");
  }

  return (
    <Screen
      footer={
        <View style={{ gap: 12, paddingTop: 8 }}>
          <Button label="Create account" onPress={onSubmit} loading={submitting} />
          <Button 
            label="Sign in" 
            variant="secondary"
            onPress={() => router.replace("/(auth)/sign-in")}
            disabled={submitting}
          />
        </View>
      }
    >
      <View style={{ gap: 6, paddingTop: 24, paddingBottom: 8 }}>
        <Text style={{ color: theme.text, fontSize: 28, fontWeight: "700" }}>
          Create your account
        </Text>
        <Text style={{ color: theme.textMuted, fontSize: 15 }}>
          Your financial data stays private to you.
        </Text>
      </View>

      <Field
        label="Name"
        value={name}
        onChangeText={setName}
        error={fieldErrors.name}
        placeholder="Your name"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
      />

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
      />

      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        error={fieldErrors.password}
        hint="At least 10 characters. Length matters more than symbols."
        placeholder="Choose a password"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        onSubmitEditing={onSubmit}
        returnKeyType="go"
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
