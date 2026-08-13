import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "../../lib/api";

export interface Category {
  id: string;
  name: string;
  kind: "INCOME" | "EXPENSE";
  color: string | null;
  icon: string | null;
  isSystem: boolean;
  sortOrder: number;
  parentId: string | null;
  archivedAt: string | null;
}

export interface CreateCategoryInput {
  name: string;
  kind: "INCOME" | "EXPENSE";
  color?: string;
  icon?: string;
  parentId?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  color?: string;
  icon?: string;
}

export const categoryKeys = {
  all: ["categories"] as const,
  list: (kind?: string, includeArchived?: boolean) =>
    ["categories", { kind, includeArchived }] as const,
  detail: (id: string) => ["categories", id] as const,
};

export function useCategories(kind?: string, includeArchived = false) {
  return useQuery({
    queryKey: categoryKeys.list(kind, includeArchived),
    queryFn: () => api.get<Category[]>("/api/v1/categories", { kind, includeArchived }),
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () => api.get<Category>(`/api/v1/categories/${id}`),
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCategoryInput) => api.post<Category>("/api/v1/categories", input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCategoryInput }) =>
      api.patch<Category>(`/api/v1/categories/${id}`, input),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<{ id: string }>(`/api/v1/categories/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useArchiveCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.post<Category>(`/api/v1/categories/${id}/archive`),
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}

export function useUnarchiveCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.post<Category>(`/api/v1/categories/${id}/unarchive`),
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
}
