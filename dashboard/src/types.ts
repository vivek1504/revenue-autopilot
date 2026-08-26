export type OpportunityType =
  | 'abandoned_checkout'
  | 'failed_payment'
  | 'upsell'
  | 're_engagement';

export type ActionType =
  | 'discounted_payment_link'
  | 'payment_reminder'
  | 'upsell_payment_link'
  | 'retry_payment_link';

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  tier: string;
  lifetime_spend_paise: number;
  total_orders: number;
  first_purchase_date?: string | null;
  last_purchase_date?: string | null;
  notes?: string | null;
}

export interface AgentProposal {
  customer_id: string;
  action: ActionType;
  amount_paise: number;
  discount_percent: number;
  expiry_hours: number;
  confidence_score?: number;
  reason: string;
  opportunity_type: OpportunityType;
  evidence: Record<string, any>;
}

export interface PolicyViolation {
  rule: string;
  message: string;
  expected: string | number;
  actual: string | number;
}

export interface PolicyResult {
  verdict: 'APPROVED' | 'BLOCKED';
  proposal: AgentProposal;
  violations: PolicyViolation[];
  checked_at: string;
}

export interface ExecutionResult {
  mode: 'live' | 'simulated';
  razorpay_order_id?: string;
  razorpay_payment_link_id?: string;
  razorpay_short_url?: string;
  idempotency_key?: string;
  error?: string;
}

export interface LLMReasoningMetadata {
  raw_response?: string;
  model: string;
  latency_ms: number;
  used_fallback: boolean;
  fallback_reason?: string;
}

export interface AuditRecord {
  sequence: number;
  timestamp: string;
  proposal: AgentProposal;
  policy_result: PolicyResult;
  execution_result?: ExecutionResult;
  llm_reasoning?: LLMReasoningMetadata;
  previous_hash: string;
  record_hash: string;
}

export interface ProcessedAction {
  proposal: AgentProposal;
  verdict: PolicyResult;
  execution?: ExecutionResult;
  auditRecord?: AuditRecord;
  customerName?: string;
}

export interface DashboardSummary {
  total_customers: number;
  opportunities_count: number;
  approved_count: number;
  blocked_count: number;
  unsafe_value_blocked_paise: number;
  approved_value_paise: number;
  recovered_value_paise: number;
  recovery_conversion_pct: number;
  avg_recovery_value_paise: number;
  recovery_rate_pct: number;
  live_links_created: number;
  redeemed_count: number;
  deltas?: {
    recoverable_delta_pct?: number | null;
    recovered_delta_pct?: number | null;
    rate_delta_pct?: number | null;
    protected_delta_pct?: number | null;
    aov_delta_pct?: number | null;
  };
}

export interface CohortPerformance {
  cohort_key: OpportunityType;
  label: string;
  count: number;
  volume_paise: number;
  conversion_rate_pct: number;
  percentage_of_total: number;
  color?: string;
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
  color?: string;
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

export interface AuditVerificationResult {
  valid: boolean;
  total_records: number;
  verified_records: number;
  tampered_at?: {
    sequence: number;
    expected_hash: string;
    actual_hash: string;
    record_timestamp: string;
  };
}

export type AutopilotEvent =
  | { type: 'start'; total_opportunities: number }
  | { type: 'detection_complete'; count: number }
  | { type: 'proposal'; proposal: AgentProposal }
  | { type: 'verdict'; verdict: PolicyResult }
  | { type: 'execution'; execution?: ExecutionResult }
  | { type: 'processed'; item: ProcessedAction }
  | { type: 'complete'; summary: any };
