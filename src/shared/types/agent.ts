import { ActionType } from './domain.js';
import { PolicyResult } from './policy.js';
import { ExecutionResult } from './execution.js';
import { AuditRecord } from './audit.js';

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

export interface ProcessedAction {
  proposal: AgentProposal;
  verdict: PolicyResult;
  execution?: ExecutionResult;
  auditRecord?: AuditRecord;
  customerName?: string;
}
