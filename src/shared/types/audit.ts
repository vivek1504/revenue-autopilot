import { AgentProposal } from './agent';
import { PolicyResult } from './policy';
import { ExecutionResult } from './execution';

export interface AuditRecord {
  sequence: number;
  timestamp: string;
  proposal: AgentProposal;
  policy_result: PolicyResult;
  execution_result?: ExecutionResult;
  previous_hash: string;
  record_hash: string;
}
