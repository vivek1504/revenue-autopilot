import { ExecutionResult, PolicyResult } from '../shared/types';
import { IExecutionGateway } from '../interfaces/gateway';
import { RazorpayClient } from './razorpay-client';
import { ActionSimulator } from './simulator';
import { RazorpayGateway } from './razorpay-gateway';
import { SimulatedGateway } from './simulated-gateway';

export { IExecutionGateway } from '../interfaces/gateway';
export { RazorpayGateway } from './razorpay-gateway';
export { SimulatedGateway } from './simulated-gateway';

export class ActionGateway implements IExecutionGateway {
  private razorpayGateway: RazorpayGateway;
  private simulatedGateway: SimulatedGateway;

  constructor(
    private client: RazorpayClient,
    private simulator: ActionSimulator = new ActionSimulator(),
    private maxLiveLinks: number = 10,
    private defaultMode: 'live' | 'simulated' = 'simulated'
  ) {
    this.simulatedGateway = new SimulatedGateway(this.simulator);
    this.razorpayGateway = new RazorpayGateway(
      this.client,
      this.maxLiveLinks,
      this.simulatedGateway
    );
  }

  async execute(
    policyResult: PolicyResult,
    mode?: 'live' | 'simulated'
  ): Promise<ExecutionResult> {
    const effectiveMode = mode || this.defaultMode;
    if (effectiveMode === 'simulated') {
      return this.simulatedGateway.execute(policyResult);
    }
    return this.razorpayGateway.execute(policyResult);
  }

  public getLiveLinksCount(): number {
    return this.razorpayGateway.getLiveLinksCount();
  }

  public resetUsedKeys(): void {
    this.simulatedGateway.resetUsedKeys();
    this.razorpayGateway.resetUsedKeys();
  }
}
