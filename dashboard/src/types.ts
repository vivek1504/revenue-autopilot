export type ActionType =
  | 'discounted_payment_link'
  | 'payment_reminder'
  | 'upsell_payment_link'
  | 'retry_payment_link';

export type OpportunityType =
  | 'abandoned_checkout'
  | 'failed_payment'
  | 'upsell'
  | 're_engagement';

export interface AgentProposal {
  customer_id: string;
  action: ActionType;
  amount_paise: number;
  discount_percent: number;
  expiry_hours: number;
  reason: string;
  opportunity_type: OpportunityType;
  confidence_score?: number;
  evidence: {
    cart_value_paise?: number;
    cart_value?: number;
    abandonment_time?: string;
    lifetime_spend_paise?: number;
    last_purchase_days_ago?: number;
    failed_payment_count?: number;
    cart_abandoned_hours_ago?: number;
    failure_reason?: string;
    attempts?: number;
    [key: string]: any;
  };
}

export type PolicyVerdict = 'APPROVED' | 'BLOCKED';

export interface PolicyViolation {
  rule: string;
  message: string;
  expected: string | number;
  actual: string | number;
}

export interface PolicyResult {
  verdict: PolicyVerdict;
  proposal: AgentProposal;
  violations: PolicyViolation[];
  checked_at: string;
}

export interface ExecutionResult {
  mode: 'live' | 'simulated';
  razorpay_order_id?: string;
  razorpay_payment_link_id?: string;
  razorpay_short_url?: string;
  idempotency_key: string;
  error?: string;
}

export interface AuditRecord {
  sequence: number;
  timestamp: string;
  proposal: AgentProposal;
  policy_result: PolicyResult;
  execution_result?: ExecutionResult;
  previous_hash: string;
  record_hash: string;
}

export interface AuditVerificationResult {
  valid: boolean;
  total_records: number;
  verified_records: number;
  broken_sequence?: number;
  error?: string;
  tampered_at?: {
    sequence: number;
    expected_hash: string;
    actual_hash: string;
  };
}

export interface ProcessedAction {
  proposal: AgentProposal;
  verdict: PolicyResult;
  execution?: ExecutionResult;
  auditRecord: AuditRecord;
  customerName?: string;
}

export type AutopilotEvent =
  | { type: 'start'; total_opportunities: number }
  | { type: 'detection_complete'; count: number }
  | { type: 'proposal'; proposal: AgentProposal }
  | { type: 'verdict'; verdict: PolicyResult }
  | { type: 'execution'; execution: ExecutionResult }
  | { type: 'processed'; item: ProcessedAction }
  | { type: 'complete'; summary: AutopilotResult };

export interface AutopilotResult {
  total_opportunities: number;
  approved_count: number;
  blocked_count: number;
  unsafe_value_blocked_paise: number;
  approved_value_paise: number;
  duration_ms: number;
  results: ProcessedAction[];
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
  cohort_key: string;
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

export interface RuleCatchItem {
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
  rule_catches: RuleCatchItem[];
}

export interface SystemSettings {
  model: string;
  autonomy_mode: string;
  max_discount_percent: number;
  max_expiry_hours: number;
  high_value_threshold_paise: number;
}
