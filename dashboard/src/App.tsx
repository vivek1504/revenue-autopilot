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
    saveSettings,
    exportReport,
  } = useAutopilot();

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [selectedVerdictItem, setSelectedVerdictItem] = useState<ProcessedAction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex h-screen w-full bg-[#f8f9ff] text-[#0b1c30] overflow-hidden font-sans">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        status={status}
        onRun={() => run('simulated')}
        processedCount={processedActions.length}
        totalCount={totalOpportunities || summary?.opportunities_count || 0}
        onExport={() => exportReport('csv')}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Navigation Bar */}
        <TopNavBar
          searchQuery={searchQuery}
          onSearchChange={(q) => setSearchQuery(q)}
        />

        {/* Scrollable Main Canvas */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#f8f9ff]">
          <div className="max-w-[1440px] mx-auto w-full">
            {/* View Switcher based on currentTab */}
            {currentTab === 'dashboard' && (
              <ExecutiveDashboardView
                summary={summary}
                timeseries={timeseries}
                items={processedActions}
                events={events}
                status={status}
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
                onSelectVerdict={(item) => setSelectedVerdictItem(item)}
              />
            )}

            {currentTab === 'pipelines' && (
              <PipelinesView
                items={processedActions}
                summary={summary}
                onSelectVerdict={(item) => setSelectedVerdictItem(item)}
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
      />
    </div>
  );
}

export default App;
