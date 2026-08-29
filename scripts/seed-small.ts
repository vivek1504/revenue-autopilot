import { prisma } from '../src/api/dependencies';
import { PRODUCT_CATALOG } from '../src/data/products';
import fs from 'fs';
import path from 'path';

async function seedSmall() {
  console.log('🌱 Seeding small curated (4 opportunities) dataset for Live Demo into PostgreSQL...\n');

  // Clear existing data & audit log
  await prisma.recoveryOffer.deleteMany({});
  await prisma.recoveryOpportunity.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.product.deleteMany({});

  const auditPath = path.join(__dirname, '../data/audit.jsonl');
  if (fs.existsSync(auditPath)) {
    fs.unlinkSync(auditPath);
  }

  // Insert catalog
  await prisma.product.createMany({
    data: PRODUCT_CATALOG.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price_paise: p.price_paise,
      description: p.description,
    })),
  });

  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 3600 * 1000);
  const fiveHoursAgo = new Date(now.getTime() - 5 * 3600 * 1000);
  const thirtyFiveDaysAgo = new Date(now.getTime() - 35 * 86400 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400 * 1000);

  // Insert 4 Curated Customers
  await prisma.customer.createMany({
    data: [
      {
        id: 'cust_demo_01',
        name: 'Ananya Sharma',
        email: 'ananya.sharma@example.com',
        phone: '+919876543210',
        tier: 'standard',
        lifetime_spend_paise: 4500000,
        total_orders: 3,
        first_purchase_date: ninetyDaysAgo,
        last_purchase_date: thirtyFiveDaysAgo,
        notes: null,
        created_at: ninetyDaysAgo,
      },
      {
        id: 'cust_demo_02',
        name: 'Vikram Malhotra',
        email: 'vikram.m@example.com',
        phone: '+919812345678',
        tier: 'premium',
        lifetime_spend_paise: 12000000,
        total_orders: 6,
        first_purchase_date: ninetyDaysAgo,
        last_purchase_date: fiveHoursAgo,
        notes: null,
        created_at: ninetyDaysAgo,
      },
      {
        id: 'cust_demo_03',
        name: 'Priya Patel',
        email: 'priya.patel@example.com',
        phone: '+919711223344',
        tier: 'vip',
        lifetime_spend_paise: 35000000,
        total_orders: 12,
        first_purchase_date: ninetyDaysAgo,
        last_purchase_date: thirtyFiveDaysAgo,
        notes: null,
        created_at: ninetyDaysAgo,
      },
      {
        id: 'cust_demo_04',
        name: 'Rahul Verma',
        email: 'rahul.verma@example.com',
        phone: '+919654321098',
        tier: 'standard',
        lifetime_spend_paise: 1500000,
        total_orders: 1,
        first_purchase_date: ninetyDaysAgo,
        last_purchase_date: thirtyFiveDaysAgo,
        notes: null,
        created_at: ninetyDaysAgo,
      },
    ],
  });

  // Carts
  await prisma.cart.createMany({
    data: [
      {
        id: 'cart_demo_01',
        customer_id: 'cust_demo_01',
        items: [
          { product_id: 'prod_001', name: 'Analytics Pro License', price_paise: 850000, quantity: 1 }
        ] as any,
        total_paise: 850000,
        created_at: twoHoursAgo,
        last_activity: twoHoursAgo,
        status: 'abandoned',
      },
      {
        id: 'cart_demo_04',
        customer_id: 'cust_demo_04',
        items: [
          { product_id: 'prod_002', name: 'Custom ERP Connector Module', price_paise: 3500000, quantity: 1 }
        ] as any,
        total_paise: 3500000,
        created_at: twoHoursAgo,
        last_activity: twoHoursAgo,
        status: 'abandoned',
      },
    ],
  });

  // Orders
  await prisma.order.createMany({
    data: [
      {
        id: 'ord_demo_02',
        customer_id: 'cust_demo_02',
        status: 'failed',
        total_paise: 650000,
        created_at: fiveHoursAgo,
        completed_at: null,
        failure_reason: 'UPI_TRANSACTION_TIMEOUT',
        items: [
          { product_id: 'prod_003', name: 'Cloud Server Instance', price_paise: 650000, quantity: 1 }
        ] as any,
      },
      {
        id: 'ord_demo_03_1',
        customer_id: 'cust_demo_03',
        status: 'completed',
        total_paise: 500000,
        created_at: ninetyDaysAgo,
        completed_at: ninetyDaysAgo,
        failure_reason: null,
        items: [{ product_id: 'prod_001', name: 'Analytics Pro License', price_paise: 500000, quantity: 1 }] as any,
      },
      {
        id: 'ord_demo_03_2',
        customer_id: 'cust_demo_03',
        status: 'completed',
        total_paise: 500000,
        created_at: thirtyFiveDaysAgo,
        completed_at: thirtyFiveDaysAgo,
        failure_reason: null,
        items: [{ product_id: 'prod_002', name: 'Cloud Server Instance', price_paise: 500000, quantity: 1 }] as any,
      },
      {
        id: 'ord_demo_03_3',
        customer_id: 'cust_demo_03',
        status: 'completed',
        total_paise: 500000,
        created_at: thirtyFiveDaysAgo,
        completed_at: thirtyFiveDaysAgo,
        failure_reason: null,
        items: [{ product_id: 'prod_003', name: 'API Gateway Addon', price_paise: 500000, quantity: 1 }] as any,
      },
    ],
  });

  console.log('========================================');
  console.log('📊 CURATED DEMO DATASET (4 OPPORTUNITIES)');
  console.log('========================================');
  console.log(' 1. Ananya Sharma   -> Abandoned Checkout (₹8,500)   [Target: APPROVED -> Live Link]');
  console.log(' 2. Vikram Malhotra -> Failed UPI Payment (₹6,500)    [Target: APPROVED -> Live Link]');
  console.log(' 3. Priya Patel     -> VIP Upsell (₹9,500)           [Target: APPROVED -> Live Link]');
  console.log(' 4. Rahul Verma     -> High-Value Cart (₹35,000)     [Target: BLOCKED by Policy (amount_limit)]');
  console.log('========================================\n');

  await prisma.$disconnect();
  console.log('✅ Small database seeded successfully into PostgreSQL!');
}

seedSmall().catch(console.error);
