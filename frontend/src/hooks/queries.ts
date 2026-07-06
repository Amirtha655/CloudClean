import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  AdminStats,
  AwsAccount,
  CleanupHistoryItem,
  CleanupPlan,
  CleanupTemplate,
  CostAnalytics,
  DashboardSummary,
  DependencyGraph,
  Recommendation,
  Resource,
} from "@/types";

export function useSignup() {
  return useMutation({
    mutationFn: async (payload: { name: string; email: string; password: string }) =>
      (await api.post("/auth/signup", payload)).data as { message: string },
  });
}

export function useVerify() {
  return useMutation({
    mutationFn: async (payload: { email: string; code: string }) =>
      (await api.post("/auth/verify", payload)).data as { message: string },
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: async (payload: { email: string; password: string }) =>
      (await api.post("/auth/login", payload)).data as { token: string; email: string; name: string },
  });
}

export function useCurrentUser() {
  return useQuery<{ email: string; name: string }>({
    queryKey: ["me"],
    queryFn: async () => (await api.get("/auth/me")).data,
    retry: false,
  });
}

export function useAccounts() {
  return useQuery<AwsAccount[]>({
    queryKey: ["accounts"],
    queryFn: async () => (await api.get("/accounts")).data,
    refetchInterval: (query) =>
      query.state.data?.some((a) => a.status === "scanning") ? 3000 : false,
  });
}

export function useConnectAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      awsAccountId: string;
      roleArn: string;
      externalId: string;
      regions: string[];
    }) => (await api.post("/accounts", payload)).data as AwsAccount,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });
}

export function useValidateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: string) =>
      (await api.post(`/accounts/${accountId}/validate`)).data as AwsAccount,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });
}

export function useScanAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: string) =>
      (await api.post(`/accounts/${accountId}/scan`)).data as AwsAccount,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });
}

export function useDisconnectAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: string) => {
      await api.delete(`/accounts/${accountId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["resources"] });
      qc.invalidateQueries({ queryKey: ["recommendations"] });
      qc.invalidateQueries({ queryKey: ["cost"] });
    },
  });
}

export function useInvalidateScanResults() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    qc.invalidateQueries({ queryKey: ["resources"] });
    qc.invalidateQueries({ queryKey: ["recommendations"] });
    qc.invalidateQueries({ queryKey: ["cost"] });
  };
}

export function useDashboardSummary() {
  return useQuery<DashboardSummary>({
    queryKey: ["dashboard"],
    queryFn: async () => (await api.get("/dashboard/summary")).data,
  });
}

export interface ResourceFilters {
  region?: string;
  service?: string;
  environment?: string;
  excludeEnvironment?: string;
  state?: string;
  owner?: string;
  risk?: string;
  unused?: boolean;
  search?: string;
}

export function useResources(filters: ResourceFilters) {
  return useQuery<Resource[]>({
    queryKey: ["resources", filters],
    queryFn: async () => (await api.get("/resources", { params: filters })).data,
  });
}

export function useDependencyGraph(resourceId: string | null) {
  return useQuery<DependencyGraph>({
    queryKey: ["dependencies", resourceId],
    queryFn: async () => (await api.get(`/dependencies/${resourceId}`)).data,
    enabled: !!resourceId,
  });
}

export function useRecommendations() {
  return useQuery<Recommendation[]>({
    queryKey: ["recommendations"],
    queryFn: async () => (await api.get("/recommendations")).data,
  });
}

export function useCreatePlan() {
  return useMutation({
    mutationFn: async (resourceIds: string[]) =>
      (await api.post("/planner/plan", { resourceIds })).data as CleanupPlan,
  });
}

export function useExecutePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ planId, dryRun }: { planId: string; dryRun: boolean }) =>
      (await api.post(`/planner/plan/${planId}/execute`, null, { params: { dry_run: dryRun } })).data,
    onSuccess: (_data, vars) => {
      if (!vars.dryRun) {
        qc.invalidateQueries({ queryKey: ["resources"] });
        qc.invalidateQueries({ queryKey: ["dashboard"] });
        qc.invalidateQueries({ queryKey: ["history"] });
        qc.invalidateQueries({ queryKey: ["recommendations"] });
      }
    },
  });
}

export function useCleanupHistory() {
  return useQuery<CleanupHistoryItem[]>({
    queryKey: ["history"],
    queryFn: async () => (await api.get("/history")).data,
  });
}

export function useTemplates() {
  return useQuery<CleanupTemplate[]>({
    queryKey: ["templates"],
    queryFn: async () => (await api.get("/templates")).data,
  });
}

export function useCostAnalytics() {
  return useQuery<CostAnalytics>({
    queryKey: ["cost"],
    queryFn: async () => (await api.get("/cost/analytics")).data,
  });
}

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ["admin"],
    queryFn: async () => (await api.get("/admin/stats")).data,
  });
}
