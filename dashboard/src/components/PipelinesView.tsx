import React, { useState } from 'react';
import { GitFork, Database, Brain, ShieldCheck, Send, CheckCheck, Sparkles } from 'lucide-react';
import { DashboardSummary, ProcessedAction } from '../types';
import { PipelinesStepper, PipelineStage } from './pipelines/PipelinesStepper';
import { Stage1Discovery } from './pipelines/Stage1Discovery';
import { Stage2Reasoning } from './pipelines/Stage2Reasoning';
import { Stage3Policy } from './pipelines/Stage3Policy';
import { Stage4Gateway } from './pipelines/Stage4Gateway';
import { Stage5Settlement } from './pipelines/Stage5Settlement';

interface PipelinesViewProps {
  items: ProcessedAction[];
  summary: DashboardSummary | null;
  onSelectVerdict: (item: ProcessedAction) => void;
  onSimulatePayment?: (offerId: string) => Promise<any>;
}

export const PipelinesView: React.FC<PipelinesViewProps> = ({
  items,
  summary,
  onSelectVerdict,
  onSimulatePayment,
}) => {
  const [selectedStage, setSelectedStage] = useState<number>(3);

  const formatRupees = (paise: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(paise / 100);
  };

  const formatRupeesExact = (paise: number) => {
    return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Funnel Counts & Volume
  const totalOpps = items.length || summary?.opportunities_count || 0;
  const approvedItems = items.filter(
    (i) => i.verdict.verdict === 'APPROVED' || i.offerStatus === 'DISPATCHED' || i.offerStatus === 'RECOVERED'
  );
  const blockedItems = items.filter(
    (i) => i.verdict.verdict === 'BLOCKED' && i.offerStatus !== 'DISPATCHED' && i.offerStatus !== 'RECOVERED'
  );
  const recoveredItems = items.filter((i) => i.offerStatus === 'RECOVERED');
  const dispatchedItems = items.filter(
    (i) => i.offerStatus === 'DISPATCHED' || (i.verdict.verdict === 'APPROVED' && (!i.offerStatus || i.offerStatus === 'DISPATCHED'))
  );
  const approvedOpps = approvedItems.length;
  const blockedOpps = blockedItems.length;
  const recoveredOpps = summary?.recovered_count ?? recoveredItems.length;
  const recoveredValuePaise = summary?.recovered_value_paise || 0;

  const totalVolumePaise = items.reduce((sum, i) => sum + (i.proposal.amount_paise || 0), 0);
  const approvedVolumePaise = approvedItems.reduce((sum, i) => {
    const discounted = Math.round(
      (i.proposal.amount_paise || 0) * (1 - (i.proposal.discount_percent || 0) / 100)
    );
    return sum + discounted;
  }, 0);
  const blockedVolumePaise = blockedItems.reduce((sum, i) => sum + (i.proposal.amount_paise || 0), 0);

  const stages: PipelineStage[] = [
    {
      id: 1,
      title: 'Database Scan',
      subtitle: 'Postgres Discovery',
      icon: Database,
      count: `${totalOpps} Candidates`,
      volume: formatRupees(totalVolumePaise),
      latency: '~1.8ms',
      badge: 'Signal Ingest',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    },
    {
      id: 2,
      title: 'AI Reasoning',
      subtitle: 'Gemini 3.6 Flash',
      icon: Brain,
      count: `${totalOpps} Proposals`,
      volume: formatRupees(totalVolumePaise),
      latency: '~140ms',
      badge: 'Structured LLM',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    },
    {
      id: 3,
      title: 'Policy Guard',
      subtitle: 'Deterministic Safety',
      icon: ShieldCheck,
      count: `${approvedOpps} Passed / ${blockedOpps} Blocked`,
      volume: formatRupees(approvedVolumePaise),
      latency: '<0.5ms',
      badge: '100% Policy Bound',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
    },
    {
      id: 4,
      title: 'Gateway Dispatch',
      subtitle: 'Razorpay Links',
      icon: Send,
      count: `${approvedOpps} Dispatched`,
      volume: formatRupees(approvedVolumePaise),
      latency: '~45ms',
      badge: 'Idempotent Dispatch',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    },
    {
      id: 5,
      title: 'Settlement',
      subtitle: 'Webhook Verified',
      icon: CheckCheck,
      count: `${recoveredOpps} Recovered`,
      volume: formatRupees(recoveredValuePaise),
      latency: 'Real-Time',
      badge: 'HMAC SHA-256',
      badgeColor: 'bg-emerald-100 text-emerald-950 border-emerald-300',
    },
  ];

  return (
    <div className="space-y-8 pb-16 font-sans animate-fadeIn">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#091e42] tracking-tight">
              Autonomous Recovery Pipeline
            </h2>

          </div>
          <p className="text-xs text-slate-500 mt-1">
            Interactive multi-stage execution pipeline: select any stage to inspect its unique runtime telemetry, generative reasoning, and gateway state.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 shadow-2xs">
            Pipeline Yield: <strong className="text-emerald-700 font-tabular font-extrabold">{totalOpps > 0 ? ((approvedOpps / totalOpps) * 100).toFixed(1) : 0}%</strong>
          </div>
          <div className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 shadow-2xs">
            Candidates: <strong className="text-slate-900 font-tabular font-extrabold">{totalOpps} Opps</strong>
          </div>
        </div>
      </div>

      {/* 2. Interactive 5-Stage Funnel Stepper */}
      <PipelinesStepper
        stages={stages}
        selectedStage={selectedStage}
        onSelectStage={setSelectedStage}
      />

      {/* 3. Stage Views */}
      {selectedStage === 1 && (
        <Stage1Discovery
          items={items}
          totalVolumePaise={totalVolumePaise}
          formatRupees={formatRupees}
          formatRupeesExact={formatRupeesExact}
        />
      )}
      {selectedStage === 2 && (
        <Stage2Reasoning
          items={items}
          onSelectVerdict={onSelectVerdict}
        />
      )}
      {selectedStage === 3 && (
        <Stage3Policy
          items={items}
          approvedOpps={approvedOpps}
          blockedOpps={blockedOpps}
          blockedVolumePaise={blockedVolumePaise}
          formatRupees={formatRupees}
          formatRupeesExact={formatRupeesExact}
          onSelectVerdict={onSelectVerdict}
        />
      )}
      {selectedStage === 4 && (
        <Stage4Gateway
          approvedItems={approvedItems}
          approvedOpps={approvedOpps}
          approvedVolumePaise={approvedVolumePaise}
          formatRupees={formatRupees}
          formatRupeesExact={formatRupeesExact}
        />
      )}
      {selectedStage === 5 && (
        <Stage5Settlement
          recoveredItems={recoveredItems}
          dispatchedItems={dispatchedItems}
          recoveredOpps={recoveredOpps}
          recoveredValuePaise={recoveredValuePaise}
          formatRupees={formatRupees}
          formatRupeesExact={formatRupeesExact}
          onSimulatePayment={onSimulatePayment}
        />
      )}
    </div>
  );
};
