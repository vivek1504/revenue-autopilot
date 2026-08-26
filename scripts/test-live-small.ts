import 'dotenv/config';
import { runAutopilot } from '../src/index';

async function testLiveSmall() {
  console.log('🚀 Running Live Mode Recovery Scan on curated 4-opportunity dataset...\n');

  const result = await runAutopilot({
    mode: 'live',
    onProgress: (event) => {
      if (event.type === 'verdict') {
        const p = event.verdict.proposal;
        const v = event.verdict.verdict;
        console.log(`[Verdict] ${p.customer_id} (${p.action}) -> ${v}`);
        if (v === 'BLOCKED' && event.verdict.violations) {
          event.verdict.violations.forEach((violation) => {
            console.log(`   ⛔ Policy Violation [${violation.rule}]: ${violation.message}`);
          });
        }
      } else if (event.type === 'execution' && event.execution) {
        if (event.execution.razorpay_short_url) {
          console.log(`   🔗 Razorpay Payment Link Created: ${event.execution.razorpay_short_url}`);
          console.log(`   💳 Payment Link ID: ${event.execution.razorpay_payment_link_id}`);
        } else if (event.execution.error) {
          console.log(`   ❌ Execution Error: ${event.execution.error}`);
        }
      }
    },
  });

  console.log('\n========================================');
  console.log('📊 LIVE AUTOPILOT EXECUTION SUMMARY');
  console.log('========================================');
  console.log(` Total Evaluated:       ${result.total_opportunities}`);
  console.log(` Total Approved:        ${result.approved_count}`);
  console.log(` Total Blocked:         ${result.blocked_count}`);
  console.log(` Unsafe Value Blocked: ₹${(result.unsafe_value_blocked_paise / 100).toLocaleString('en-IN')}`);
  console.log(` Approved Value:       ₹${(result.approved_value_paise / 100).toLocaleString('en-IN')}`);
  console.log('========================================\n');
}

testLiveSmall().catch(console.error);
