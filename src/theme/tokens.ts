import { useColorScheme, type TextStyle, type ViewStyle } from "react-native";
import { useSettings } from "../features/settings/queries";

/**
 * Design tokens in TypeScript, for the places Tailwind classes cannot reach:
 * React Navigation's tab/header colours, status bar, and chart props.
 *
 * These mirror tailwind.config.js. If a value changes there, change it here.
 */

export const palette = {
  ink: {
    50: "#F6F8F8",
    100: "#EDF1F1",
    200: "#DDE4E4",
    300: "#C2CDCD",
    400: "#93A2A3",
    500: "#6B7A7B",
    600: "#4E5B5C",
    700: "#3A4546",
    800: "#232C2E",
    900: "#151C1E",
    950: "#0B0F11",
  },
  brand: {
    400: "#818CF8", // Vibrant Indigo 400
    500: "#6366F1", // Vibrant Indigo 500
    600: "#4F46E5", // Vibrant Indigo 600
    700: "#4338CA", // Vibrant Indigo 700
  },
  income: { light: "#1B7F4F", dark: "#3FB07A" },
  expense: { light: "#B23B32", dark: "#E8756A" },
  warning: { light: "#B0741C", dark: "#E3A54B" },
  white: "#FFFFFF",

  // Redesign additions (UI Direction): a soft fill for tracks and segmented
  // controls, a tinted brand surface, and soft grounds for status pills.
  fill: { light: "#EEF2F2", dark: "#1E282A" },
  brandSoft: { light: "#ECEBFD", dark: "#24264A" },
  cardBorderDark: "#263133",
  incomeSoft: { light: "#E3F3EA", dark: "#12281E" },
  expenseSoft: { light: "#FBE9E7", dark: "#321A17" },
  warningSoft: { light: "#FBF0DC", dark: "#2E2311" },

  /**
   * Category colours for charts, assigned by RANK (biggest first), not by
   * category: neighbours differ in hue and lightness. Index 5 is "Others".
   */
  category: {
    light: ["#2F6FDF", "#38A9C9", "#2E9E6A", "#E08A1E", "#8B6CEF", "#A3AFB0"],
    dark: ["#5B93F0", "#5CC3DE", "#4CBF88", "#EBA347", "#A58DF5", "#6E7E80"],
  },

  /**
   * Chart series colours — deliberately NOT the green/red used for amounts.
   *
   * Green vs red is the conventional finance pairing, but it is close to
   * invisible under deuteranopia: validated at ΔE 4.7 (light) and 4.5 (dark),
   * far below the ΔE 8 floor. In a chart, colour is the identity channel and
   * the two series sit side by side, so that failure actually costs meaning.
   *
   * This blue/orange pair validates at ΔE 20+ under protanopia and passes
   * lightness, chroma and contrast in both themes. Green/red stays on single
   * amounts, where nothing is being compared and a +/- glyph already carries
   * the direction.
   */
  chart: {
    incomeSeries: { light: "#1F6FB2", dark: "#3E8CC7" },
    expenseSeries: { light: "#C1600F", dark: "#C97C3A" },
  },
} as const;

export interface Theme {
  scheme: "light" | "dark";
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  brand: string;
  onBrand: string;
  income: string;
  expense: string;
  warning: string;
  chartIncome: string;
  chartExpense: string;
  /** Tracks, segmented-control ground, icon tiles. */
  fill: string;
  brandSoft: string;
  incomeSoft: string;
  expenseSoft: string;
  warningSoft: string;
  /** The floating add button: ink on light, near-white on dark. */
  fab: string;
  onFab: string;
  /** Rank-ordered chart colours; the last one is "Others". */
  category: readonly string[];
  /** Spread onto a card: soft shadow and no border in light, hairline in dark. */
  card: ViewStyle;
}

const lightTheme: Theme = {
  scheme: "light",
  background: palette.ink[50],
  surface: palette.white,
  surfaceElevated: palette.white,
  border: palette.ink[200],
  text: palette.ink[900],
  textMuted: palette.ink[600],
  textSubtle: palette.ink[500],
  brand: palette.brand[600], // Richer indigo for light mode
  onBrand: palette.white,
  income: palette.income.light,
  expense: palette.expense.light,
  warning: palette.warning.light,
  chartIncome: palette.chart.incomeSeries.light,
  chartExpense: palette.chart.expenseSeries.light,
  fill: palette.fill.light,
  brandSoft: palette.brandSoft.light,
  incomeSoft: palette.incomeSoft.light,
  expenseSoft: palette.expenseSoft.light,
  warningSoft: palette.warningSoft.light,
  fab: palette.ink[900],
  onFab: palette.white,
  category: palette.category.light,
  card: {
    backgroundColor: palette.white,
    borderRadius: 20,
    shadowColor: palette.ink[900],
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
};

const darkTheme: Theme = {
  scheme: "dark",
  background: palette.ink[950],
  surface: palette.ink[900],
  surfaceElevated: palette.ink[800],
  border: palette.ink[800],
  text: palette.ink[50],
  textMuted: palette.ink[300],
  textSubtle: palette.ink[400],
  brand: palette.brand[500], // Brighter indigo for dark mode
  onBrand: palette.white, // White text stands out better on colorful buttons in dark mode than black text
  income: palette.income.dark,
  expense: palette.expense.dark,
  warning: palette.warning.dark,
  chartIncome: palette.chart.incomeSeries.dark,
  chartExpense: palette.chart.expenseSeries.dark,
  fill: palette.fill.dark,
  brandSoft: palette.brandSoft.dark,
  incomeSoft: palette.incomeSoft.dark,
  expenseSoft: palette.expenseSoft.dark,
  warningSoft: palette.warningSoft.dark,
  fab: palette.ink[50],
  onFab: palette.ink[950],
  category: palette.category.dark,
  // Shadows vanish on dark grounds, so dark cards keep a hairline instead.
  card: {
    backgroundColor: palette.ink[900],
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.cardBorderDark,
  },
};

export const radius = { sm: 10, md: 14, lg: 20, full: 999 } as const;
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32 } as const;

/** Type scale. System font; every amount uses tabular figures. */
export const type = {
  hero: { fontSize: 38, fontWeight: "600", letterSpacing: -1, fontVariant: ["tabular-nums"] },
  title: { fontSize: 22, fontWeight: "600" },
  amount: { fontSize: 17, fontWeight: "600", fontVariant: ["tabular-nums"] },
  body: { fontSize: 15 },
  label: { fontSize: 12.5, fontWeight: "500" },
} as const satisfies Record<string, TextStyle>;

export function useTheme(): Theme {
  const scheme = useColorScheme();
  const { data: settings } = useSettings();
  
  const pref = settings?.preferences?.theme || "SYSTEM";
  
  if (pref === "LIGHT") return lightTheme;
  if (pref === "DARK") return darkTheme;
  return scheme === "dark" ? darkTheme : lightTheme;
}

export { lightTheme, darkTheme };
