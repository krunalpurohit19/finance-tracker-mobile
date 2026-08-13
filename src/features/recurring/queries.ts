import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "../../lib/api";
import { accountKeys } from "../accounts/queries";
import { transactionKeys } from "../transactions/queries";

export interface RecurringRule {
  id: string;
  name: string;
  type: "EXPENSE" | "INCOME" | "TRANSFER";
  amount: string;
  currency: string;
  accountId: string;
  accountName: string;
  transferAccountId: string | null;
  categoryId: string | null;
  categoryName: string | null;
  merchant: string | null;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  interval: number;
  startOn: string;
  endOn: string | null;
  nextOccurrence: string;
  lastGenerated: string | null;
  isActive: boolean;
}

interface GenerationSummary {
  created: number;
  skipped: number;
  rulesProcessed: number;
}

export const recurringKeys = { all: ["recurring"] as const };

export function useRecurring() {
  return useQuery({
    queryKey: recurringKeys.all,
    queryFn: () => api.get<RecurringRule[]>("/api/v1/recurring"),
  });
}

export function useToggleRecurring() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch<RecurringRule>(`/api/v1/recurring/${id}`, { isActive }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: recurringKeys.all });
    },
  });
}

export function useDeleteRecurring() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ id: string }>(`/api/v1/recurring/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: recurringKeys.all });
    },
  });
}

/**
 * Materialise anything that has fallen due.
 *
 * Called once on app launch. Safe to call repeatedly — the server guarantees
 * idempotency with a unique constraint, so a repeat run creates nothing.
 */
export function useGenerateRecurring() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<GenerationSummary>("/api/v1/recurring/generate"),
    onSuccess: (summary) => {
      // Only disturb the caches if something actually appeared.
      if (summary.created > 0) {
        void queryClient.invalidateQueries({ queryKey: transactionKeys.all });
        void queryClient.invalidateQueries({ queryKey: accountKeys.all });
        void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      }
    },
  });
}
