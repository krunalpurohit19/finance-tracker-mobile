import { useState } from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useTheme } from "../../theme/tokens";

/**
 * A small trend line with no axes. Shape only: the caller prints the current
 * value and the change as text, so the line is hidden from screen readers.
 * `values` are used for pixel positions only, never shown or added up.
 */
export function Sparkline({
  values,
  height = 44,
  color,
}: {
  values: number[];
  height?: number;
  color?: string;
}) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);

  let d = "";
  if (width > 0 && values.length > 1) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1; // a flat series draws a flat line mid-height
    const pad = 3;
    d = values
      .map((v, i) => {
        const x = (i / (values.length - 1)) * width;
        const y = max === min ? height / 2 : pad + (1 - (v - min) / span) * (height - pad * 2);
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={{ height }}
    >
      {d ? (
        <Svg width={width} height={height}>
          <Path
            d={d}
            stroke={color ?? theme.brand}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      ) : null}
    </View>
  );
}
