import React, { useState } from 'react';
import { Lock, ShieldCheck, ShieldAlert, AlertOctagon, Link2, Eye, ShieldCheck as CheckIcon } from 'lucide-react';
import { AuditRecord, AuditVerificationResult } from '../types';

interface AuditLogProps {
  logs: AuditRecord[];
  verificationResult: AuditVerificationResult | null;
  onVerify: () => void;
  onTamper: (sequence: number) => void;
}

export const AuditLog: React.FC<AuditLogProps> = ({
  logs,
  verificationResult,
  onVerify,
  onTamper,
}) => {
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);
  const [tamperInput, setTamperInput] = useState<string>('1');

  const isChainValid = verificationResult?.valid ?? true;

  return (
    <div className="glass-card p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            Tamper-Evident Hash-Chained Audit Trail
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Cryptographic SHA-256 ledger (`data/audit.jsonl`). Every proposal, policy verdict, and execution is immutably chained.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Tamper Demo trigger */}
          <div className="flex items-center gap-2 bg-surface p-1.5 rounded-lg border border-[var(--border-subtle)]">
            <span className="text-[11px] text-[var(--text-muted)] font-medium pl-1">
              Tamper Seq #:
            </span>
            <input
              type="number"
              min="1"
              value={tamperInput}
              onChange={(e) => setTamperInput(e.target.value)}
              className="w-12 bg-slate-900 border border-slate-700 text-xs text-white px-1.5 py-0.5 rounded text-center"
            />
            <button
              onClick={() => onTamper(parseInt(tamperInput || '1', 10))}
              className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all shadow"
            >
              Tamper Record
            </button>
          </div>

          {/* Verify Integrity Button */}
          <button
            onClick={onVerify}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all shadow ${
              isChainValid
                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/50 animate-pulse'
            }`}
          >
            {isChainValid ? (
              <>
                <CheckIcon className="w-4 h-4 text-emerald-400" />
                <span>Verify Integrity (Valid)</span>
              </>
            ) : (
              <>
                <AlertOctagon className="w-4 h-4 text-rose-400" />
                <span>Tamper Detected! Re-verify</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Verification Status Alert Banner */}
      {verificationResult && (
        <div
          className={`mb-6 p-4 rounded-xl border flex items-center justify-between gap-4 text-xs ${
            verificationResult.valid
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {verificationResult.valid ? (
              <ShieldCheck className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertOctagon className="w-6 h-6 text-rose-400 flex-shrink-0 animate-bounce" />
            )}
            <div>
              <div className="font-bold text-sm">
                {verificationResult.valid
                  ? '✅ Cryptographic Hash-Chain Intact'
                  : '❌ CRITICAL: TAMPER DETECTED IN AUDIT TRAIL'}
              </div>
              <p className="mt-0.5 opacity-90">
                Verified {verificationResult.verified_records} of {verificationResult.total_records} records in audit sequence.
                {!verificationResult.valid && verificationResult.tampered_at && (
                  <span className="font-mono font-bold block mt-1 text-rose-300">
                    Chain breached at sequence #{verificationResult.tampered_at.sequence} (Expected: {verificationResult.tampered_at.expected_hash.slice(0, 12)}..., Received: {verificationResult.tampered_at.actual_hash.slice(0, 12)}...)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hash Chain Records Stream */}
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)] text-xs">
            No audit records found. Run Autopilot to populate the cryptographic audit trail.
          </div>
        ) : (
          logs.map((record) => {
            const isApproved = record.policy_result.verdict === 'APPROVED';
            return (
              <div
                key={record.sequence}
                className="p-4 rounded-xl bg-surface/60 border border-[var(--border-subtle)] hover:border-[var(--border-active)] transition-all font-mono text-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-xs">
                    #{record.sequence}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-sans font-bold">
                        {record.proposal.customer_id}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] font-sans">
                        {new Date(record.timestamp).toLocaleTimeString()}
                      </span>
                      <span
                        className={`badge text-[10px] ${
                          isApproved ? 'badge-approved' : 'badge-blocked'
                        }`}
                      >
                        {record.policy_result.verdict}
                      </span>
                    </div>

                    <div className="text-[11px] text-[var(--text-muted)] mt-1 flex items-center gap-2">
                      <Link2 className="w-3 h-3 text-slate-500" />
                      <span>Prev: {record.previous_hash.slice(0, 10)}...</span>
                      <span className="text-slate-600">➔</span>
                      <span className="text-emerald-400/90 font-semibold">
                        Hash: {record.record_hash.slice(0, 12)}...
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  <button
                    onClick={() => setSelectedRecord(record)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-sans transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Inspect JSON
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Record JSON Inspection Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-3xl w-full p-6 border border-emerald-500/30 max-h-[85vh] overflow-y-auto relative">
            <button
              onClick={() => setSelectedRecord(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white font-bold"
            >
              ✕
            </button>
            <h3 className="text-sm font-bold text-white font-mono mb-4">
              Audit Record #{selectedRecord.sequence} JSONPayload
            </h3>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto">
              {JSON.stringify(selectedRecord, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
