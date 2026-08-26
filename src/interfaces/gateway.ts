import { ExecutionResult, PolicyResult } from '../shared/types';

export interface IExecutionGateway {
  execute(policyResult: PolicyResult): Promise<ExecutionResult>;
  getLiveLinksCount(): number;
  resetUsedKeys?(): void;
}
