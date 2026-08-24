import fs from 'fs';
import path from 'path';
import { verifyAuditIntegrity } from '../src/audit/verifier';
import { AuditRecord } from '../src/shared/types';

function main() {
  const auditPath = path.join(process.cwd(), 'data', 'audit.jsonl');
  const args = process.argv.slice(2);
  const tamperIdx = args.indexOf('--tamper');

  if (tamperIdx !== -1 && args[tamperIdx + 1]) {
    const seqToTamper = parseInt(args[tamperIdx + 1]!, 10);
    console.log(`\n⚠️ TAMPER DEMO MODE: Tampering sequence #${seqToTamper} in ${auditPath}...`);

    if (!fs.existsSync(auditPath)) {
      console.error(`❌ Audit log file does not exist at ${auditPath}. Cannot tamper.`);
      process.exit(1);
    }

    const lines = fs.readFileSync(auditPath, 'utf-8').trim().split('\n').filter(Boolean);
    let tampered = false;

    const modifiedLines = lines.map((line) => {
      const record: AuditRecord = JSON.parse(line);
      if (record.sequence === seqToTamper) {
        tampered = true;
        // Tamper amount or reason in proposal
        record.proposal.amount_paise += 100000;
        record.proposal.reason += ' (TAMPERED BY ATTACKER)';
        return JSON.stringify(record);
      }
      return line;
    });

    if (!tampered) {
      console.error(`❌ Sequence #${seqToTamper} not found in audit log.`);
      process.exit(1);
    }

    fs.writeFileSync(auditPath, modifiedLines.join('\n') + '\n');
    console.log(`⚠️ Record #${seqToTamper} successfully tampered! Now running verifier...\n`);
  }

  console.log('🔍 Running Audit Log Integrity Verification...');
  const result = verifyAuditIntegrity(auditPath);

  console.log('========================================');
  console.log('🛡️ AUDIT TRAIL VERIFICATION RESULT');
  console.log('========================================');
  console.log(`Status:           ${result.valid ? '✅ VALID (INTEGRITY INTACT)' : '❌ CORRUPTED / TAMPERED'}`);
  console.log(`Total Records:    ${result.total_records}`);
  console.log(`Verified Records: ${result.verified_records}`);

  if (!result.valid && result.tampered_at) {
    console.log('----------------------------------------');
    console.log(`❌ TAMPER DETECTED AT RECORD #${result.tampered_at.sequence}`);
    console.log(`Timestamp:     ${result.tampered_at.record_timestamp}`);
    console.log(`Expected Hash: ${result.tampered_at.expected_hash}`);
    console.log(`Actual Hash:   ${result.tampered_at.actual_hash}`);
    console.log('----------------------------------------');
    process.exit(1);
  }

  console.log('========================================\n');
}

main();
