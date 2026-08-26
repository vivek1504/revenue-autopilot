export interface LiveTelemetryStats {
  avg_discovery_ms: number | null;
  avg_policy_ms: number | null;
  avg_ledger_ms: number | null;
  avg_llm_ms: number | null;
  throughput_ops_sec: number | null;
  // Kept for backward compatibility with p99 property names
  p99_discovery_ms: number | null;
  p99_policy_ms: number | null;
  p99_ledger_ms: number | null;
  p99_llm_ms: number | null;
  last_run_timestamp?: string | null;
}

export const liveTelemetryStats: LiveTelemetryStats = {
  avg_discovery_ms: null,
  avg_policy_ms: null,
  avg_ledger_ms: null,
  avg_llm_ms: null,
  throughput_ops_sec: null,
  p99_discovery_ms: null,
  p99_policy_ms: null,
  p99_ledger_ms: null,
  p99_llm_ms: null,
  last_run_timestamp: null,
};

