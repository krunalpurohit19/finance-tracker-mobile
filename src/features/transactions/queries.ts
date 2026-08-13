import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateTransactionInput } from "@finance/validation";

import { api } from "../../lib/api";
import { accountKeys } from "../accounts/queries";

export interface Transaction {
  id: string;
  type: "EXPENSE" | "INCOME" | "TRANSFER";
  amount: string;
  currency: string;
  baseAmount: string;
  baseCurrency: string;
  fxRate: string;
  accountId: string;
  accountName: string;
  transferAccountId: string | null;
  transferAccountName: string | null;
  transferAmount: string | null;
  transferCurrency: string | null;
  categoryId: string | null;
  categoryName: string | null;
  occurredOn: string;
  merchant: string | null;
  notes: string | null;
  source: string;
}

interface TransactionPage {
  items: Transaction[];
  nextCursor: string | null;
}

export interface Category {
  id: string;
  name: string;
  kind: "EXPENSE" | "INCOME";
  color: string | null;
  icon: string | null;
}

export const transactionKeys = {
  all: ["transactions"] as const,
};

export function useTransactions() {
  return useInfiniteQuery({
    queryKey: transactionKeys.all,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      api.get<TransactionPage>("/api/v1/transactions", {
        limit: "50",
        ...(pageParam ? { cursor: pageParam } : {}),
      }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

export function useCategories(kind?: "EXPENSE" | "INCOME") {
  return useQuery({
    queryKey: ["categories", { kind }],
    queryFn: () => api.get<Category[]>("/api/v1/categories", kind ? { kind } : undefined),
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTransactionInput) =>
      api.post<Transaction>("/api/v1/transactions", input),
    onSuccess: () => {
      // A transaction moves balances, so account data is stale too.
      void queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      void queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<{ id: string }>(`/api/v1/transactions/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      void queryClient.invalidateQueries({ queryKey: accountKeys.all });
    },
  });
}
