import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { signInSchema } from "@finance/validation";

import { Button } from "../../src/components/Button";
import { Field } from "../../src/components/Field";
import { Screen } from "../../src/components/Screen";
import { signIn } from "../../src/lib/auth-client";
import { useTheme } from "../../src/theme/tokens";

export default function SignInScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    setFormError(null);

    const parsed = signInSchema.safeParse({ email, password });
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

    const { error } = await signIn.email({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    setSubmitting(false);

    if (error) {
      // Deliberately does not distinguish "no such account" from "wrong
      // password" — that difference lets someone enumerate who has an account.
      setFormError("That email and password don't match. Please try again.");
      return;
    }

    router.replace("/(tabs)");
  }

  return (
    <Screen
      footer={
        <View style={{ gap: 12, paddingTop: 8 }}>
          <Button label="Sign in" onPress={onSubmit} loading={submitting} />
          <Button 
            label="Create an account" 
            variant="secondary"
            onPress={() => router.replace("/(auth)/sign-up")}
            disabled={submitting}
          />
        </View>
      }
    >
      <View style={{ gap: 6, paddingTop: 24, paddingBottom: 8 }}>
        <Text style={{ color: theme.text, fontSize: 28, fontWeight: "700" }}>Welcome back</Text>
        <Text style={{ color: theme.textMuted, fontSize: 15 }}>
          Sign in to pick up where you left off.
        </Text>
      </View>

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
        placeholder="Your password"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
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
