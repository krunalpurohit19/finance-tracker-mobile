import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { useTheme } from "../theme/tokens";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"] as const;

/**
 * The next value after a key press, or the same value if the key isn't allowed.
 * Mirrors what the server accepts: up to 14 integer digits and 4 decimals.
 */
export function pressKey(value: string, key: (typeof KEYS)[number]): string {
  if (key === "back") return value.slice(0, -1);
  if (key === ".") return value.includes(".") ? value : value === "" ? "0." : `${value}.`;
  const [whole = "", fraction] = value.split(".");
  if (fraction !== undefined) return fraction.length >= 4 ? value : value + key;
  if (whole === "0") return key; // no leading zeros
  return whole.length >= 14 ? value : value + key;
}

/**
 * A big amount and its own numeric keypad, so entry never waits for (or is
 * covered by) the system keyboard. `value` is a plain decimal string.
 */
export function AmountInput({
  value,
  onChange,
  currency,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  currency: string;
  error?: string | undefined;
}) {
  const theme = useTheme();
  const [whole = "", fraction] = value.split(".");

  return (
    <View style={{ gap: 12 }}>
      <View
        accessible
        accessibilityLabel={`Amount: ${value === "" ? "0" : value} ${currency}`}
        accessibilityLiveRegion="polite"
        style={{ alignItems: "center", paddingVertical: 8, gap: 4 }}
      >
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1.3}
          style={{
            color: value === "" ? theme.textSubtle : theme.text,
            fontSize: 44,
            fontWeight: "600",
            letterSpacing: -1,
            fontVariant: ["tabular-nums"],
          }}
        >
          <Text style={{ color: theme.textSubtle, fontSize: 22 }}>{currency} </Text>
          {whole === "" ? "0" : whole}
          {fraction !== undefined ? (
            <Text style={{ color: theme.textSubtle }}>.{fraction}</Text>
          ) : null}
        </Text>
        {error ? <Text style={{ color: theme.expense, fontSize: 13 }}>{error}</Text> : null}
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 8 }}>
        {KEYS.map((key) => (
          <View key={key} style={{ width: "33.333%", paddingHorizontal: 4 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={key === "back" ? "Delete" : key === "." ? "Decimal point" : key}
              onPress={() => onChange(pressKey(value, key))}
              onLongPress={key === "back" ? () => onChange("") : undefined}
              style={({ pressed }) => ({
                height: 52,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: pressed ? theme.fill : theme.surface,
              })}
            >
              {key === "back" ? (
                <Ionicons name="backspace-outline" size={24} color={theme.text} />
              ) : (
                <Text
                  maxFontSizeMultiplier={1.3}
                  style={{ color: theme.text, fontSize: 22, fontWeight: "500" }}
                >
                  {key}
                </Text>
              )}
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

if (__DEV__) {
  // The one check the keypad's rules leave behind.
  const typed = (keys: string) =>
    [...keys].reduce((v, k) => pressKey(v, (k === "<" ? "back" : k) as (typeof KEYS)[number]), "");
  console.assert(typed("007") === "7", "leading zeros collapse");
  console.assert(typed(".5") === "0.5", "a leading point gets its zero");
  console.assert(typed("1.234567") === "1.2345", "four decimals at most");
  console.assert(typed("1..2") === "1.2", "one decimal point");
  console.assert(typed("12<") === "1", "delete removes one character");
  console.assert(typed("123456789012345") === "12345678901234", "fourteen integer digits");
}
