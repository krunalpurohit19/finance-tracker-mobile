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
        // Indigo, mirroring src/theme/tokens.ts. Deliberately NOT green:
        // semantic income/expense colour must stay distinguishable from brand.
        brand: {
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          soft: "#ECEBFD",
          "soft-dark": "#24264A",
        },
        fill: { DEFAULT: "#EEF2F2", dark: "#1E282A" },
        // Chart colours by rank; 6 is "Others".
        cat: {
          1: "#2F6FDF",
          2: "#38A9C9",
          3: "#2E9E6A",
          4: "#E08A1E",
          5: "#8B6CEF",
          6: "#A3AFB0",
        },
        // Semantic financial states. Each has a light- and dark-ground variant
        // so contrast holds in both themes.
        income: { light: "#1B7F4F", dark: "#3FB07A" },
        expense: { light: "#B23B32", dark: "#E8756A" },
        warning: { light: "#B0741C", dark: "#E3A54B" },
      },
      borderRadius: { sm: "10px", md: "14px", lg: "20px" },
      fontSize: { hero: "38px", title: "22px", amount: "17px", body: "15px", label: "12.5px" },
      fontVariantNumeric: {
        tabular: "tabular-nums",
      },
    },
  },
  plugins: [],
};
