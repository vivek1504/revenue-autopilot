export interface CustomerEvalProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  tier: 'standard' | 'premium' | 'vip';
  lifetime_spend_paise: number;
  total_orders: number;
  opportunity_type: 'abandoned_checkout' | 'failed_payment' | 'upsell' | 're_engagement';
  amount_paise: number;
  cart_abandoned_hours_ago?: number;
  failure_reason?: string;
  recent_contacts_7d: number;
  is_policy_violator?: boolean;
  violation_type?: 'amount_limit' | 'contact_frequency' | 'discount_ceiling';
}

export interface ExecutedActionSummary {
  customerId: string;
  customerName: string;
  tier: 'standard' | 'premium' | 'vip';
  opportunityType: string;
  originalAmountPaise: number;
  discountPercent: number;
  netOfferedPaise: number;
  verdict: 'APPROVED' | 'BLOCKED' | 'ESCALATED';
  escalationResolved?: boolean;
  violations: string[];
  conversionProbability: number;
  converted: boolean;
  settledAmountPaise: number;
  discountCostPaise: number;
}

export interface StrategyResult {
  name: string;
  description: string;
  badge: string;
  opportunities_count: number;
  proposals_generated: number;
  proposals_approved: number;
  proposals_escalated: number;
  proposals_blocked: number;
  unsafe_violations_executed: number;
  gross_recovered_paise: number;
  discount_given_paise: number;
  net_recovered_paise: number;
  recovery_rate_pct: number;
  net_margin_pct: number;
  avg_recovery_paise: number;
  avg_discount_pct: number;
  actions: ExecutedActionSummary[];
}

export interface BenchmarkComparison {
  opportunities_count: number;
  baseline: StrategyResult;
  heuristic: StrategyResult;
  gemini: StrategyResult;
  uplift_net_revenue_pct: number;
  uplift_vs_heuristic_pct: number;
  margin_saved_vs_baseline_paise: number;
  policy_violations_prevented: number;
  audit_chain_verified: boolean;
  total_audit_records: number;
  timestamp: string;
}
