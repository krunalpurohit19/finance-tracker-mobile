import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "../../lib/api";

export interface BudgetProgress {
  id: string;
  categoryId: string | null;
  categoryName: string | null;
  color: string | null;
  amount: string;
  spent: string;
  remaining: string;
  percentUsed: number | null;
  status: "OK" | "NEAR_LIMIT" | "EXCEEDED";
  effectiveFrom: string;
  effectiveTo: string | null;
  month: string;
}

export const budgetKeys = { all: ["budgets"] as const };

export function useBudgets() {
  return useQuery({
    queryKey: budgetKeys.all,
    queryFn: () => api.get<BudgetProgress[]>("/api/v1/budgets"),
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { categoryId?: string; amount: string }) =>
      api.post<BudgetProgress[]>("/api/v1/budgets", input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ id: string }>(`/api/v1/budgets/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
}
