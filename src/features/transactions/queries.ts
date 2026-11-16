import { useRef } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateTransactionInput } from "@finance/validation";

import { api } from "../../lib/api";

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

const newIdempotencyKey = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  // One key per transaction being entered: if a save times out and is tried
  // again, the server returns the first result instead of posting twice.
  // Rotated after each success, so the next transaction is a new one.
  const idempotencyKey = useRef(newIdempotencyKey());

  return useMutation({
    mutationFn: (input: CreateTransactionInput) =>
      api.post<Transaction>("/api/v1/transactions", input, {
        "Idempotency-Key": idempotencyKey.current,
      }),
    onSuccess: () => {
      idempotencyKey.current = newIdempotencyKey();
      // A transaction moves balances, budgets, insights and net worth, and
      // Home shows all of them: everything cached is stale now.
      void queryClient.invalidateQueries();
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<{ id: string }>(`/api/v1/transactions/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
  });
}
