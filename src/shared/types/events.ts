import { AgentProposal, ProcessedAction } from './agent';
import { PolicyResult } from './policy';
import { ExecutionResult } from './execution';

export interface AutopilotResult {
  total_opportunities: number;
  approved_count: number;
  blocked_count: number;
  escalated_count: number;
  dispatched_count: number;
  execution_failed_count: number;
  unsafe_value_blocked_paise: number;
  approved_value_paise: number;
  duration_ms: number;
  results: ProcessedAction[];
}

export type AutopilotEvent =
  | { type: 'start'; total_opportunities: number }
  | { type: 'detection_complete'; count: number }
  | { type: 'proposal'; proposal: AgentProposal }
  | { type: 'verdict'; verdict: PolicyResult }
  | { type: 'execution'; execution: ExecutionResult }
  | { type: 'processed'; item: ProcessedAction }
  | { type: 'complete'; summary: AutopilotResult };
