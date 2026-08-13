import { useColorScheme } from "react-native";

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
};

export function useTheme(): Theme {
  return useColorScheme() === "dark" ? darkTheme : lightTheme;
}

export { lightTheme, darkTheme };
