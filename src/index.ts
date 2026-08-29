export * from './autopilot/telemetry';
export * from './autopilot/orchestrator';

import { runAutopilot } from './autopilot/orchestrator';

if (require.main === module) {
  console.log('🤖 Starting Revenue Autopilot CLI run...');
  runAutopilot()
    .then((result) => {
      console.log(`\n✅ Autopilot Run Completed in ${result.duration_ms}ms`);
      console.log(`- Total Opportunities Processed: ${result.total_opportunities}`);
      console.log(`- Policy Approved Actions: ${result.approved_count}`);
      console.log(`- Policy Blocked Violations: ${result.blocked_count}`);
      console.log(`- Unsafe Value Blocked: ₹${(result.unsafe_value_blocked_paise / 100).toLocaleString('en-IN')}`);
      console.log(`- Revenue Recoverable (Approved Value): ₹${(result.approved_value_paise / 100).toLocaleString('en-IN')}`);
    })
    .catch((err) => {
      console.error('❌ Autopilot execution failed:', err);
      process.exit(1);
    });
}
