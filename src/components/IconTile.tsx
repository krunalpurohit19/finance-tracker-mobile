import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { useTheme } from "../theme/tokens";

/** A rounded square holding one icon: the leading mark of a row or tile. */
export function IconTile({
  icon,
  color,
  background,
  size = 36,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  background?: string;
  size?: number;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.3),
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: background ?? theme.fill,
      }}
    >
      <Ionicons name={icon} size={Math.round(size / 2)} color={color ?? theme.textMuted} />
    </View>
  );
}
