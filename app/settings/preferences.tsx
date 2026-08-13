import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DATE_FORMATS, LOCALES, THEMES } from "@finance/validation";

import { Card } from "../../src/components/Card";
import { Screen } from "../../src/components/Screen";
import {
  useSettings,
  useUpdatePreferences,
  type PreferencesInput,
} from "../../src/features/settings/queries";
import { useTheme } from "../../src/theme/tokens";

/**
 * A short, curated list rather than every IANA zone.
 *
 * The timezone decides what "today" and "this month" mean, so it has to be
 * right — but a 400-entry picker on a phone is how it ends up wrong. These
 * cover the locales the currency list serves; the API accepts any valid IANA
 * zone, so widening this is a one-line change when someone needs it.
 */
const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
  "UTC",
] as const;

const WEEKDAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 6, label: "Saturday" },
] as const;

export default function PreferencesScreen() {
  const theme = useTheme();
  const settings = useSettings();
  const update = useUpdatePreferences();

  if (settings.isPending) {
    return (
      <Screen scroll={false}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={theme.brand} />
        </View>
      </Screen>
    );
  }

  const preferences = settings.data?.preferences;
  if (!preferences) {
    return (
      <Screen>
        <Text style={{ color: theme.textMuted }}>Couldn&apos;t load your preferences.</Text>
      </Screen>
    );
  }

  const save = (input: PreferencesInput) => update.mutate(input);

  return (
    <Screen>
      <Card eyebrow="Theme" title="Appearance">
        <Choices
          options={THEMES.map((value) => ({
            value,
            label: value.charAt(0) + value.slice(1).toLowerCase(),
          }))}
          selected={preferences.theme}
          onSelect={(theme) => save({ theme })}
        />
      </Card>

      <Card eyebrow="Dates" title="Date format">
        <Choices
          options={DATE_FORMATS.map((value) => ({ value, label: value }))}
          selected={preferences.dateFormat}
          onSelect={(dateFormat) => save({ dateFormat })}
        />
      </Card>

      <Card eyebrow="Numbers" title="Locale">
        <Text style={{ color: theme.textSubtle, fontSize: 13 }}>
          Decides how amounts are grouped — ₹1,00,000 in en-IN, ₹100,000 elsewhere.
        </Text>
        <Choices
          options={LOCALES.map((value) => ({ value, label: value }))}
          selected={preferences.locale}
          onSelect={(locale) => save({ locale })}
        />
      </Card>

      <Card eyebrow="Periods" title="Timezone">
        <Text style={{ color: theme.textSubtle, fontSize: 13, lineHeight: 19 }}>
          Decides what &quot;today&quot; and &quot;this month&quot; mean. Changing it moves
          period boundaries on every screen — it does not move any transaction you have already
          recorded.
        </Text>
        <Choices
          options={TIMEZONES.map((value) => ({ value, label: value }))}
          selected={preferences.timezone}
          onSelect={(timezone) => save({ timezone })}
        />
      </Card>

      <Card eyebrow="Calendar" title="Week starts on">
        <Choices
          options={WEEKDAYS.map((d) => ({ value: String(d.value), label: d.label }))}
          selected={String(preferences.weekStartsOn)}
          onSelect={(value) => save({ weekStartsOn: Number(value) })}
        />
      </Card>

      {update.isError ? (
        <Text style={{ color: theme.expense, fontSize: 13 }}>
          {update.error instanceof Error ? update.error.message : "Couldn't save."}
        </Text>
      ) : null}

      <Text style={{ color: theme.textSubtle, fontSize: 12, lineHeight: 18 }}>
        Changes save immediately.
      </Text>
    </Screen>
  );
}

/**
 * A radio group as wrapping chips.
 *
 * The selection carries a checkmark as well as a fill, so which option is
 * active never depends on colour alone.
 */
function Choices({
  options,
  selected,
  onSelect,
}: {
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="radiogroup"
      style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
    >
      {options.map((option) => {
        const active = option.value === selected;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
            onPress={() => onSelect(option.value)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: active ? theme.brand : theme.surfaceElevated,
              borderWidth: 1,
              borderColor: active ? theme.brand : theme.border,
            }}
          >
            {active ? <Ionicons name="checkmark" size={14} color={theme.onBrand} /> : null}
            <Text
              style={{
                color: active ? theme.onBrand : theme.textMuted,
                fontSize: 13,
                fontWeight: "600",
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
