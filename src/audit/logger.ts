import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { AgentProposal, AuditRecord, ExecutionResult, LLMReasoningMetadata, PolicyResult } from '../shared/types';

export const GENESIS_HASH = '0'.repeat(64);

export class AuditLogger {
  private auditPath: string;
  private lastHash: string = GENESIS_HASH;
  private sequence: number = 0;

  constructor(auditPath?: string) {
    this.auditPath = auditPath || path.join(process.cwd(), 'data', 'audit.jsonl');
    this.ensureDirectory();
    this.loadState();
  }

  private ensureDirectory(): void {
    const dir = path.dirname(this.auditPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  public append(
    proposal: AgentProposal,
    policyResult: PolicyResult,
    executionResult?: ExecutionResult,
    llmReasoning?: LLMReasoningMetadata
  ): AuditRecord {
    const recordWithoutHash: Omit<AuditRecord, 'record_hash'> = {
      sequence: this.sequence + 1,
      timestamp: new Date().toISOString(),
      proposal,
      policy_result: policyResult,
      execution_result: executionResult,
      llm_reasoning: llmReasoning,
      previous_hash: this.lastHash,
    };

    // Hash = SHA-256(previous_hash + canonical JSON of record)
    const payload = this.lastHash + JSON.stringify(recordWithoutHash);
    const recordHash = crypto
      .createHash('sha256')
      .update(payload)
      .digest('hex');

    const fullRecord: AuditRecord = {
      ...recordWithoutHash,
      record_hash: recordHash,
    };

    // Append to JSONL file
    fs.appendFileSync(this.auditPath, JSON.stringify(fullRecord) + '\n');

    this.lastHash = recordHash;
    this.sequence++;
    return fullRecord;
  }

  private loadState(): void {
    if (!fs.existsSync(this.auditPath)) {
      this.lastHash = GENESIS_HASH;
      this.sequence = 0;
      return;
    }

    const lines = fs
      .readFileSync(this.auditPath, 'utf-8')
      .trim()
      .split('\n')
      .filter(Boolean);

    if (lines.length === 0) {
      this.lastHash = GENESIS_HASH;
      this.sequence = 0;
      return;
    }

    try {
      const lastRecord: AuditRecord = JSON.parse(lines[lines.length - 1]!);
      this.lastHash = lastRecord.record_hash;
      this.sequence = lastRecord.sequence;
    } catch {
      this.lastHash = GENESIS_HASH;
      this.sequence = 0;
    }
  }

  public getLastHash(): string {
    return this.lastHash;
  }

  public getSequence(): number {
    return this.sequence;
  }
}
