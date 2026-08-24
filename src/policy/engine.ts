import Database from 'better-sqlite3';
import { AgentProposal, PolicyResult, PolicyViolation } from '../shared/types';
import { DEFAULT_MERCHANT_POLICY, MerchantPolicy } from './config';
import { RULES, RuleContext } from './rules';

export class PolicyEngine {
  private policy: MerchantPolicy;
  private db: Database.Database;

  constructor(policy: MerchantPolicy = DEFAULT_MERCHANT_POLICY, db: Database.Database) {
    this.policy = policy;
    this.db = db;
  }

  public evaluate(proposal: AgentProposal): PolicyResult {
    const violations: PolicyViolation[] = [];
    const ctx: RuleContext = {
      proposal,
      policy: this.policy,
      db: this.db,
    };

    // Run ALL rule checks and collect ALL violations (never short-circuit!)
    for (const [ruleName, checkFn] of Object.entries(RULES)) {
      try {
        const violation = checkFn(ctx);
        if (violation) {
          violations.push(violation);
        }
      } catch (err: any) {
        violations.push({
          rule: ruleName,
          message: `Rule execution error: ${err.message}`,
          expected: 'successful evaluation',
          actual: 'error',
        });
      }
    }

    const verdict = violations.length === 0 ? 'APPROVED' : 'BLOCKED';

    return {
      verdict,
      proposal,
      violations,
      checked_at: new Date().toISOString(),
    };
  }

  public getPolicy(): MerchantPolicy {
    return { ...this.policy };
  }
}
