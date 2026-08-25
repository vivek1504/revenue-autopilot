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
    lifetime_spend_paise?: number;
    last_purchase_days_ago?: number;
    failed_payment_count?: number;
    cart_abandoned_hours_ago?: number;
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

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  tier: 'standard' | 'premium' | 'vip';
  lifetime_spend_paise: number;
  total_orders: number;
  first_purchase_date?: string;
  last_purchase_date?: string;
  notes?: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price_paise: number;
  description: string;
}

export interface CartItem {
  product_id: string;
  quantity: number;
  price_paise: number;
}

export interface Cart {
  id: string;
  customer_id: string;
  items: CartItem[];
  total_paise: number;
  created_at: string;
  last_activity: string;
  status: 'active' | 'abandoned' | 'converted';
}

export interface Order {
  id: string;
  customer_id: string;
  status: 'completed' | 'failed' | 'abandoned' | 'pending';
  total_paise: number;
  created_at: string;
  completed_at?: string;
  failure_reason?: string;
  items: CartItem[];
}

export interface RecoveryOffer {
  id: string;
  customer_id: string;
  action_type: ActionType;
  amount_paise: number;
  discount_percent: number;
  status: 'pending' | 'sent' | 'redeemed' | 'expired';
  created_at: string;
  expires_at: string;
  razorpay_payment_link_id?: string;
  razorpay_order_id?: string;
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
  compliance_rate_pct: number;
  p99_discovery_ms: number;
  p99_policy_ms: number;
  p99_ledger_ms: number;
  p99_llm_ms: number;
  throughput_ops_sec: number;
  active_pipelines_count: number;
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
