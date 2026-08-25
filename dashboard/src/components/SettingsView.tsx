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
  const [highValueCap, setHighValueCap] = useState<number>(50000);
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
        {/* SECTION 1: AI INTELLIGENCE & AUTONOMY */}
        <div className="bg-white border border-slate-200/90 rounded-lg p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  AI Intelligence & Autonomy Engine
                </h3>
                <p className="text-xs text-slate-500">
                  Generative reasoning models and structured decision bounds for opportunity recovery.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
              Active Reasoning
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Model Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                Primary Inference Model
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Gemini 3.6 Flash (Active Default) */}
                <button
                  type="button"
                  onClick={() => setModel('gemini-3.6-flash')}
                  className={cn(
                    "p-3.5 rounded-lg border text-left transition-all cursor-pointer border-slate-950 bg-slate-950 text-white shadow-xs"
                  )}
                >
                  <div className="font-bold text-xs flex items-center justify-between">
                    <span>Gemini 3.6 Flash</span>
                    <span className="text-[10px] bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded font-bold">Active</span>
                  </div>
                  <div className="text-[11px] mt-1 font-mono text-slate-300">
                    ~140ms latency (Supported)
                  </div>
                </button>

                {/* Gemini 2.0 Flash (Disabled / Deprecated) */}
                <div
                  className="p-3.5 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400 opacity-60 cursor-not-allowed select-none"
                  title="Gemini 2.0 Flash is no longer supported"
                >
                  <div className="font-bold text-xs flex items-center justify-between">
                    <span className="line-through">Gemini 2.0 Flash</span>
                    <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded font-bold uppercase">Unsupported</span>
                  </div>
                  <div className="text-[11px] mt-1 text-slate-400">
                    No longer supported
                  </div>
                </div>
              </div>
            </div>

            {/* Autonomy Mode */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                Agent Autonomy Level
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
                    Direct automated link execution
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
                  <div className="font-bold text-xs">Supervised Guard</div>
                  <div className={cn("text-[11px] mt-1", autonomyMode === 'supervised' ? "text-slate-300" : "text-slate-500")}>
                    Flag & hold high-risk actions
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: DETERMINISTIC SAFETY POLICY GUARD */}
        <div className="bg-white border border-slate-200/90 rounded-lg p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Deterministic Safety Policy Guard
                </h3>
                <p className="text-xs text-slate-500">
                  Hard mathematical boundaries executed after AI proposal to prevent revenue leaks.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
              100% Deterministic
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Max Discount */}
            <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-900">
                  Maximum Discount Cap
                </label>
                <span className="text-sm font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {maxDiscount}% Max
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
                AI proposals requesting higher discounts are automatically blocked.
              </p>
            </div>

            {/* Max Expiry */}
            <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-900">
                  Link Expiry Duration
                </label>
                <span className="text-sm font-bold font-mono text-slate-900">
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
                Maximum valid lifespan for generated recovery payment links.
              </p>
            </div>

            {/* High-Value Approval Threshold */}
            <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-900">
                  High-Value Threshold
                </label>
                <span className="text-sm font-bold font-mono text-slate-900">
                  ₹{(highValueCap / 1000).toFixed(0)}K
                </span>
              </div>
              <input
                type="number"
                value={highValueCap}
                onChange={(e) => setHighValueCap(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-400"
              />
              <p className="text-[11px] text-slate-500">
                Orders exceeding this amount require dual-factor human sign-off.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 3: AUDIT TRAIL & INTEGRITY */}
        <div className="bg-white border border-slate-200/90 rounded-lg p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Cryptographic Audit Trail & Integrity
                </h3>
                <p className="text-xs text-slate-500">
                  Tamper-evident SHA-256 hash chaining specifications for policy accountability.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
              SHA-256 Immutable
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg space-y-2">
              <span className="text-xs font-bold text-slate-900">Ledger Persistence Format</span>
              <p className="text-xs text-slate-600">
                Append-only SQLite3 storage with cryptographic hash chains linking each state transition to the previous entry.
              </p>
              <div className="text-[11px] font-mono text-emerald-700 font-semibold pt-1">
                Status: Integrity Verification Active
              </div>
            </div>

            <div className="p-4 bg-[#f8f9fa] border border-slate-200 rounded-lg space-y-2">
              <span className="text-xs font-bold text-slate-900">Tamper Simulation & Recovery</span>
              <p className="text-xs text-slate-600">
                Real-time detection algorithm instantly halts pipeline execution upon signature discrepancy.
              </p>
              <div className="text-[11px] font-mono text-slate-500 pt-1">
                Zero Trust Cryptographic Verification
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
