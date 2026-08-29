import { AgentProposal } from './agent';
import { PolicyResult } from './policy';
import { ExecutionResult } from './execution';

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
  event_type?: 'PROPOSAL_EVALUATED' | 'SETTLEMENT_VERIFIED';
  proposal: AgentProposal;
  policy_result: PolicyResult;
  execution_result?: ExecutionResult;
  llm_reasoning?: LLMReasoningMetadata;
  settlement?: {
    offer_id: string;
    opportunity_id?: string;
    payment_link_id?: string;
    settled_amount_paise: number;
    customer_id: string;
  };
  previous_hash: string;
  record_hash: string;
}

