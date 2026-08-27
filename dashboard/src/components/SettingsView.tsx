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
  const [maxAutomatedAmount, setMaxAutomatedAmount] = useState<number>(10000);
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
    <div className="space-y-8 pb-16">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-900" />
            <h2 className="text-3xl font-extrabold text-[#091e42] tracking-tight font-sans">
              System Settings
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Configure autonomous recovery policies, AI inference models, safety limits, and cryptographic verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedFeedback && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200 flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Settings Saved to Database
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-slate-950 hover:bg-slate-800 disabled:opacity-50 text-white rounded-md text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </div>

      {/* 2. Direct Vertical Settings Sections */}
      <div className="space-y-6">
        {/* SECTION 1: MERCHANT RECOVERY POLICY (6 Core Rules) */}
        <div className="bg-white border border-slate-200/90 rounded-lg p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Deterministic Recovery Policy Guard
                </h3>
                <p className="text-xs text-slate-500">
                  Hard merchant boundaries enforced by PolicyEngine to ensure safety and compliance.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
              Active Enforcement
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* 1. Max Discount */}
            <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-900">
                  Max Discount Cap
                </label>
                <span className="text-xs font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
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
                Discounts above this threshold will be blocked.
              </p>
            </div>

            {/* 2. Max Automated Recovery */}
            <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-900">
                  Max Automatic Recovery
                </label>
                <span className="text-xs font-bold font-mono text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  ₹{maxAutomatedAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="number"
                value={maxAutomatedAmount}
                onChange={(e) => setMaxAutomatedAmount(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-400"
              />
              <p className="text-[11px] text-slate-500">
                Single transaction cap for automated recovery execution.
              </p>
            </div>

            {/* 3. Human Approval Threshold */}
            <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-900">
                  Human Approval Above
                </label>
                <span className="text-xs font-bold font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  ₹{highValueCap.toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="number"
                value={highValueCap}
                onChange={(e) => setHighValueCap(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-400"
              />
              <p className="text-[11px] text-slate-500">
                Proposals above this amount trigger ESCALATED verdict for human sign-off.
              </p>
            </div>

            {/* 4. Contact Frequency Limit */}
            <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg space-y-2">
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
                className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-400"
              />
              <p className="text-[11px] text-slate-500">
                Stopping rule: prevents outreach fatigue per customer.
              </p>
            </div>

            {/* 5. Minimum AI Confidence */}
            <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-900">
                  Minimum AI Confidence
                </label>
                <span className="text-xs font-bold font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
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
                Proposals with lower confidence scores will be blocked.
              </p>
            </div>

            {/* 6. Link Expiry */}
            <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-900">
                  Payment Link Expiry
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
                      "py-1.5 rounded text-xs font-bold transition-all cursor-pointer",
                      maxExpiry === hours
                        ? "bg-slate-950 text-white"
                        : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300"
                    )}
                  >
                    {hours}h
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500">
                Maximum validity window for payment links.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: ADVANCED (Collapsible) */}
        <div className="bg-white border border-slate-200/90 rounded-lg p-6 shadow-2xs space-y-4">
          <div
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Advanced AI & Model Configuration
                </h3>
                <p className="text-xs text-slate-500">
                  Underlying inference models, autonomy mode, and audit settings.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-600">
              {showAdvanced ? 'Collapse ▲' : 'Expand ▼'}
            </span>
          </div>

          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 animate-fadeIn">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Primary Inference Model
                </label>
                <button
                  type="button"
                  className="w-full p-3.5 rounded-lg border text-left transition-all border-slate-950 bg-slate-950 text-white shadow-xs"
                >
                  <div className="font-bold text-xs flex items-center justify-between">
                    <span>Gemini 3.6 Flash</span>
                    <span className="text-[10px] bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded font-bold">Active</span>
                  </div>
                  <div className="text-[11px] mt-1 font-mono text-slate-300">
                    High throughput, low latency reasoning (~140ms)
                  </div>
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Autonomy Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAutonomyMode('autonomous')}
                    className={cn(
                      "p-3.5 rounded-lg border text-left transition-all cursor-pointer",
                      autonomyMode === 'autonomous'
                        ? "border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs"
                        : "border-slate-200 bg-[#f8f9fa] text-slate-700 hover:border-slate-300"
                    )}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Full Autonomy</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Direct link execution
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAutonomyMode('supervised')}
                    className={cn(
                      "p-3.5 rounded-lg border text-left transition-all cursor-pointer",
                      autonomyMode === 'supervised'
                        ? "border-slate-950 bg-slate-950 text-white shadow-xs"
                        : "border-slate-200 bg-[#f8f9fa] text-slate-700 hover:border-slate-300"
                    )}
                  >
                    <div className="font-bold text-xs">Supervised</div>
                    <div className={cn("text-[11px] mt-1", autonomyMode === 'supervised' ? "text-slate-300" : "text-slate-500")}>
                      Hold for review
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
