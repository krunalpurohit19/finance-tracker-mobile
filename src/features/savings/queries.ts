import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "../../lib/api";

export interface Savings {
  baseCurrency: string;
  lifetime: string;
  thisMonth: string;
  thisMonthRate: number | null;
  averageMonthly: string | null;
  best: { month: string; saved: string } | null;
  worst: { month: string; saved: string } | null;
  trend: {
    month: string;
    income: string;
    expenses: string;
    saved: string;
    rate: number | null;
  }[];
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: string;
  saved: string;
  remaining: string;
  progress: number | null;
  targetDate: string | null;
  monthsRemaining: number | null;
  requiredMonthly: string | null;
  overdue: boolean;
  achieved: boolean;
  color: string | null;
  icon: string | null;
  status: string;
  archived: boolean;
}

export const savingsKeys = {
  summary: ["savings"] as const,
  goals: ["savings", "goals"] as const,
};

export function useSavings() {
  return useQuery({
    queryKey: savingsKeys.summary,
    queryFn: () => api.get<Savings>("/api/v1/savings"),
  });
}

export function useGoals() {
  return useQuery({
    queryKey: savingsKeys.goals,
    queryFn: () => api.get<Goal[]>("/api/v1/savings/goals"),
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; targetAmount: string; targetDate?: string }) =>
      api.post<Goal>("/api/v1/savings/goals", input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: savingsKeys.goals });
    },
  });
}

export function useContribute(goalId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amount: string) =>
      api.post<Goal>(`/api/v1/savings/goals/${goalId}/contributions`, { amount }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: savingsKeys.goals });
      // A contribution does NOT change savings totals, but the summary card
      // shows goal counts, so refresh it too.
      void queryClient.invalidateQueries({ queryKey: savingsKeys.summary });
    },
  });
}
