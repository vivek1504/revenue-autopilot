import crypto from 'crypto';
import { AgentProposal } from '../shared/types';

export function generateIdempotencyKey(proposal: AgentProposal): string {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const payload = `${proposal.customer_id}_${proposal.action}_${date}`;
  const hash = crypto
    .createHash('sha256')
    .update(payload)
    .digest('hex')
    .slice(0, 12);
  return `autopilot_${proposal.customer_id}_${hash}`;
}
