import { AgentProposal, LLMReasoningMetadata } from '../shared/types';
import { CustomerOpportunity } from '../agent/detector';

export interface ProposalWithReasoning {
  proposal: AgentProposal;
  reasoning: LLMReasoningMetadata;
}

export interface IProposer {
  propose(opportunity: CustomerOpportunity): Promise<ProposalWithReasoning>;
  proposeBatch?(
    opportunities: CustomerOpportunity[],
    onProposal?: (item: ProposalWithReasoning, index: number) => void
  ): Promise<ProposalWithReasoning[]>;
}
