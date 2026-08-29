import React, { useState, useEffect } from 'react';
import {
  Settings,
  Bot,
  ShieldCheck,
  CheckCircle2,
  Save,
  Zap,
  Lock,
  Sliders,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SystemSettings } from '../types';

interface SettingsViewProps {
  initialSettings?: SystemSettings | null;
  onSaveSettings?: (settings: Partial<SystemSettings>) => Promise<boolean>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  initialSettings,
  onSaveSettings,
}) => {
  const [model, setModel] = useState<'gemini-3.6-flash'>('gemini-3.6-flash');
  const [autonomyMode, setAutonomyMode] = useState<'autonomous' | 'supervised'>('autonomous');
  const [maxDiscount, setMaxDiscount] = useState<number>(15);
  const [maxExpiry, setMaxExpiry] = useState<number>(72);
  const [highValueCap, setHighValueCap] = useState<number>(25000);
  const [maxAutomatedAmount, setMaxAutomatedAmount] = useState<number>(100000);
  const [maxContacts, setMaxContacts] = useState<number>(3);
  const [minConfidence, setMinConfidence] = useState<number>(70);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialSettings) {
      if (initialSettings.autonomy_mode) setAutonomyMode(initialSettings.autonomy_mode as 'autonomous' | 'supervised');
      if (initialSettings.max_discount_percent !== undefined) setMaxDiscount(initialSettings.max_discount_percent);
      if (initialSettings.max_expiry_hours !== undefined) setMaxExpiry(initialSettings.max_expiry_hours);
      if (initialSettings.high_value_threshold_paise !== undefined) {
        setHighValueCap(Math.round(initialSettings.high_value_threshold_paise / 100));
      }
      if (initialSettings.max_automated_amount_paise !== undefined) {
        setMaxAutomatedAmount(Math.round(initialSettings.max_automated_amount_paise / 100));
      }
      if (initialSettings.max_contacts_per_week !== undefined) {
        setMaxContacts(initialSettings.max_contacts_per_week);
      }
      if (initialSettings.min_confidence_score !== undefined) {
        setMinConfidence(Math.round(initialSettings.min_confidence_score * 100));
      }
    }
  }, [initialSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSaveSettings) {
        await onSaveSettings({
          model,
          autonomy_mode: autonomyMode,
          max_discount_percent: maxDiscount,
          max_expiry_hours: maxExpiry,
          high_value_threshold_paise: highValueCap * 100,
          max_automated_amount_paise: maxAutomatedAmount * 100,
          max_contacts_per_week: maxContacts,
          min_confidence_score: minConfidence / 100,
        });
      }
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 font-sans animate-fadeIn">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#091e42] tracking-tight">
              Settings & Policy Configuration
            </h2>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Policy Engine Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure autonomous recovery boundaries, AI inference model selection, safety caps, and cryptographic ledger policies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedFeedback && (
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Saved to Database
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>

      {/* 2. Direct Vertical Settings Sections */}
      <div className="space-y-6">
        {/* SECTION 1: MERCHANT RECOVERY POLICY (6 Core Rules) */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-2xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Deterministic Recovery Policy Boundaries
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hard mathematical limits enforced by PolicyEngine before any Razorpay link is executed.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-mono self-start sm:self-auto">
              Hard Bounded
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* 1. Max Discount */}
            <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-900">
                  Max Discount Ceiling
                </label>
                <span className="text-xs font-bold font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {maxDiscount}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-950"
              />
              <p className="text-[11px] text-slate-500">
                Discounts proposed above this limit will be blocked.
              </p>
            </div>

            {/* 2. Max Automated Recovery */}
            <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-2.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-900">
                  Max Automatic Execution
                </label>
                <span className="text-xs font-bold font-mono text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  ₹{maxAutomatedAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="number"
                value={maxAutomatedAmount}
                onChange={(e) => setMaxAutomatedAmount(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-400"
              />
              <p className="text-[11px] text-slate-500">
                Maximum single invoice value for autonomous execution.
              </p>
            </div>

            {/* 3. Human Approval Threshold */}
            <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-2.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-900">
                  Manager Sign-Off Above
                </label>
                <span className="text-xs font-bold font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  ₹{highValueCap.toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="number"
                value={highValueCap}
                onChange={(e) => setHighValueCap(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-400"
              />
              <p className="text-[11px] text-slate-500">
                Amounts above this trigger ESCALATED verdict for review.
              </p>
            </div>

            {/* 4. Contact Frequency Limit */}
            <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-2.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-900">
                  Max Contacts / 7 Days
                </label>
                <span className="text-xs font-bold font-mono text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {maxContacts} Attempts
                </span>
              </div>
              <input
                type="number"
                min="1"
                max="10"
                value={maxContacts}
                onChange={(e) => setMaxContacts(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-400"
              />
              <p className="text-[11px] text-slate-500">
                Stopping rule: prevents outreach fatigue per customer.
              </p>
            </div>

            {/* 5. Minimum AI Confidence */}
            <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-900">
                  Minimum AI Confidence
                </label>
                <span className="text-xs font-bold font-mono text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {minConfidence}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={minConfidence}
                onChange={(e) => setMinConfidence(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-950"
              />
              <p className="text-[11px] text-slate-500">
                Proposals with confidence scores below this floor will be blocked.
              </p>
            </div>

            {/* 6. Link Expiry */}
            <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-2.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-900">
                  Link Validity Window
                </label>
                <span className="text-xs font-bold font-mono text-slate-900">
                  {maxExpiry} Hours
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[12, 24, 48, 72].map((hours) => (
                  <button
                    key={hours}
                    type="button"
                    onClick={() => setMaxExpiry(hours)}
                    className={cn(
                      'py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                      maxExpiry === hours
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                    )}
                  >
                    {hours}h
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500">
                Maximum expiry window for generated payment links.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: ADVANCED CONFIGURATION (Collapsible) */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] space-y-4">
          <div
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Advanced AI & Model Configuration
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Underlying inference models, autonomy mode, and audit settings.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              {showAdvanced ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 animate-fadeIn">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                  Primary Inference Model
                </label>
                <div className="w-full p-4 rounded-xl border border-slate-900 bg-slate-900 text-white shadow-xs space-y-1">
                  <div className="font-bold text-xs flex items-center justify-between">
                    <span>Gemini 3.6 Flash</span>
                    <span className="text-[10px] bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded font-bold font-mono">
                      Active
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-300">
                    High throughput structured JSON reasoning (~140ms latency)
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                  Autonomy Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAutonomyMode('autonomous')}
                    className={cn(
                      'p-4 rounded-xl border text-left transition-all cursor-pointer space-y-1',
                      autonomyMode === 'autonomous'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs ring-1 ring-emerald-500/20'
                        : 'border-slate-200 bg-slate-50/80 text-slate-700 hover:border-slate-300'
                    )}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Autonomous</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Direct link execution
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAutonomyMode('supervised')}
                    className={cn(
                      'p-4 rounded-xl border text-left transition-all cursor-pointer space-y-1',
                      autonomyMode === 'supervised'
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                        : 'border-slate-200 bg-slate-50/80 text-slate-700 hover:border-slate-300'
                    )}
                  >
                    <div className="font-bold text-xs">Supervised</div>
                    <div className={cn('text-[11px]', autonomyMode === 'supervised' ? 'text-slate-300' : 'text-slate-500')}>
                      Require review
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
