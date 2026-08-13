import { forwardRef } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";

import { useTheme } from "../theme/tokens";

interface FieldProps extends TextInputProps {
  label: string;
  error?: string | undefined;
  hint?: string;
}

export const Field = forwardRef<TextInput, FieldProps>(function Field(
  { label, error, hint, ...inputProps },
  ref,
) {
  const theme = useTheme();
  const invalid = Boolean(error);

  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: "600" }}>{label}</Text>

      <TextInput
        ref={ref}
        accessibilityLabel={label}
        // Errors are announced, not just coloured — colour alone is not a
        // signal for screen readers or in bright sunlight.
        accessibilityHint={error ?? hint}
        placeholderTextColor={theme.textSubtle}
        style={{
          borderWidth: 1,
          borderColor: invalid ? theme.expense : theme.border,
          backgroundColor: theme.surface,
          borderRadius: 11,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 16,
          color: theme.text,
        }}
        {...inputProps}
      />

      {error ? (
        <Text style={{ color: theme.expense, fontSize: 13 }}>{error}</Text>
      ) : hint ? (
        <Text style={{ color: theme.textSubtle, fontSize: 13 }}>{hint}</Text>
      ) : null}
    </View>
  );
});
