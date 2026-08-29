import 'dotenv/config';
import { prisma } from '../src/api/dependencies';
import { verifyAuditIntegrity } from '../src/audit/verifier';

async function verifyDemo() {
  console.log('\n================================================================');
  console.log('🔍 REVENUE AUTOPILOT — VERIFY RECOVERED MONEY & AUDIT TRAIL');
  console.log('================================================================\n');

  const recoveredOffers = await prisma.recoveryOffer.findMany({
    where: { status: 'RECOVERED' },
    include: { customer: true },
  });

  const allOffers = await prisma.recoveryOffer.findMany({
    include: { customer: true },
  });

  const totalRecoveredPaise = recoveredOffers.reduce((sum, o) => {
    const discounted = Math.round(o.amount_paise * (1 - (o.discount_percent || 0) / 100));
    return sum + discounted;
  }, 0);

  console.log(`📋 Total Recovery Offers Generated: ${allOffers.length}`);
  console.log(`✅ Webhook Verified Paid Offers:    ${recoveredOffers.length}`);
  console.log(`💰 Measured Money Recovered:        ₹${(totalRecoveredPaise / 100).toLocaleString('en-IN')}\n`);

  if (recoveredOffers.length > 0) {
    console.log('🎉 Confirmed Paid Recoveries:');
    recoveredOffers.forEach((o) => {
      const net = Math.round(o.amount_paise * (1 - o.discount_percent / 100));
      console.log(`  • Customer: ${o.customer.name} (${o.customer.id})`);
      console.log(`    Original: ₹${(o.amount_paise / 100).toLocaleString('en-IN')} | Discount: ${o.discount_percent}%`);
      console.log(`    Net Recovered: ₹${(net / 100).toLocaleString('en-IN')}`);
      console.log(`    Razorpay Link ID: ${o.razorpay_payment_link_id || 'N/A'}`);
      console.log('    ----------------------------------------');
    });
  } else {
    console.log('ℹ️ No paid offers detected yet.');
    console.log('   Complete a test payment on one of the generated Razorpay links and run this command again.');
  }

  // Cryptographic audit chain verification
  console.log('\n🔐 Cryptographic Audit Chain Verification:');
  const integrity = verifyAuditIntegrity();
  if (integrity.valid) {
    console.log(`   ✅ SHA-256 Hash Chain: INTACT & UNBROKEN (${integrity.verified_records}/${integrity.total_records} records verified)`);
  } else {
    console.log(`   ❌ SHA-256 Hash Chain: TAMPER DETECTED at sequence #${integrity.tampered_at?.sequence}`);
  }

  console.log('\n================================================================\n');

  await prisma.$disconnect();
}

verifyDemo().catch(console.error);
