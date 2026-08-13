import { useQuery } from "@tanstack/react-query";

import { api } from "../../lib/api";
import type { PeriodPreset } from "../dashboard/queries";

export interface Analytics {
  baseCurrency: string;
  period: { preset: string; from: string; to: string };
  previousPeriod: { from: string; to: string };
  totals: { income: string; expenses: string; net: string; savingsRate: number | null };
  monthly: {
    month: string;
    income: string;
    expenses: string;
    net: string;
    savingsRate: number | null;
  }[];
  byCategory: {
    categoryId: string | null;
    categoryName: string;
    color: string | null;
    total: string;
    share: number;
  }[];
  categoryChange: {
    categoryId: string | null;
    categoryName: string;
    color: string | null;
    current: string;
    previous: string;
    change: string;
    changePercent: number | null;
  }[];
  topMerchants: { merchant: string; total: string; count: number }[];
  byAccount: {
    accountId: string;
    name: string;
    currency: string;
    income: string;
    expenses: string;
    transactionCount: number;
  }[];
}

export function useAnalytics(preset: PeriodPreset) {
  return useQuery({
    queryKey: ["analytics", { preset }],
    queryFn: () => api.get<Analytics>("/api/v1/analytics", { preset }),
  });
}
