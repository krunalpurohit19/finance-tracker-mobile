/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Neutrals carry a slight blue-green bias so they read as chosen
        // rather than as default grey, and sit calmly under the teal brand.
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
        // Brand is deliberately NOT green: semantic income/expense colour must
        // stay distinguishable from brand colour (§17 of the plan).
        brand: {
          400: "#21897F",
          500: "#0E6E66",
          600: "#0B574F",
          700: "#084039",
        },
        // Semantic financial states. Each has a light- and dark-ground variant
        // so contrast holds in both themes.
        income: { light: "#1B7F4F", dark: "#3FB07A" },
        expense: { light: "#B23B32", dark: "#E8756A" },
        warning: { light: "#B0741C", dark: "#E3A54B" },
      },
      fontVariantNumeric: {
        tabular: "tabular-nums",
      },
    },
  },
  plugins: [],
};
