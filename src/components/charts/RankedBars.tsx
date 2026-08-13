import { Text, View } from "react-native";
import { money } from "@finance/domain";

import { Amount } from "../Amount";
import { useTheme } from "../../theme/tokens";

export interface RankedRow {
  key: string;
  label: string;
  value: string;
  /** 0–100. Supplied rather than derived so it matches the server's figure. */
  share: number;
  color?: string | null;
}

/**
 * Horizontal ranked bars.
 *
 * Chosen over a donut because the job is ranking and comparison, which
 * position and length do far better than angle. A donut only earns its place
 * when part-to-whole composition is genuinely the question.
 *
 * The bar never carries information alone: every row shows its name, its
 * percentage and its amount as text.
 */
export function RankedBars({
  rows,
  currency,
  maxRows = 6,
}: {
  rows: RankedRow[];
  currency: string;
  maxRows?: number;
}) {
  const theme = useTheme();
  const visible = rows.slice(0, maxRows);

  if (visible.length === 0) {
    return (
      <Text style={{ color: theme.textSubtle, fontSize: 13 }}>
        Nothing recorded in this range.
      </Text>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      {visible.map((row) => (
        <View key={row.key} style={{ gap: 5 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
            <Text style={{ color: theme.text, fontSize: 14, flex: 1 }} numberOfLines={1}>
              {row.label}
            </Text>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "baseline" }}>
              <Text
                style={{ color: theme.textSubtle, fontSize: 12, fontVariant: ["tabular-nums"] }}
              >
                {row.share.toFixed(0)}%
              </Text>
              <Amount value={money(row.value)} currency={currency} size="sm" tone="neutral" />
            </View>
          </View>

          <View style={{ height: 6, borderRadius: 3, backgroundColor: theme.surfaceElevated }}>
            <View
              style={{
                height: 6,
                borderRadius: 3,
                width: `${Math.max(2, Math.min(100, row.share))}%`,
                backgroundColor: row.color ?? theme.brand,
              }}
            />
          </View>
        </View>
      ))}

      {rows.length > maxRows ? (
        <Text style={{ color: theme.textSubtle, fontSize: 12 }}>
          +{rows.length - maxRows} more
        </Text>
      ) : null}
    </View>
  );
}
