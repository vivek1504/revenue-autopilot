import { OpportunityType } from './agent';

export interface DashboardSummary {
  total_customers: number;
  opportunities_count: number;
  approved_count: number;
  blocked_count: number;
  unsafe_value_blocked_paise: number;
  approved_value_paise: number;
  avg_recovery_value_paise: number;
  recovery_rate_pct: number;
  live_links_created: number;
  redeemed_count: number;
  deltas: {
    recoverable_delta_pct: number;
    recovered_delta_pct: number;
    rate_delta_pct: number;
    protected_delta_pct: number;
    aov_delta_pct: number;
  };
}

export interface CohortPerformance {
  cohort_key: OpportunityType;
  label: string;
  count: number;
  volume_paise: number;
  conversion_rate_pct: number;
  percentage_of_total: number;
  color: string;
}

export interface TimeSeriesPoint {
  period: string;
  label: string;
  recoverable_paise: number;
  recovered_paise: number;
}

export interface RuleCatchDistribution {
  rule: string;
  count: number;
  percentage: number;
  color: string;
}

export interface TelemetryBenchmarks {
  avg_confidence: number;
  block_rate_pct: number;
  blocked_proposals_count: number;
  total_proposals_count: number;
  avg_llm_latency_ms: number;
  llm_call_count: number;
  verified_audit_records_count: number;
  hash_chain_intact: boolean;
  p99_discovery_ms: number;
  p99_policy_ms: number;
  p99_ledger_ms: number;
  p99_llm_ms: number;
  throughput_ops_sec: number;
  rule_catches: RuleCatchDistribution[];
}

export interface SystemSettings {
  model: string;
  autonomy_mode: 'autonomous' | 'supervised';
  max_discount_percent: number;
  max_expiry_hours: number;
  high_value_threshold_paise: number;
  updated_at?: string;
}
