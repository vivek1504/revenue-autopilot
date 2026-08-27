import { AgentProposal } from './agent';

export type PolicyVerdict = 'APPROVED' | 'BLOCKED' | 'ESCALATED';

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
