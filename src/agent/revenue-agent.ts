import { AgentProposal } from '../shared/types';
import { CustomerOpportunity } from './detector';
import { IProposer, ProposalWithReasoning } from '../interfaces/proposer';
import { GeminiProposer } from './geminiProposer';
import { HeuristicProposer } from './simulatedProposer';

export { ProposalWithReasoning, IProposer } from '../interfaces/proposer';
export { GeminiProposer } from './geminiProposer';
export { HeuristicProposer } from './simulatedProposer';

export class RevenueAgent implements IProposer {
  private geminiProposer: GeminiProposer;
  private heuristicProposer: HeuristicProposer;

  constructor(apiKey?: string, modelName: string = 'gemini-3.6-flash') {
    this.heuristicProposer = new HeuristicProposer();
    this.geminiProposer = new GeminiProposer(apiKey, modelName, this.heuristicProposer);
  }

  async propose(opportunity: CustomerOpportunity): Promise<ProposalWithReasoning> {
    return this.geminiProposer.propose(opportunity);
  }

  async proposeAction(
    opportunity: CustomerOpportunity,
    mode: 'live' | 'simulated' = 'simulated'
  ): Promise<ProposalWithReasoning> {
    if (mode === 'simulated') {
      console.log('\x1b[1m\x1b[32musing fallback for proposal\x1b[0m');
      return this.heuristicProposer.propose(opportunity);
    }
    return this.geminiProposer.propose(opportunity);
  }

  async proposeBatch(
    opportunities: CustomerOpportunity[],
    onProposal?: (item: ProposalWithReasoning, index: number) => void,
    mode: 'live' | 'simulated' = 'simulated'
  ): Promise<ProposalWithReasoning[]> {
    const proposer = mode === 'live' ? this.geminiProposer : this.heuristicProposer;
    return proposer.proposeBatch!(opportunities, onProposal);
  }

  public fallbackProposal(opportunity: CustomerOpportunity): AgentProposal {
    return this.heuristicProposer.generateProposal(opportunity);
  }
}
