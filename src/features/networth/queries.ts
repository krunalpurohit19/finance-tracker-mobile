import { useQuery } from "@tanstack/react-query";

import { api } from "../../lib/api";

export interface NetWorthPoint {
  month: string;
  assets: string;
  liabilities: string;
  netWorth: string;
  /** null for the first point — nothing precedes it. */
  change: string | null;
}

export interface NetWorthAccount {
  accountId: string;
  name: string;
  type: string;
  currency: string;
  archived: boolean;
  /** In the account's own currency. */
  balance: string;
  /** Converted to base. Zero when `convertible` is false. */
  baseBalance: string;
  convertible: boolean;
  /** Share of its own side (assets or liabilities), 0–100. */
  share: number;
}

export interface NetWorth {
  baseCurrency: string;
  asOf: string;
  netWorth: string;
  assets: string;
  /** Negative: a liability balance is stored negative, so net worth is a plain sum. */
  liabilities: string;
  monthChange: string;
  /** null when last month's net worth was zero or negative — render nothing, not "0%". */
  monthChangePercent: number | null;
  history: NetWorthPoint[];
  assetAccounts: NetWorthAccount[];
  liabilityAccounts: NetWorthAccount[];
  unconvertedAccounts: { accountId: string; name: string; currency: string; balance: string }[];
}

export const netWorthKeys = {
  summary: (months: number) => ["net-worth", { months }] as const,
};

export function useNetWorth(months = 12) {
  return useQuery({
    queryKey: netWorthKeys.summary(months),
    queryFn: () => api.get<NetWorth>("/api/v1/net-worth", { months: String(months) }),
  });
}
