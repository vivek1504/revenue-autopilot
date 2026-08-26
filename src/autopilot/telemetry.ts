export interface LiveTelemetryStats {
  p99_discovery_ms: number;
  p99_policy_ms: number;
  p99_ledger_ms: number;
  p99_llm_ms: number;
  throughput_ops_sec: number;
  last_run_timestamp?: string;
}

export const liveTelemetryStats: LiveTelemetryStats = {
  p99_discovery_ms: 1.8,
  p99_policy_ms: 0.4,
  p99_ledger_ms: 0.6,
  p99_llm_ms: 140.0,
  throughput_ops_sec: 1250,
};
