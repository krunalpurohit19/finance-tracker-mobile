import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "../../lib/api";

export interface Settings {
  profile: { id: string; name: string | null; email: string; createdAt: string };
  preferences: {
    baseCurrency: string;
    locale: string;
    timezone: string;
    dateFormat: string;
    theme: string;
    weekStartsOn: number;
  };
  counts: {
    accounts: number;
    categories: number;
    transactions: number;
    budgets: number;
    goals: number;
    recurring: number;
    exchangeRates: number;
  };
}

export interface PreferencesInput {
  locale?: string;
  timezone?: string;
  dateFormat?: string;
  theme?: string;
  weekStartsOn?: number;
}

export const settingsKeys = {
  root: ["settings"] as const,
};

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.root,
    queryFn: () => api.get<Settings>("/api/v1/settings"),
  });
}

/**
 * Preferences reach into every screen — the base currency labels every amount,
 * the timezone decides what "this month" means. So a successful save clears
 * the whole cache rather than one key: a stale dashboard showing last
 * timezone's month boundary is exactly the bug this avoids.
 */
function useSettingsMutation<TInput, TOutput>(
  mutationFn: (input: TInput) => Promise<TOutput>,
  { invalidateEverything = false } = {},
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      if (invalidateEverything) void queryClient.invalidateQueries();
      else void queryClient.invalidateQueries({ queryKey: settingsKeys.root });
    },
  });
}

export function useUpdateProfile() {
  return useSettingsMutation((input: { name: string }) =>
    api.patch<Settings>("/api/v1/settings/profile", input),
  );
}

export function useUpdatePreferences() {
  return useSettingsMutation(
    (input: PreferencesInput) => api.patch<Settings>("/api/v1/settings/preferences", input),
    { invalidateEverything: true },
  );
}

export interface BaseCurrencyChange {
  from: string;
  to: string;
  repriced: number;
}

export function useChangeBaseCurrency() {
  return useSettingsMutation(
    (input: { baseCurrency: string; confirm: string }) =>
      api.post<BaseCurrencyChange>("/api/v1/settings/base-currency", input),
    { invalidateEverything: true },
  );
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: (input: { password: string; confirm: "DELETE" }) =>
      api.post<{ deleted: true }>("/api/v1/settings/delete-account", input),
  });
}

export interface ImportPreview {
  totalRows: number;
  valid: number;
  invalid: number;
  issues: { row: number; field: string; message: string }[];
  unknownAccounts: string[];
  unknownCategories: string[];
  possibleDuplicates: number[];
  applied: false;
}

export function useImportPreview() {
  return useMutation({
    mutationFn: (rows: Record<string, unknown>[]) =>
      api.post<ImportPreview>("/api/v1/settings/import/preview", { rows }),
  });
}
