import { ExecutionResult, PolicyResult } from '../shared/types';
import { IExecutionGateway } from '../interfaces/gateway';
import { generateIdempotencyKey } from './idempotency';
import { ActionSimulator } from './simulator';

export class SimulatedGateway implements IExecutionGateway {
  private usedKeys = new Set<string>();
  private simulator: ActionSimulator;

  constructor(simulator?: ActionSimulator) {
    this.simulator = simulator || new ActionSimulator();
  }

  async execute(policyResult: PolicyResult): Promise<ExecutionResult> {
    if (policyResult.verdict !== 'APPROVED') {
      throw new Error('Cannot execute BLOCKED proposal');
    }

    const proposal = policyResult.proposal;
    const key = generateIdempotencyKey(proposal);

    // GUARD: Duplicate check
    if (this.usedKeys.has(key)) {
      return {
        mode: 'simulated',
        idempotency_key: key,
        error: 'duplicate_prevented',
      };
    }
    this.usedKeys.add(key);

    return this.simulator.simulate(proposal, key);
  }

  public getLiveLinksCount(): number {
    return 0;
  }

  public resetUsedKeys(): void {
    this.usedKeys.clear();
  }
}
