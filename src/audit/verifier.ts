import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { AuditRecord } from '../shared/types';
import { GENESIS_HASH, canonicalJsonStringify } from './logger';

export interface VerificationResult {
  valid: boolean;
  total_records: number;
  verified_records: number;
  tampered_at?: {
    sequence: number;
    expected_hash: string;
    actual_hash: string;
    record_timestamp: string;
  };
}

export function verifyAuditIntegrity(auditPath?: string): VerificationResult {
  const targetPath =
    auditPath || path.join(process.cwd(), 'data', 'audit.jsonl');

  if (!fs.existsSync(targetPath)) {
    return {
      valid: true,
      total_records: 0,
      verified_records: 0,
    };
  }

  const lines = fs
    .readFileSync(targetPath, 'utf-8')
    .trim()
    .split('\n')
    .filter(Boolean);

  if (lines.length === 0) {
    return {
      valid: true,
      total_records: 0,
      verified_records: 0,
    };
  }

  let expectedPreviousHash = GENESIS_HASH;

  for (let i = 0; i < lines.length; i++) {
    const record: AuditRecord = JSON.parse(lines[i]!);

    // 1. Check chain continuity: record's previous_hash must match previous record's hash
    if (record.previous_hash !== expectedPreviousHash) {
      return {
        valid: false,
        total_records: lines.length,
        verified_records: i,
        tampered_at: {
          sequence: record.sequence,
          expected_hash: expectedPreviousHash,
          actual_hash: record.previous_hash,
          record_timestamp: record.timestamp,
        },
      };
    }

    // 2. Recompute record hash using deterministic canonical JSON
    const { record_hash, ...recordWithoutHash } = record;
    const payload =
      expectedPreviousHash + canonicalJsonStringify(recordWithoutHash);
    const computedHash = crypto
      .createHash('sha256')
      .update(payload)
      .digest('hex');

    if (computedHash !== record_hash) {
      return {
        valid: false,
        total_records: lines.length,
        verified_records: i,
        tampered_at: {
          sequence: record.sequence,
          expected_hash: computedHash,
          actual_hash: record_hash,
          record_timestamp: record.timestamp,
        },
      };
    }

    expectedPreviousHash = record_hash;
  }

  return {
    valid: true,
    total_records: lines.length,
    verified_records: lines.length,
  };
}
