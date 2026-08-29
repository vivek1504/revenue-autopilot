import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { prisma } from '../src/api/dependencies';
import { runAutopilot } from '../src/autopilot/orchestrator';
import { verifyAuditIntegrity } from '../src/audit/verifier';

async function runDemo() {
  console.log('\n================================================================');
  console.log('🤖 REVENUE AUTOPILOT — LIVE BUILDATHON DEMO (GEMINI + RAZORPAY)');
  console.log('================================================================\n');

  const auditFile = path.join(process.cwd(), 'data', 'audit.jsonl');
  if (fs.existsSync(auditFile)) {
    fs.unlinkSync(auditFile);
  }

  console.log('🧹 [1/3] Resetting demo state and seeding curated 7-opportunity batch...');

  // Reset demo tables
  await prisma.recoveryOffer.deleteMany({});
  await prisma.recoveryOpportunity.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.customer.deleteMany({});

  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 3600 * 1000);
  const fourHoursAgo = new Date(now.getTime() - 4 * 3600 * 1000);
  const fortyDaysAgo = new Date(now.getTime() - 40 * 24 * 3600 * 1000);

  // 1. Standard abandoned cart
  await prisma.customer.create({
    data: {
      id: 'cust_demo_01',
      name: 'Pooja Sharma',
      email: 'pooja.sharma@example.com',
      phone: '+919876543210',
      tier: 'standard',
      lifetime_spend_paise: 1200000,
      total_orders: 2,
      created_at: fortyDaysAgo,
    },
  });
  await prisma.cart.create({
    data: {
      id: 'cart_demo_01',
      customer_id: 'cust_demo_01',
      items: [{ id: 'prod_1', name: 'Smart Fitness Band', price_paise: 450000, qty: 1 }] as any,
      total_paise: 450000, // ₹4,500
      created_at: twoHoursAgo,
      last_activity: twoHoursAgo,
      status: 'abandoned',
    },
  });

  // 2. High-value abandoned cart
  await prisma.customer.create({
    data: {
      id: 'cust_demo_02',
      name: 'Aditya Verma',
      email: 'aditya.verma@example.com',
      phone: '+919876543211',
      tier: 'premium',
      lifetime_spend_paise: 3500000,
      total_orders: 4,
      created_at: fortyDaysAgo,
    },
  });
  await prisma.cart.create({
    data: {
      id: 'cart_demo_02',
      customer_id: 'cust_demo_02',
      items: [{ id: 'prod_2', name: 'Noise-Cancelling Headphones', price_paise: 850000, qty: 1 }] as any,
      total_paise: 850000, // ₹8,500
      created_at: fourHoursAgo,
      last_activity: fourHoursAgo,
      status: 'abandoned',
    },
  });

  // 3. Failed payment order
  await prisma.customer.create({
    data: {
      id: 'cust_demo_03',
      name: 'Vikram Malhotra',
      email: 'vikram.m@example.com',
      phone: '+919876543212',
      tier: 'standard',
      lifetime_spend_paise: 2000000,
      total_orders: 3,
      created_at: fortyDaysAgo,
    },
  });
  await prisma.order.create({
    data: {
      id: 'ord_demo_03',
      customer_id: 'cust_demo_03',
      status: 'failed',
      total_paise: 320000, // ₹3,200
      failure_reason: 'BAD_REQUEST_ERROR_BANK_SYSTEM_TIMEOUT',
      created_at: twoHoursAgo,
      items: [{ id: 'prod_3', name: 'Ergonomic Desk Mat', price_paise: 320000, qty: 1 }] as any,
    },
  });

  // 4. VIP Upsell Candidate
  await prisma.customer.create({
    data: {
      id: 'cust_demo_04',
      name: 'Dr. Meera Nambiar',
      email: 'meera.n@example.com',
      phone: '+919876543213',
      tier: 'vip',
      lifetime_spend_paise: 9500000,
      total_orders: 7,
      created_at: fortyDaysAgo,
      last_purchase_date: twoHoursAgo,
    },
  });
  await prisma.order.create({
    data: {
      id: 'ord_demo_04',
      customer_id: 'cust_demo_04',
      status: 'completed',
      total_paise: 640000,
      created_at: twoHoursAgo,
      completed_at: twoHoursAgo,
      items: [{ id: 'prod_4', name: 'Mechanical Keyboard Pro', price_paise: 640000, qty: 1 }] as any,
    },
  });

  // 5. Inactive Re-engagement Candidate
  await prisma.customer.create({
    data: {
      id: 'cust_demo_05',
      name: 'Karan Joshi',
      email: 'karan.j@example.com',
      phone: '+919876543214',
      tier: 'standard',
      lifetime_spend_paise: 1800000,
      total_orders: 2,
      created_at: fortyDaysAgo,
      last_purchase_date: fortyDaysAgo,
    },
  });

  // 6. Excessive Value Proposal Candidate -> Policy Multi-Violation Demonstration
  await prisma.customer.create({
    data: {
      id: 'cust_demo_excess',
      name: 'Siddharth Rao',
      email: 'siddharth.r@example.com',
      tier: 'standard',
      lifetime_spend_paise: 50000,
      total_orders: 1,
      created_at: twoHoursAgo,
    },
  });
  await prisma.cart.create({
    data: {
      id: 'cart_demo_excess',
      customer_id: 'cust_demo_excess',
      items: [{ id: 'prod_excess', name: 'Enterprise Workstation', price_paise: 3500000, qty: 1 }] as any,
      total_paise: 3500000, // ₹35,000 (exceeds ₹10,000 policy cap!)
      created_at: twoHoursAgo,
      last_activity: twoHoursAgo,
      status: 'abandoned',
    },
  });

  // 7. Contact Frequency Limit Customer (Stopping Rule Demonstration)
  await prisma.customer.create({
    data: {
      id: 'cust_demo_stop',
      name: 'Rajesh Sen',
      email: 'rajesh.sen@example.com',
      phone: '+919876543215',
      tier: 'standard',
      lifetime_spend_paise: 800000,
      total_orders: 2,
      created_at: fortyDaysAgo,
    },
  });
  await prisma.cart.create({
    data: {
      id: 'cart_demo_stop',
      customer_id: 'cust_demo_stop',
      items: [{ id: 'prod_5', name: 'Wireless Charger', price_paise: 250000, qty: 1 }] as any,
      total_paise: 250000,
      created_at: twoHoursAgo,
      last_activity: twoHoursAgo,
      status: 'abandoned',
    },
  });
  // Pre-seed 3 contact attempts in the past 3 days for Rajesh
  for (let i = 1; i <= 3; i++) {
    const contactDate = new Date(now.getTime() - i * 24 * 3600 * 1000);
    await prisma.recoveryOffer.create({
      data: {
        id: `off_past_stop_${i}`,
        customer_id: 'cust_demo_stop',
        action_type: 'discounted_payment_link',
        amount_paise: 250000,
        discount_percent: 5,
        status: 'EXPIRED',
        created_at: contactDate,
        expires_at: new Date(contactDate.getTime() + 24 * 3600 * 1000),
      },
    });
  }

  console.log('   ✓ Seeded 5 legitimate targets + 1 policy-violating target + 1 contact-capped target\n');

  console.log('⚡ [2/3] Executing Autopilot Scan in LIVE mode with Gemini & Razorpay API...\n');

  const paymentLinks: { customer: string; amount: string; url: string }[] = [];

  const result = await runAutopilot({
    mode: 'live',
    limit: 7,
    onProgress: (event) => {
      if (event.type === 'verdict') {
        const p = event.verdict.proposal;
        const v = event.verdict.verdict;
        const icon = v === 'APPROVED' ? '✅' : '⛔';
        console.log(`${icon} [Policy Verdict] ${p.customer_id} (${p.opportunity_type}) -> ${v}`);
        if (v === 'BLOCKED' && event.verdict.violations) {
          event.verdict.violations.forEach((violation) => {
            console.log(`   └─ Violation [${violation.rule}]: ${violation.message}`);
          });
        }
      } else if (event.type === 'execution' && event.execution) {
        if (event.execution.razorpay_short_url) {
          console.log(`   💳 Razorpay Payment Link: ${event.execution.razorpay_short_url}`);
          paymentLinks.push({
            customer: event.execution.idempotency_key,
            amount: 'Active',
            url: event.execution.razorpay_short_url,
          });
        }
      }
    },
  });

  const auditCheck = verifyAuditIntegrity();

  console.log('\n================================================================');
  console.log('📊 LIVE AUTOPILOT EXECUTION & SAFETY SUMMARY');
  console.log('================================================================');
  console.log(` Total Opportunities Scanned:  ${result.total_opportunities}`);
  console.log(` Policy Approved Actions:       ${result.approved_count} (Created Live Razorpay Links)`);
  console.log(` Policy Blocked Violations:     ${result.blocked_count} (Policy Violations & Stopping Rules)`);
  console.log(` Recoverable Revenue:           ₹${(result.approved_value_paise / 100).toLocaleString('en-IN')}`);
  console.log(` Unsafe Value Blocked:          ₹${(result.unsafe_value_blocked_paise / 100).toLocaleString('en-IN')}`);
  console.log(` Cryptographic SHA-256 Chain:  ${auditCheck.valid ? '✅ VERIFIED INTACT' : '❌ CORRUPTED'} (${auditCheck.verified_records} records)`);
  console.log('================================================================\n');

  if (paymentLinks.length > 0) {
    console.log('🔗 Generated Live Razorpay Payment Links:');
    paymentLinks.forEach((link, idx) => {
      console.log(`  [${idx + 1}] ${link.url}`);
    });
    console.log('\n💡 Next step: Complete test payment on any link above, then run:');
    console.log('   👉 npm run demo:verify\n');
  }

  await prisma.$disconnect();
}

runDemo().catch(console.error);
