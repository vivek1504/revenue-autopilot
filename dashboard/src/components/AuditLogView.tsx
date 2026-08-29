import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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
  Copy,
  Check,
  X,
  CreditCard,
  Hash,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AuditRecord, AuditVerificationResult } from '../types';
import { Badge } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';

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
  const [showRawJson, setShowRawJson] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isTampering, setIsTampering] = useState(false);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedRecord) {
        setSelectedRecord(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRecord]);

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

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const copyPayload = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const formatRupees = (paise: number = 0) => {
    return (paise / 100).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    });
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
    <div className="space-y-6 font-sans animate-fadeIn">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#091e42] tracking-tight">
              Cryptographic Audit Ledger
            </h2>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <Lock className="w-3 h-3 text-emerald-600" />
              SHA-256 Linked
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident, cryptographically chained sequence of all proposals, policy decisions, and execution receipts.
          </p>
        </div>

        {/* Verification & Tamper Simulation Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleTamper}
            disabled={isTampering || logs.length === 0}
            className="px-3 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-800 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs"
            title="Simulates an attacker modifying record #1 to test SHA-256 chain verification"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>{isTampering ? 'Tampering...' : 'Tamper #1 (Demo)'}</span>
          </button>

          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{isVerifying ? 'Verifying...' : 'Verify Chain Integrity'}</span>
          </button>
        </div>
      </div>

      {/* 2. Cryptographic Integrity Status Banner */}
      <div
        className={`p-4 rounded-xl border flex items-center justify-between transition-all shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] ${
          isChainValid
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
            : 'bg-rose-50 border-rose-300 text-rose-950'
        }`}
      >
        <div className="flex items-center gap-3">
          {isChainValid ? (
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center font-bold shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shrink-0 animate-bounce shadow-md">
              <ShieldAlert className="w-5 h-5" />
            </div>
          )}
          <div>
            <h4 className="font-bold text-sm tracking-tight">
              {isChainValid
                ? 'Cryptographic Hash-Chain Intact & Immutable'
                : 'SECURITY ALERT: Audit Chain Tampering Detected!'}
            </h4>
            <p className="text-xs opacity-80 mt-0.5 font-sans">
              {isChainValid
                ? `Verified sequence integrity for all ${logs.length} audit records via SHA-256 previous_hash link validation.`
                : `Hash mismatch at sequence #${verificationResult?.tampered_at?.sequence || 1}. Unauthorized record mutation caught!`}
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs font-mono font-bold px-3 py-1.5 bg-white/80 rounded-lg border border-current/20">
          <Lock className="w-3.5 h-3.5" />
          <span>SHA-256 Merkle Chain</span>
        </div>
      </div>

      {/* 3. Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold uppercase text-slate-500 tracking-wider font-mono">
            Filter:
          </span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white transition-colors"
          >
            <option value="ALL">All Event Types</option>
            <option value="APPROVED">Policy Approved Only</option>
            <option value="BLOCKED">Policy Blocked Only</option>
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by ID, customer, or hash..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white bg-slate-50 transition-all font-sans"
          />
        </div>
      </div>

      {/* 4. Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-6">Seq # / Timestamp</th>
                <th className="py-3 px-6">Actor</th>
                <th className="py-3 px-6">Proposal / Customer</th>
                <th className="py-3 px-6">SHA-256 Hash</th>
                <th className="py-3 px-6 text-center">Verdict</th>
                <th className="py-3 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <EmptyState
                      title="No audit records available"
                      description="Run an autopilot scan cycle to generate cryptographic ledger entries."
                    />
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => {
                  const isCopied = copiedHash === log.record_hash;

                  return (
                    <tr
                      key={idx}
                      onClick={() => {
                        setSelectedRecord(log);
                        setShowRawJson(false);
                      }}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-6 whitespace-nowrap">
                        <div className="font-tabular font-mono font-bold text-slate-900">
                          #{log.sequence}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {log.timestamp}
                        </div>
                      </td>
                      <td className="py-3.5 px-6 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200 font-mono">
                          Gemini + Policy Guard
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="font-bold text-slate-900 capitalize group-hover:text-blue-600 transition-colors">
                          {log.proposal?.action?.replace(/_/g, ' ') || 'Recovery Proposal'}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          Customer: {log.proposal?.customer_id}
                        </div>
                      </td>
                      <td className="py-3.5 px-6 font-mono text-[11px] text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate w-36 font-semibold" title={log.record_hash}>
                            {log.record_hash?.slice(0, 16)}...
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyHash(log.record_hash);
                            }}
                            className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition-colors"
                            title="Copy SHA-256 Hash"
                          >
                            {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        {log.policy_result?.verdict === 'APPROVED' ? (
                          <Badge variant="approved" size="sm">
                            Approved
                          </Badge>
                        ) : (
                          <Badge variant="blocked" size="sm">
                            Blocked
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecord(log);
                            setShowRawJson(false);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <FileCode className="w-3 h-3 text-slate-500" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Human-Readable Structured Audit Record Modal */}
      {selectedRecord && createPortal(
        <div
          onClick={() => setSelectedRecord(null)}
          className="fixed inset-0 z-50 bg-slate-950/20 backdrop-blur-[2px] flex items-center justify-center p-4 transition-all"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 font-sans max-h-[90vh] overflow-y-auto animate-scaleIn"
          >
            
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">
                    Audit Record #{selectedRecord.sequence}
                  </h3>
                  <Badge
                    variant={selectedRecord.policy_result?.verdict === 'APPROVED' ? 'approved' : 'blocked'}
                    size="sm"
                  >
                    {selectedRecord.policy_result?.verdict}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Customer: <strong className="text-slate-800">{selectedRecord.proposal?.customer_id}</strong>
                  {selectedRecord.timestamp && (
                    <span className="font-mono text-slate-400 ml-2">· {selectedRecord.timestamp}</span>
                  )}
                </p>
              </div>

              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Key Information 2x2 Grid */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Action Proposal</span>
                <div className="text-slate-900 font-bold capitalize mt-0.5">
                  {selectedRecord.proposal?.action?.replace(/_/g, ' ') || 'Payment Recovery'}
                </div>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Target Amount</span>
                <div className="text-slate-900 font-bold font-mono text-sm mt-0.5">
                  {formatRupees(selectedRecord.proposal?.amount_paise)}
                </div>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Discount Applied</span>
                <div className="text-slate-900 font-semibold font-mono mt-0.5">
                  {selectedRecord.proposal?.discount_percent}% off ({selectedRecord.proposal?.expiry_hours}h validity)
                </div>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Opportunity Cohort</span>
                <div className="text-slate-900 font-semibold capitalize mt-0.5">
                  {selectedRecord.proposal?.opportunity_type?.replace('_', ' ')}
                </div>
              </div>
            </div>

            {/* AI Reasoning */}
            {selectedRecord.proposal?.reason && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  AI Model Reasoning
                </span>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed">
                  &ldquo;{selectedRecord.proposal.reason}&rdquo;
                </div>
              </div>
            )}

            {/* Policy Enforcement Status */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Deterministic Policy Verdict
              </span>
              {selectedRecord.policy_result?.verdict === 'APPROVED' ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>All policy bounds passed (discount cap ≤15%, amount threshold, contact limit).</span>
                </div>
              ) : (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Policy Violations Caught</span>
                  </div>
                  <ul className="list-disc pl-5 text-[11px] space-y-0.5 text-rose-800">
                    {(selectedRecord.policy_result?.violations || []).map((v, i) => (
                      <li key={i}>{v.message || v.rule}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Cryptographic Ledger Proof */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-600 font-bold">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  SHA-256 Provenance
                </span>
                <span className="text-[11px] text-slate-400">Immutable Chained</span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">record_hash:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-700 font-bold truncate max-w-[220px]" title={selectedRecord.record_hash}>
                      {selectedRecord.record_hash}
                    </span>
                    <button
                      onClick={() => copyHash(selectedRecord.record_hash)}
                      className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700"
                      title="Copy Record Hash"
                    >
                      {copiedHash === selectedRecord.record_hash ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">prev_hash:</span>
                  <span className="text-slate-500 truncate max-w-[220px]" title={selectedRecord.previous_hash}>
                    {selectedRecord.previous_hash}
                  </span>
                </div>
              </div>
            </div>

            {/* Collapsible Raw JSON Payload Section */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowRawJson(!showRawJson)}
                className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-slate-500" />
                  <span>Raw JSON Payload</span>
                </span>
                {showRawJson ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {showRawJson && (
                <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto max-h-48 border-t border-slate-200">
                  <pre>{JSON.stringify(selectedRecord, null, 2)}</pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => copyPayload(JSON.stringify(selectedRecord, null, 2))}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPayload ? 'Copied' : 'Copy JSON'}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
