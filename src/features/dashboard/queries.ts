import { useQuery } from "@tanstack/react-query";

import { api } from "../../lib/api";
import type { Transaction } from "../transactions/queries";

export const PERIOD_OPTIONS = [
  { value: "this-month", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "last-7-days", label: "7 days" },
  { value: "last-30-days", label: "30 days" },
  { value: "this-year", label: "This year" },
  { value: "last-year", label: "Last year" },
] as const;

export type PeriodPreset = (typeof PERIOD_OPTIONS)[number]["value"];

export interface Dashboard {
  baseCurrency: string;
  period: { preset: string; from: string; to: string };
  totalBalance: string;
  netWorth: string;
  assets: string;
  liabilities: string;
  lifetimeSavings: string;
  income: string;
  expenses: string;
  savings: string;
  /** null when income is zero — render "—", never "0%". */
  savingsRate: number | null;
  spendingByCategory: {
    categoryId: string | null;
    categoryName: string;
    color: string | null;
    icon: string | null;
    total: string;
    share: number;
  }[];
  recentTransactions: Transaction[];
  unconvertedAccounts: { accountId: string; name: string; currency: string; balance: string }[];
}

export function useDashboard(preset: PeriodPreset) {
  return useQuery({
    queryKey: ["dashboard", { preset }],
    queryFn: () => api.get<Dashboard>("/api/v1/dashboard", { preset }),
  });
}
