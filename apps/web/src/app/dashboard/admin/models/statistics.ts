// Token usage interfaces
export interface TokenUsageTotals {
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

export interface TokenOverviewItem {
  date: string;
  inputTokens: number;
  outputTokens: number;
}

export interface CostDistributionItem {
  name: string;
  value: number;
}

export interface TokenUsageData {
  totals: TokenUsageTotals;
  overview: TokenOverviewItem[];
  costDistribution: CostDistributionItem[];
}

// Model usage interfaces
export interface ModelDistributionItem {
  name: string;
  value: number;
}

export interface ModelPerformanceItem {
  name: string;
  avgResponseTime: number;
  avgTokens: number;
}

export interface ModelUsageData {
  distribution: ModelDistributionItem[];
  performance: ModelPerformanceItem[];
}

// User usage interfaces
export interface UserData {
  id: string;
  name: string;
  tokens?: number;
  avgCost?: number;
}

export interface UserActivityItem {
  date: string;
  activeUsers: number;
}

export interface UserUsageData {
  topUsers: UserData[];
  activityOverTime: UserActivityItem[];
  costPerUser: UserData[];
}
