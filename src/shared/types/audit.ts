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
  proposal: AgentProposal;
  policy_result: PolicyResult;
  execution_result?: ExecutionResult;
  llm_reasoning?: LLMReasoningMetadata;
  previous_hash: string;
  record_hash: string;
}

