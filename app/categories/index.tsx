import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Button } from "../../src/components/Button";
import { EmptyState } from "../../src/components/EmptyState";
import { Screen } from "../../src/components/Screen";
import { useCategories, type Category } from "../../src/features/categories/queries";
import { useTheme } from "../../src/theme/tokens";

const LEGACY_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  "shopping-bag": "bag-handle-outline",
  "heart-pulse": "fitness-outline",
  "graduation-cap": "school-outline",
  user: "person-outline",
  "more-horizontal": "ellipsis-horizontal",
  coffee: "cafe-outline",
  truck: "car-outline",
  home: "home-outline",
  zap: "flash-outline",
};

function resolveIcon(iconName: string | null | undefined): keyof typeof Ionicons.glyphMap {
  if (!iconName) return "pricetag-outline";
  if (LEGACY_ICON_MAP[iconName]) return LEGACY_ICON_MAP[iconName];
  if (iconName in Ionicons.glyphMap) return iconName as keyof typeof Ionicons.glyphMap;
  return "pricetag-outline";
}

export default function CategoriesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data: categories, isPending, isError, error, refetch } = useCategories();

  if (isPending) {
    return (
      <Screen scroll={false}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={theme.brand} />
        </View>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <EmptyState
          icon="cloud-offline-outline"
          title="Couldn't load your categories"
          body={error instanceof Error ? error.message : "Something went wrong."}
          actionLabel="Try again"
          onAction={() => void refetch()}
        />
      </Screen>
    );
  }

  const expenses = categories.filter((c) => c.kind === "EXPENSE");
  const income = categories.filter((c) => c.kind === "INCOME");

  return (
    <Screen>
      <View style={{ gap: 4 }}>
        <Text style={{ color: theme.textSubtle, fontSize: 13, fontWeight: "600" }}>
          Organize your spending and income
        </Text>
      </View>

      {expenses.length > 0 && (
        <CategorySection title="Expenses" categories={expenses} theme={theme} router={router} />
      )}

      {income.length > 0 && (
        <CategorySection title="Income" categories={income} theme={theme} router={router} />
      )}

      {categories.length === 0 && (
        <EmptyState
          icon="pricetag-outline"
          title="No categories yet"
          body="Categories help you organize your transactions to see where your money is going."
          actionLabel="Add a category"
          onAction={() => router.push("/categories/new")}
        />
      )}

      {categories.length > 0 && (
        <Button label="Add a category" onPress={() => router.push("/categories/new")} />
      )}
    </Screen>
  );
}

function CategorySection({
  title,
  categories,
  theme,
  router,
}: {
  title: string;
  categories: Category[];
  theme: any;
  router: any;
}) {
  return (
    <View style={{ gap: 8, marginTop: 16 }}>
      <Text
        style={{
          color: theme.textSubtle,
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 0.8,
          textTransform: "uppercase",
        }}
      >
        {title}
      </Text>

      <View
        style={{
          backgroundColor: theme.surface,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: theme.border,
          overflow: "hidden",
        }}
      >
        {categories.map((cat, index) => (
          <Pressable
            key={cat.id}
            accessibilityRole="button"
            accessibilityLabel={`${cat.name} category`}
            onPress={() => router.push(`/categories/${cat.id}`)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderTopWidth: index === 0 ? 0 : 1,
              borderTopColor: theme.border,
            }}
          >
            <Ionicons
              name={resolveIcon(cat.icon)}
              size={20}
              color={cat.color ?? theme.textMuted}
            />
            <Text style={{ color: theme.text, fontSize: 15, fontWeight: "600", flex: 1 }}>
              {cat.name}
            </Text>
            <Ionicons name="chevron-forward" size={17} color={theme.textSubtle} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
