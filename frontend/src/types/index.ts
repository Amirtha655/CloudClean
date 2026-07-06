export type RiskLevel = "low" | "medium" | "high";

export type AccountStatus = "connected" | "pending" | "scanning" | "error";

export interface AwsAccount {
  id: string;
  name: string;
  awsAccountId: string;
  roleArn: string;
  externalId: string;
  status: AccountStatus;
  regions: string[];
  lastScanAt: string | null;
  createdAt: string;
}

export interface ServiceCount {
  service: string;
  count: number;
  cost: number;
}

export interface RegionCount {
  region: string;
  count: number;
  cost: number;
}

export interface TrendPoint {
  date: string;
  resources: number;
  cost: number;
}

export interface DashboardSummary {
  totalResources: number;
  monthlyCost: number;
  potentialSavings: number;
  riskScore: number;
  byService: ServiceCount[];
  byRegion: RegionCount[];
  growthTrend: TrendPoint[];
  recommendationCount: number;
}

export interface Resource {
  id: string;
  accountId: string;
  service: string;
  type: string;
  name: string;
  arn: string;
  region: string;
  state: string;
  tags: Record<string, string>;
  monthlyCost: number;
  lastUsedDays: number | null;
  owner: string;
  environment: string;
  riskScore: RiskLevel;
  unused: boolean;
}

export interface DependencyNode {
  id: string;
  label: string;
  service: string;
}

export interface DependencyEdge {
  source: string;
  target: string;
}

export interface DependencyGraph {
  resourceId: string;
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  risk: RiskLevel;
  affected: string[];
}

export interface Recommendation {
  id: string;
  resourceId: string;
  resourceName: string;
  service: string;
  reason: string;
  action: string;
  confidence: number;
  estimatedSavings: number;
}

export interface CleanupWarning {
  resourceName: string;
  message: string;
  risk: RiskLevel;
}

export interface CleanupPlan {
  id: string;
  resourceIds: string[];
  resourceCountByService: ServiceCount[];
  totalCount: number;
  estimatedSavings: number;
  estimatedDurationMinutes: number;
  warnings: CleanupWarning[];
  createdAt: string;
}

export type CleanupStatus = "pending" | "running" | "completed" | "failed";

export interface CleanupHistoryItem {
  id: string;
  user: string;
  startedAt: string;
  finishedAt: string | null;
  status: CleanupStatus;
  resourcesDeleted: number;
  resourcesFailed: number;
  savings: number;
}

export interface CleanupTemplate {
  id: string;
  name: string;
  description: string;
  filters: Record<string, string>;
}

export interface CostAnalytics {
  currentCost: number;
  potentialSavings: number;
  byService: ServiceCount[];
  byRegion: RegionCount[];
  trend: TrendPoint[];
  topExpensive: Resource[];
}

export interface AdminStats {
  connectedAccounts: number;
  totalScans: number;
  resourcesManaged: number;
  savingsGenerated: number;
  activeUsers: number;
}
