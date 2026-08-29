import { useState, useEffect, useCallback } from 'react';
import {
  AuditRecord,
  AuditVerificationResult,
  AutopilotEvent,
  DashboardSummary,
  ProcessedAction,
  CohortPerformance,
  TimeSeriesPoint,
  TelemetryBenchmarks,
  SystemSettings,
} from '../types';

export function useAutopilot() {
  const [status, setStatus] = useState<'idle' | 'running' | 'complete'>('idle');
  const [events, setEvents] = useState<AutopilotEvent[]>([]);
  const [processedActions, setProcessedActions] = useState<ProcessedAction[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [timeseries, setTimeseries] = useState<TimeSeriesPoint[]>([]);
  const [cohorts, setCohorts] = useState<CohortPerformance[]>([]);
  const [benchmarks, setBenchmarks] = useState<TelemetryBenchmarks | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);
  const [verificationResult, setVerificationResult] = useState<AuditVerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [totalOpportunities, setTotalOpportunities] = useState<number>(0);

  const fetchOpportunitiesQueue = useCallback(async () => {
    try {
      const res = await fetch('/api/opportunities/queue');
      if (res.ok) {
        const data: ProcessedAction[] = await res.json();
        setProcessedActions(data);
        if (data.length > 0) {
          setTotalOpportunities(data.length);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch opportunities queue:', err);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/summary');
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (err: any) {
      console.error('Failed to fetch summary:', err);
    }
  }, []);

  const fetchTimeseries = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics/timeseries');
      if (res.ok) {
        const data = await res.json();
        setTimeseries(data);
      }
    } catch (err: any) {
      console.error('Failed to fetch timeseries:', err);
    }
  }, []);

  const fetchCohorts = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics/cohorts');
      if (res.ok) {
        const data = await res.json();
        setCohorts(data);
      }
    } catch (err: any) {
      console.error('Failed to fetch cohorts:', err);
    }
  }, []);

  const fetchBenchmarks = useCallback(async () => {
    try {
      const res = await fetch('/api/telemetry/benchmarks');
      if (res.ok) {
        const data = await res.json();
        setBenchmarks(data);
      }
    } catch (err: any) {
      console.error('Failed to fetch benchmarks:', err);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err: any) {
      console.error('Failed to fetch settings:', err);
    }
  }, []);

  const saveSettings = useCallback(async (newSettings: Partial<SystemSettings>) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      if (res.ok) {
        await fetchSettings();
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      return false;
    }
  }, [fetchSettings]);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/audit/log');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (err: any) {
      console.error('Failed to fetch audit logs:', err);
    }
  }, []);

  const runVerification = useCallback(async () => {
    try {
      const res = await fetch('/api/audit/verify', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setVerificationResult(data);
        return data;
      }
    } catch (err: any) {
      console.error('Verification failed:', err);
    }
  }, []);

  const tamperRecord = useCallback(async (sequence: number) => {
    try {
      const res = await fetch('/api/audit/tamper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequence }),
      });
      if (res.ok) {
        await fetchAuditLogs();
        await runVerification();
      }
    } catch (err: any) {
      console.error('Tampering failed:', err);
    }
  }, [fetchAuditLogs, runVerification]);

  const exportReport = useCallback(async (format: 'csv' | 'json' = 'csv') => {
    try {
      if (format === 'csv') {
        window.open('/api/export?format=csv', '_blank');
      } else {
        const res = await fetch('/api/export?format=json');
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'revenue_guard_audit_report.json';
        a.click();
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  }, []);

  const refreshAll = useCallback(() => {
    fetchOpportunitiesQueue();
    fetchSummary();
    fetchTimeseries();
    fetchCohorts();
    fetchBenchmarks();
    fetchSettings();
    fetchAuditLogs();
    runVerification();
  }, [fetchOpportunitiesQueue, fetchSummary, fetchTimeseries, fetchCohorts, fetchBenchmarks, fetchSettings, fetchAuditLogs, runVerification]);

  const run = useCallback(async (mode: 'simulated' | 'live' = 'simulated') => {
    setStatus('running');
    setEvents([]);
    setProcessedActions([]);
    setTotalOpportunities(0);
    setError(null);

    const eventSource = new EventSource('/api/autopilot/events');

    eventSource.onmessage = (e) => {
      try {
        const event: AutopilotEvent = JSON.parse(e.data);
        setEvents((prev) => [...prev, event]);

        if (event.type === 'start') {
          setTotalOpportunities(event.total_opportunities);
        } else if (event.type === 'processed') {
          setProcessedActions((prev) => [event.item, ...prev]);
        } else if (event.type === 'complete') {
          setStatus('complete');
          eventSource.close();
          refreshAll();
        }
      } catch (err) {
        console.error('Error parsing SSE event:', err);
      }
    };

    eventSource.onerror = () => {
      console.warn('SSE connection closed or ended');
      eventSource.close();
      setStatus((current) => (current === 'running' ? 'complete' : current));
      refreshAll();
    };

    try {
      const res = await fetch('/api/autopilot/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || 'Failed to start autopilot');
        setStatus('idle');
        eventSource.close();
      }
    } catch (err: any) {
      setError(err.message || 'Network error starting autopilot');
      setStatus('idle');
      eventSource.close();
    }
  }, [refreshAll]);

  const simulatePayment = useCallback(
    async (offerId: string) => {
      try {
        const res = await fetch('/api/simulate/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ offer_id: offerId }),
        });
        if (res.ok) {
          await refreshAll();
          return await res.json();
        } else {
          const err = await res.json();
          throw new Error(err.error || 'Failed to simulate payment');
        }
      } catch (err: any) {
        console.error('Failed to simulate payment:', err);
        throw err;
      }
    },
    [refreshAll]
  );

  const resolveEscalation = useCallback(
    async (offerId: string, decision: 'APPROVED' | 'REJECTED') => {
      try {
        const res = await fetch(`/api/opportunities/${offerId}/resolve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision }),
        });
        if (res.ok) {
          await refreshAll();
          return await res.json();
        } else {
          const err = await res.json();
          throw new Error(err.error || 'Failed to resolve escalation');
        }
      } catch (err: any) {
        console.error('Failed to resolve escalation:', err);
        throw err;
      }
    },
    [refreshAll]
  );

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return {
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
    error,
    run,
    runVerification,
    tamperRecord,
    simulatePayment,
    resolveEscalation,
    saveSettings,
    exportReport,
    refreshAll,
  };
}
