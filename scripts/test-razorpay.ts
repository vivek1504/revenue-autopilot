import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const keyId = process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_API_KEY;
const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_API_SECRET;
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'whsec_test_secret';

if (!keyId || !keySecret) {
  console.error('❌ Missing Razorpay API keys in .env file!');
  process.exit(1);
}

const rzp = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

async function testAPIs() {
  console.log('🚀 Testing Razorpay Test-Mode APIs...\n');
  // @ts-ignore
  console.log(`Using Key ID: ${keyId.slice(0, 12)}...`);

  // 1. Create an Order
  console.log('\n--- 1. Creating Test Order ---');
  try {
    const order = await rzp.orders.create({
      amount: 50000, // ₹500 in paise
      currency: 'INR',
      receipt: `test_receipt_${Date.now()}`,
      notes: { test: 'true', purpose: 'api_validation' },
    });
    console.log('✅ Order Created Successfully!');
    console.log(`   Order ID: ${order.id}`);
    console.log(`   Status:   ${order.status}`);
    // @ts-ignore
    console.log(`   Amount:   ₹${order.amount / 100}`);

    // Fetch order back
    console.log('\n--- Fetching Created Order ---');
    const fetchedOrder = await rzp.orders.fetch(order.id);
    console.log(`✅ Fetched Order ID: ${fetchedOrder.id}, Status: ${fetchedOrder.status}`);
  } catch (err: any) {
    console.error('❌ Order Creation Failed:', err?.error?.description || err.message || err);
  }

  // 2. Create a Payment Link
  console.log('\n--- 2. Creating Test Payment Link ---');
  try {
    //@ts-ignore
    const paymentLink = await rzp.paymentLink.create({
      amount: 50000, // ₹500 in paise
      currency: 'INR',
      description: 'Test Recovery Link - API Validation',
      reference_id: `test_ref_${Date.now()}`,
      expire_by: Math.floor(Date.now() / 1000) + 86400, // 24h
      notify: { sms: false, email: false },
      callback_url: 'https://example.com/callback',
      callback_method: 'get',
      notes: { test: 'true', scenario: 'abandoned_checkout' },
    });
    console.log('✅ Payment Link Created Successfully!');
    //@ts-ignore
    console.log(`   Link ID:   ${paymentLink.id}`);
    //@ts-ignore
    console.log(`   Short URL: ${paymentLink.short_url}`);
    //@ts-ignore
    console.log(`   Status:    ${paymentLink.status}`);
  } catch (err: any) {
    console.error('❌ Payment Link Creation Failed:', err?.error?.description || err.message || err);
  }

  // 3. Test Webhook Signature Verification
  console.log('\n--- 3. Testing Webhook Signature Verification ---');
  const payload = JSON.stringify({ event: 'payment_link.paid', payload: { payment_link: { id: 'plink_123' } } });

  const validSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex');

  const isValid = Razorpay.validateWebhookSignature(payload, validSignature, webhookSecret);
  console.log(`   Valid Signature Verification:   ${isValid ? '✅ PASSED' : '❌ FAILED'}`);

  const isInvalid = Razorpay.validateWebhookSignature(payload, 'tampered_signature_12345', webhookSecret);
  console.log(`   Tampered Signature Verification: ${!isInvalid ? '✅ PASSED (Correctly rejected)' : '❌ FAILED'}`);

  console.log('\n🎉 API Validation Complete!');
}

testAPIs().catch(console.error);
