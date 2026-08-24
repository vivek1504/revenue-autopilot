import { initializeDatabase } from '../src/data/schema';
import { generateCustomers } from '../src/data/customers';
import { generateOrdersAndCarts } from '../src/data/orders';
import { PRODUCT_CATALOG } from '../src/data/products';

async function seed() {
  console.log('🌱 Seeding synthetic merchant dataset...\n');

  const db = initializeDatabase();

  db.exec('DELETE FROM recovery_offers');
  db.exec('DELETE FROM carts');
  db.exec('DELETE FROM orders');
  db.exec('DELETE FROM customers');
  db.exec('DELETE FROM products');

  console.log('📦 Inserting product catalog...');
  const insertProduct = db.prepare(
    'INSERT INTO products (id, name, category, price_paise, description) VALUES (?, ?, ?, ?, ?)'
  );
  for (const p of PRODUCT_CATALOG) {
    insertProduct.run(p.id, p.name, p.category, p.price_paise, p.description);
  }
  console.log(`   ✓ ${PRODUCT_CATALOG.length} products inserted.`);

  console.log('\n👥 Generating synthetic customers...');
  const customers = generateCustomers(120);
  const insertCustomer = db.prepare(`
    INSERT INTO customers (
      id, name, email, phone, tier, lifetime_spend_paise,
      total_orders, first_purchase_date, last_purchase_date, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const c of customers) {
    insertCustomer.run(
      c.id,
      c.name,
      c.email,
      c.phone || null,
      c.tier,
      c.lifetime_spend_paise,
      c.total_orders,
      c.first_purchase_date || null,
      c.last_purchase_date || null,
      c.notes || null,
      c.created_at
    );
  }
  console.log(`   ✓ ${customers.length} customers inserted.`);

  console.log('\n🛒 Generating orders and active carts...');
  const { orders, carts } = generateOrdersAndCarts(customers, PRODUCT_CATALOG);

  const insertOrder = db.prepare(`
    INSERT INTO orders (
      id, customer_id, status, total_paise, created_at, completed_at, failure_reason, items
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const o of orders) {
    insertOrder.run(
      o.id,
      o.customer_id,
      o.status,
      o.total_paise,
      o.created_at,
      o.completed_at || null,
      o.failure_reason || null,
      JSON.stringify(o.items)
    );
  }
  console.log(`   ✓ ${orders.length} orders inserted.`);

  const insertCart = db.prepare(`
    INSERT INTO carts (
      id, customer_id, items, total_paise, created_at, last_activity, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const cart of carts) {
    insertCart.run(
      cart.id,
      cart.customer_id,
      JSON.stringify(cart.items),
      cart.total_paise,
      cart.created_at,
      cart.last_activity,
      cart.status
    );
  }
  console.log(`   ✓ ${carts.length} active/abandoned carts inserted.`);

  const stats = {
    customers: (db.prepare('SELECT COUNT(*) as c FROM customers').get() as any).c,
    orders: (db.prepare('SELECT COUNT(*) as c FROM orders').get() as any).c,
    completedOrders: (db.prepare("SELECT COUNT(*) as c FROM orders WHERE status='completed'").get() as any).c,
    failedOrders: (db.prepare("SELECT COUNT(*) as c FROM orders WHERE status='failed'").get() as any).c,
    abandonedCarts: (db.prepare("SELECT COUNT(*) as c FROM carts WHERE status='abandoned'").get() as any).c,
    adversarialNotes: (db.prepare("SELECT COUNT(*) as c FROM customers WHERE notes IS NOT NULL").get() as any).c,
    vipCustomers: (db.prepare("SELECT COUNT(*) as c FROM customers WHERE tier='vip'").get() as any).c,
  };

  console.log('\n========================================');
  console.log('📊 SYNTHETIC DATASET SUMMARY');
  console.log('========================================');
  console.log(` Total Customers:       ${stats.customers}`);
  console.log(` Total Orders:          ${stats.orders} (${stats.completedOrders} completed, ${stats.failedOrders} failed)`);
  console.log(` Abandoned Carts:       ${stats.abandonedCarts}`);
  console.log(` VIP Customers:         ${stats.vipCustomers}`);
  console.log(` Adversarial Notes:     ${stats.adversarialNotes}`);
  console.log('========================================\n');

  db.close();
  console.log('✅ Database seeded successfully at data/merchant.db!');
}

seed().catch(console.error);
