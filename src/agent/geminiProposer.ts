import { GoogleGenerativeAI } from '@google/generative-ai';
import { AgentProposal } from '../shared/types';
import { CustomerOpportunity } from './detector';
import { buildUserPrompt, SYSTEM_PROMPT } from './prompts';
import { AgentProposalSchema, GEMINI_PROPOSAL_RESPONSE_SCHEMA } from './schemas';
import { IProposer, ProposalWithReasoning } from '../interfaces/proposer';
import { HeuristicProposer } from './simulatedProposer';

export class GeminiProposer implements IProposer {
  private genAI?: GoogleGenerativeAI;
  private model?: any;
  private modelName: string;
  private fallbackProposer: IProposer;

  constructor(
    apiKey?: string,
    modelName: string = 'gemini-3.6-flash',
    fallbackProposer?: IProposer
  ) {
    this.modelName = modelName;
    this.fallbackProposer = fallbackProposer || new HeuristicProposer();

    if (apiKey && apiKey !== 'dummy_gemini_key') {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: GEMINI_PROPOSAL_RESPONSE_SCHEMA,
        },
      });
    }
  }

  async propose(opportunity: CustomerOpportunity): Promise<ProposalWithReasoning> {
    const t0 = performance.now();

    if (!this.model) {
      const fallbackResult = await this.fallbackProposer.propose(opportunity);
      return {
        ...fallbackResult,
        reasoning: {
          ...fallbackResult.reasoning,
          fallback_reason: 'llm_not_configured',
        },
      };
    }

    try {
      console.log('\x1b[1m\x1b[31musing gemini for proposal\x1b[0m');
      const userPrompt = buildUserPrompt(opportunity);

      const result = await this.model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: SYSTEM_PROMPT }],
          },
          {
            role: 'model',
            parts: [
              {
                text: 'Understood. I will analyze the customer data and output a JSON proposal matching the schema.',
              },
            ],
          },
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
      });

      const latency_ms = Math.round((performance.now() - t0) * 100) / 100;
      const text = result.response.text();
      const raw = JSON.parse(text);

      const validated = AgentProposalSchema.parse(raw) as AgentProposal;
      if (!validated.confidence_score) {
        validated.confidence_score =
          opportunity.customer.tier === 'vip' ? 0.96 : 0.91;
      }

      return {
        proposal: validated,
        reasoning: {
          raw_response: text,
          model: this.modelName,
          latency_ms,
          used_fallback: false,
        },
      };
    } catch (err: any) {
      const latency_ms = Math.round((performance.now() - t0) * 100) / 100;
      console.warn(
        `[GeminiProposer] LLM generation warning for ${opportunity.customer.id}: ${err.message}. Using structured fallback proposal.`
      );
      const fallbackResult = await this.fallbackProposer.propose(opportunity);
      return {
        ...fallbackResult,
        reasoning: {
          ...fallbackResult.reasoning,
          latency_ms,
          fallback_reason: `llm_error: ${err.message}`,
        },
      };
    }
  }

  async proposeBatch(
    opportunities: CustomerOpportunity[],
    onProposal?: (item: ProposalWithReasoning, index: number) => void
  ): Promise<ProposalWithReasoning[]> {
    const proposals: ProposalWithReasoning[] = [];
    for (let i = 0; i < opportunities.length; i++) {
      const opp = opportunities[i]!;
      const result = await this.propose(opp);
      proposals.push(result);
      if (onProposal) {
        onProposal(result, i);
      }
    }
    return proposals;
  }
}
