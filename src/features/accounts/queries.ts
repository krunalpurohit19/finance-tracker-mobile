import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateAccountInput } from "@finance/validation";

import { api } from "../../lib/api";

/** Mirrors AccountDto on the server. Money is always a string. */
export interface Account {
  id: string;
  name: string;
  type: string;
  class: "ASSET" | "LIABILITY";
  currency: string;
  openingBalance: string;
  balance: string;
  institution: string | null;
  last4: string | null;
  color: string | null;
  icon: string | null;
  isDefault: boolean;
  sortOrder: number;
  archived: boolean;
}

export const accountKeys = {
  all: ["accounts"] as const,
  list: (includeArchived: boolean) => ["accounts", { includeArchived }] as const,
};

export function useAccounts(includeArchived = false) {
  return useQuery({
    queryKey: accountKeys.list(includeArchived),
    queryFn: () => api.get<Account[]>("/api/v1/accounts", { includeArchived }),
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAccountInput) => api.post<Account>("/api/v1/accounts", input),
    onSuccess: () => {
      // Balances and net worth both derive from accounts, so invalidate the
      // whole branch rather than trying to patch the cache by hand.
      void queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
}

export function useArchiveAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.post<Account>(`/api/v1/accounts/${id}/archive`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
}
