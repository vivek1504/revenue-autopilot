import React, { useState } from 'react';
import { Lock, ShieldCheck, AlertOctagon, Link2, Eye, RefreshCw, CheckCircle2, FileText } from 'lucide-react';
import { AuditRecord, AuditVerificationResult } from '../types';

interface AuditLedgerViewProps {
  logs: AuditRecord[];
  verificationResult: AuditVerificationResult | null;
  onVerify: () => void;
  onTamper: (sequence: number) => void;
}

export const AuditLedgerView: React.FC<AuditLedgerViewProps> = ({
  logs,
  verificationResult,
  onVerify,
  onTamper,
}) => {
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);
  const [tamperInput, setTamperInput] = useState<string>('1');

  const isChainValid = verificationResult?.valid ?? true;

  return (
    <div className="space-y-6">
      {/* Header & Verification Controls */}
      <div className="panel-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Tamper-Evident SHA-256 Audit Trail
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Cryptographic ledger (<code className="text-sky-300 font-mono">data/audit.jsonl</code>). Every AI proposal, policy verdict, and Razorpay execution payload is hashed in an immutable forward chain.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-3">
          {/* Tamper test trigger */}
          <div className="flex items-center gap-1.5 bg-[#14161a] p-1.5 rounded-lg border border-[#23252b]">
            <span className="text-[11px] text-slate-400 pl-1 font-medium">Tamper Seq:</span>
            <input
              type="number"
              min="1"
              value={tamperInput}
              onChange={(e) => setTamperInput(e.target.value)}
              className="w-10 bg-[#09090b] border border-[#23252b] text-xs text-white px-1.5 py-0.5 rounded text-center font-mono"
            />
            <button
              onClick={() => onTamper(parseInt(tamperInput || '1', 10))}
              className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition-all shadow-sm"
            >
              Tamper Record
            </button>
          </div>

          {/* Verification CTA */}
          <button
            onClick={onVerify}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all shadow ${
              isChainValid
                ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/50 animate-pulse'
            }`}
          >
            {isChainValid ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Verify Chain Integrity</span>
              </>
            ) : (
              <>
                <AlertOctagon className="w-4 h-4 text-rose-400" />
                <span>Chain Breached! Re-Verify</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Verification Status Alert Banner */}
      {verificationResult && (
        <div
          className={`p-4 rounded-lg border flex items-center justify-between gap-4 text-xs ${
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
                  ? 'Cryptographic Hash-Chain Verified & Intact'
                  : 'CRITICAL: TAMPER DETECTED IN AUDIT TRAIL'}
              </div>
              <p className="mt-0.5 opacity-90 text-[11px]">
                Verified {verificationResult.verified_records} of {verificationResult.total_records} records in audit sequence.
                {!verificationResult.valid && verificationResult.tampered_at && (
                  <span className="font-mono font-bold block mt-1 text-rose-300">
                    Chain breached at sequence #{verificationResult.tampered_at.sequence} (Expected: {verificationResult.tampered_at.expected_hash.slice(0, 12)}..., Actual: {verificationResult.tampered_at.actual_hash.slice(0, 12)}...)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hash Chain Records */}
      <div className="space-y-3">
        {logs.length === 0 ? (
          <div className="panel-card p-12 text-center text-slate-500 text-xs">
            No audit records logged yet. Run Autopilot to populate the cryptographic audit trail.
          </div>
        ) : (
          logs.map((record) => {
            const isApproved = record.policy_result.verdict === 'APPROVED';
            return (
              <div
                key={record.sequence}
                className="panel-card p-4 hover:border-sky-500/30 transition-all font-mono text-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-[#16181d] border border-[#282b34] flex items-center justify-center font-bold text-slate-300 text-xs">
                    #{record.sequence}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-sans font-bold text-xs">
                        {record.proposal.customer_id}
                      </span>
                      <span className="text-[10px] text-slate-500 font-sans">
                        {new Date(record.timestamp).toLocaleTimeString()}
                      </span>
                      <span
                        className={`status-chip text-[9px] ${
                          isApproved ? 'status-chip-approved' : 'status-chip-blocked'
                        }`}
                      >
                        {record.policy_result.verdict}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                      <Link2 className="w-3 h-3 text-slate-500" />
                      <span>Prev: {record.previous_hash.slice(0, 12)}...</span>
                      <span className="text-slate-600">➔</span>
                      <span className="text-emerald-400 font-semibold">
                        Hash: {record.record_hash.slice(0, 16)}...
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  <button
                    onClick={() => setSelectedRecord(record)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#14161a] hover:bg-[#1c1f26] text-slate-300 text-[11px] font-sans font-medium border border-[#23252b] hover:border-sky-500/30 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5 text-sky-400" />
                    <span>Inspect JSON</span>
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
          <div className="bg-[#111216] border border-[#282b34] rounded-xl max-w-3xl w-full p-6 max-h-[85vh] overflow-y-auto relative shadow-2xl">
            <button
              onClick={() => setSelectedRecord(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white font-bold p-1 rounded-md bg-[#181a20]"
            >
              ✕
            </button>
            <h3 className="text-xs font-bold text-white font-mono mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-400" />
              Audit Record #{selectedRecord.sequence} JSON Payload
            </h3>
            <pre className="p-4 rounded-lg bg-[#09090b] border border-[#23252b] text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed">
              {JSON.stringify(selectedRecord, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
