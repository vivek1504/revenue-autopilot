import React, { useState } from 'react';
import {
  History,
  ShieldCheck,
  ShieldAlert,
  Lock,
  RefreshCw,
  AlertTriangle,
  Search,
  CheckCircle2,
  XCircle,
  FileCode,
  Download,
} from 'lucide-react';
import { AuditRecord, AuditVerificationResult } from '../types';

interface AuditLogViewProps {
  logs: AuditRecord[];
  verificationResult: AuditVerificationResult | null;
  onVerify: () => Promise<any>;
  onTamper: (sequence: number) => Promise<any>;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({
  logs,
  verificationResult,
  onVerify,
  onTamper,
}) => {
  const [selectedRecord, setSelectedRecord] = useState<AuditRecord | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isTampering, setIsTampering] = useState(false);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      await onVerify();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTamper = async () => {
    setIsTampering(true);
    try {
      await onTamper(1);
    } finally {
      setIsTampering(false);
    }
  };

  const isChainValid = verificationResult?.valid ?? true;

  const filteredLogs = logs.filter((log) => {
    const matchesFilter =
      filterType === 'ALL' ||
      (filterType === 'APPROVED' && log.policy_result?.verdict === 'APPROVED') ||
      (filterType === 'BLOCKED' && log.policy_result?.verdict === 'BLOCKED');
    const matchesSearch =
      search === '' ||
      log.proposal?.customer_id?.toLowerCase().includes(search.toLowerCase()) ||
      log.proposal?.action?.toLowerCase().includes(search.toLowerCase()) ||
      log.record_hash?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-2 border-b border-[#e2e8f0]">
        <div>
          <h2 className="text-2xl font-bold text-slate-950 tracking-tight font-sans flex items-center gap-2">
            <History className="w-6 h-6 text-slate-900" />
            System Audit Log
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident cryptographic SHA-256 hash-chained ledger of all proposals, policy decisions, and executions.
          </p>
        </div>

        {/* Verification & Tamper Simulation Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTamper}
            disabled={isTampering || logs.length === 0}
            className="px-3 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-800 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
            title="Simulates an attacker modifying record #1 in the database/file to test SHA-256 chain verification"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Tamper Record #1 (Demo)</span>
          </button>

          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-white rounded-md text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>Verify Integrity</span>
          </button>
        </div>
      </div>

      {/* Cryptographic Integrity Status Banner */}
      <div
        className={`p-4 rounded-lg border flex items-center justify-between transition-all ${
          isChainValid
            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
            : 'bg-rose-50 border-rose-300 text-rose-950'
        }`}
      >
        <div className="flex items-center gap-3">
          {isChainValid ? (
            <div className="w-9 h-9 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5 text-slate-950 fill-current" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold animate-bounce">
              <ShieldAlert className="w-5 h-5" />
            </div>
          )}
          <div>
            <h4 className="font-bold text-sm">
              {isChainValid
                ? 'Cryptographic Hash-Chain Intact & Immutable'
                : 'SECURITY ALERT: Audit Chain Tampering Detected!'}
            </h4>
            <p className="text-xs opacity-80 mt-0.5 font-sans">
              {isChainValid
                ? `Verified sequence integrity for all ${logs.length} audit records via SHA-256 prev_hash links.`
                : `Hash mismatch at sequence #${verificationResult?.tampered_at?.sequence || 1}. Unauthorized mutation caught!`}
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs font-tabular font-bold">
          <Lock className="w-4 h-4" />
          <span>SHA-256 Chained</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="institutional-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">Filters:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1 bg-white border border-[#cbd5e1] rounded text-xs font-semibold text-slate-800 focus:outline-none"
          >
            <option value="ALL">All Event Types</option>
            <option value="APPROVED">Policy Approved Only</option>
            <option value="BLOCKED">Policy Blocked Only</option>
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, customer, hash..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1 border border-[#cbd5e1] rounded text-xs text-slate-900 focus:outline-none focus:bg-white bg-[#f8f9ff]"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="institutional-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#f8f9ff] border-b border-[#e2e8f0]">
              <tr className="text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Seq # / Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Proposal / Customer</th>
                <th className="py-3 px-4">SHA-256 Hash</th>
                <th className="py-3 px-4 text-center">Verdict</th>
                <th className="py-3 px-4 text-right">Inspect Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {filteredLogs.map((log, idx) => (
                <tr
                  key={idx}
                  onClick={() => setSelectedRecord(log)}
                  className="hover:bg-[#f8f9ff] transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-tabular font-bold text-slate-900">#{log.sequence}</div>
                    <div className="text-[10px] text-slate-400 font-tabular">{log.timestamp}</div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      Gemini + Deterministic Guard
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 capitalize">
                      {log.proposal?.action?.replace(/_/g, ' ') || 'Action proposal'}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      Customer: {log.proposal?.customer_id}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono font-tabular text-[11px] text-slate-600">
                    <div className="truncate w-40" title={log.record_hash}>
                      {log.record_hash?.slice(0, 16)}...
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {log.policy_result?.verdict === 'APPROVED' ? (
                      <span className="status-badge status-badge-approved">Approved</span>
                    ) : (
                      <span className="status-badge status-badge-blocked">Blocked</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRecord(log);
                      }}
                      className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-[#cbd5e1] text-slate-800 font-semibold text-[11px] transition-colors inline-flex items-center gap-1"
                    >
                      <FileCode className="w-3 h-3 text-slate-500" />
                      <span>JSON</span>
                    </button>
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No audit records available. Run an autopilot intelligence cycle to create cryptographic entries.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Payload Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-300 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-950 font-sans flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  Audit Record #{selectedRecord.sequence}
                </h3>
                <p className="text-xs font-mono text-slate-500 mt-0.5">Hash: {selectedRecord.record_hash}</p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#09090b] text-emerald-400 p-4 rounded-lg font-mono text-xs overflow-x-auto">
              <pre>{JSON.stringify(selectedRecord, null, 2)}</pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-950 text-white rounded-md text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
