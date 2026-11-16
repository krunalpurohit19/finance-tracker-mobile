import type { ReactNode } from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useTheme } from "../../theme/tokens";

export interface GaugeSegment {
  key: string;
  /** Any non-negative weight; segments are sized relative to their sum. */
  share: number;
  color: string;
}

const W = 200;
const H = 108;
const R = 84;
const STROKE = 18;
const CX = W / 2;
const CY = 100;

/** A point on the half circle; t runs 0 (left) → 1 (right) over the top. */
function at(t: number): string {
  const angle = Math.PI * t;
  return `${(CX - R * Math.cos(angle)).toFixed(2)} ${(CY - R * Math.sin(angle)).toFixed(2)}`;
}

function arc(from: number, to: number): string {
  return `M ${at(from)} A ${R} ${R} 0 0 1 ${at(to)}`;
}

/**
 * A half-circle showing how a total splits. It answers "how is it split?" at
 * a glance and nothing more: the caller prints every segment's name, share
 * and amount as text below, so the arc is hidden from screen readers.
 */
export function SemiGauge({ segments, children }: { segments: GaugeSegment[]; children?: ReactNode }) {
  const theme = useTheme();
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.share), 0);
  const gap = segments.length > 1 ? 0.012 : 0;

  let cursor = 0;
  const arcs = segments
    .filter((s) => s.share > 0 && total > 0)
    .map((s) => {
      const from = cursor;
      cursor += s.share / total;
      // Keep a visible sliver even when the gap would swallow a tiny share.
      const to = Math.max(from + 0.004, Math.min(1, cursor) - gap);
      return { key: s.key, color: s.color, d: arc(from, to) };
    });

  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ width: "100%", maxWidth: 300, aspectRatio: W / H }}>
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${W} ${H}`}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          <Path d={arc(0, 1)} stroke={theme.fill} strokeWidth={STROKE} strokeLinecap="round" fill="none" />
          {arcs.map((a) => (
            <Path key={a.key} d={a.d} stroke={a.color} strokeWidth={STROKE} fill="none" />
          ))}
        </Svg>
        <View
          style={{ position: "absolute", left: 0, right: 0, bottom: 0, alignItems: "center", gap: 2 }}
        >
          {children}
        </View>
      </View>
    </View>
  );
}
