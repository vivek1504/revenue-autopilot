import React, { useState } from 'react';
import { useAutopilot } from './hooks/useAutopilot';
import { Sidebar, NavTab } from './components/Sidebar';
import { TopNavBar } from './components/TopNavBar';
import { ExecutiveDashboardView } from './components/ExecutiveDashboardView';
import { RecoveriesAnalyticsView } from './components/RecoveriesAnalyticsView';
import { AgentTelemetryView } from './components/AgentTelemetryView';
import { PipelinesView } from './components/PipelinesView';
import { AuditLogView } from './components/AuditLogView';
import { SettingsView } from './components/SettingsView';
import { PolicyVerdictModal } from './components/PolicyVerdictModal';
import { ProcessedAction } from './types';

export function App() {
  const {
    status,
    events,
    processedActions,
    summary,
    timeseries,
    cohorts,
    benchmarks,
    settings,
    auditLogs,
    verificationResult,
    totalOpportunities,
    run,
    runVerification,
    tamperRecord,
    simulatePayment,
    resolveEscalation,
    saveSettings,
    exportReport,
  } = useAutopilot();

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [executionMode, setExecutionMode] = useState<'live' | 'simulated'>('live');
  const [selectedVerdictItem, setSelectedVerdictItem] = useState<ProcessedAction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-[#f8f9fc] text-[#091e42] overflow-hidden font-sans">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        status={status}
        executionMode={executionMode}
        onModeChange={(m) => setExecutionMode(m)}
        onRun={() => run(executionMode)}
        processedCount={processedActions.length}
        totalCount={totalOpportunities || summary?.opportunities_count || 0}
        onExport={() => exportReport('csv')}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Navigation Bar */}
        <TopNavBar
          searchQuery={searchQuery}
          onSearchChange={(q) => setSearchQuery(q)}
          currentTab={currentTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        {/* Scrollable Main Canvas */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-8 bg-[#f8f9fc]">
          <div className="w-full">
            {/* View Switcher based on currentTab */}
            {currentTab === 'dashboard' && (
              <ExecutiveDashboardView
                summary={summary}
                timeseries={timeseries}
                items={processedActions}
                events={events}
                status={status}
                verificationResult={verificationResult}
                onSelectVerdict={(item) => setSelectedVerdictItem(item)}
                onNavigateToTab={(tab) => setCurrentTab(tab)}
              />
            )}

            {currentTab === 'recoveries' && (
              <RecoveriesAnalyticsView
                summary={summary}
                timeseries={timeseries}
                cohorts={cohorts}
                items={processedActions}
                onSelectVerdict={(item) => setSelectedVerdictItem(item)}
                searchQuery={searchQuery}
              />
            )}

            {currentTab === 'telemetry' && (
              <AgentTelemetryView
                summary={summary}
                benchmarks={benchmarks}
                items={processedActions}
                events={events}
                status={status}
                verificationResult={verificationResult}
                onSelectVerdict={(item) => setSelectedVerdictItem(item)}
              />
            )}

            {currentTab === 'pipelines' && (
              <PipelinesView
                items={processedActions}
                summary={summary}
                onSelectVerdict={(item) => setSelectedVerdictItem(item)}
                onSimulatePayment={simulatePayment}
              />
            )}

            {currentTab === 'audit' && (
              <AuditLogView
                logs={auditLogs}
                verificationResult={verificationResult}
                onVerify={runVerification}
                onTamper={tamperRecord}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsView
                initialSettings={settings}
                onSaveSettings={saveSettings}
              />
            )}
          </div>
        </main>
      </div>

      {/* Policy Verdict Detail Modal */}
      <PolicyVerdictModal
        item={selectedVerdictItem}
        onClose={() => setSelectedVerdictItem(null)}
        onApprove={(id) => resolveEscalation(id, 'APPROVED', executionMode)}
        onReject={(id) => resolveEscalation(id, 'REJECTED', executionMode)}
      />
    </div>
  );
}

export default App;
