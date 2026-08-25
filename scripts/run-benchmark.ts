import fs from 'fs';
import path from 'path';
import { runAutopilot } from '../src/index';

async function main() {
  console.log('🚀 Running Revenue Autopilot Full Batch Benchmark...\n');

  // Clear existing audit log for clean benchmark
  const auditPath = path.join(process.cwd(), 'data', 'audit.jsonl');
  if (fs.existsSync(auditPath)) {
    fs.unlinkSync(auditPath);
  }

  const result = await runAutopilot({
    mode: 'simulated',
    onProgress: (event) => {
      if (event.type === 'proposal') {
        process.stdout.write('.');
      }
    },
  });

  console.log('\n\n========================================');
  console.log('📊 FULL BATCH BENCHMARK RESULTS');
  console.log('========================================');
  console.log(`Duration:                   ${(result.duration_ms / 1000).toFixed(2)}s`);
  console.log(`Opportunities Identified:   ${result.total_opportunities}`);
  console.log(`Policy Approved Actions:    ${result.approved_count}`);
  console.log(`Policy Blocked Actions:     ${result.blocked_count}`);
  console.log(`Approved Recovery Value:    ₹${(result.approved_value_paise / 100).toLocaleString('en-IN')}`);
  console.log(`Unsafe Value Blocked:       ₹${(result.unsafe_value_blocked_paise / 100).toLocaleString('en-IN')}`);
  console.log('========================================\n');

  const benchmarkPath = path.join(process.cwd(), 'data', 'benchmark.json');
  fs.writeFileSync(benchmarkPath, JSON.stringify(result, null, 2));
  console.log(`✅ Saved benchmark metrics to ${benchmarkPath}`);
}

main().catch(console.error);
