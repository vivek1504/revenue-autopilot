import fs from 'fs';
import { prisma } from '../src/api/dependencies';
import { generateCustomers } from '../src/data/customers';
import { generateOrdersAndCarts } from '../src/data/orders';
import { PRODUCT_CATALOG } from '../src/data/products';
import { config } from '../src/shared/config';

async function seed() {
  console.log('🌱 Seeding synthetic merchant dataset into PostgreSQL via Prisma...\n');

  // Clear audit log so audit verification starts clean
  try {
    fs.writeFileSync(config.auditPath, '');
  } catch (e) {}

  await prisma.recoveryOffer.deleteMany({});
  await prisma.recoveryOpportunity.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.product.deleteMany({});

  console.log('📦 Inserting product catalog...');
  await prisma.product.createMany({
    data: PRODUCT_CATALOG.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price_paise: p.price_paise,
      description: p.description,
    })),
  });
  console.log(`   ✓ ${PRODUCT_CATALOG.length} products inserted.`);

  console.log('\n👥 Generating synthetic customers...');
  const customers = generateCustomers(120);
  await prisma.customer.createMany({
    data: customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone || null,
      tier: c.tier,
      lifetime_spend_paise: c.lifetime_spend_paise,
      total_orders: c.total_orders,
      first_purchase_date: c.first_purchase_date ? new Date(c.first_purchase_date) : null,
      last_purchase_date: c.last_purchase_date ? new Date(c.last_purchase_date) : null,
      notes: c.notes || null,
      created_at: new Date(c.created_at),
    })),
  });
  console.log(`   ✓ ${customers.length} customers inserted.`);

  console.log('\n🛒 Generating orders and active carts...');
  const { orders, carts } = generateOrdersAndCarts(customers, PRODUCT_CATALOG);

  await prisma.order.createMany({
    data: orders.map((o) => ({
      id: o.id,
      customer_id: o.customer_id,
      status: o.status,
      total_paise: o.total_paise,
      created_at: new Date(o.created_at),
      completed_at: o.completed_at ? new Date(o.completed_at) : null,
      failure_reason: o.failure_reason || null,
      items: o.items as any,
    })),
  });
  console.log(`   ✓ ${orders.length} orders inserted.`);

  await prisma.cart.createMany({
    data: carts.map((cart) => ({
      id: cart.id,
      customer_id: cart.customer_id,
      items: cart.items as any,
      total_paise: cart.total_paise,
      created_at: new Date(cart.created_at),
      last_activity: new Date(cart.last_activity),
      status: cart.status,
    })),
  });
  console.log(`   ✓ ${carts.length} active/abandoned carts inserted.`);

  const stats = {
    customers: await prisma.customer.count(),
    orders: await prisma.order.count(),
    completedOrders: await prisma.order.count({ where: { status: 'completed' } }),
    failedOrders: await prisma.order.count({ where: { status: 'failed' } }),
    abandonedCarts: await prisma.cart.count({ where: { status: 'abandoned' } }),
    vipCustomers: await prisma.customer.count({ where: { tier: 'vip' } }),
  };

  console.log('\n========================================');
  console.log('📊 SYNTHETIC DATASET SUMMARY');
  console.log('========================================');
  console.log(` Total Customers:       ${stats.customers}`);
  console.log(` Total Orders:          ${stats.orders} (${stats.completedOrders} completed, ${stats.failedOrders} failed)`);
  console.log(` Abandoned Carts:       ${stats.abandonedCarts}`);
  console.log(` VIP Customers:         ${stats.vipCustomers}`);
  console.log('========================================\n');

  await prisma.$disconnect();
  console.log('✅ Database seeded successfully!');
}

seed().catch(console.error);
