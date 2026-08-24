import Database from 'better-sqlite3';
import { Cart, Customer, Order, OpportunityType, RecoveryOffer } from '../shared/types';

export interface CustomerOpportunity {
  customer: Customer;
  opportunityType: OpportunityType;
  cart?: Cart;
  failedOrders: Order[];
  completedOrders: Order[];
  existingOffers: RecoveryOffer[];
}

export function detectOpportunities(db: Database.Database): CustomerOpportunity[] {
  const opportunities: CustomerOpportunity[] = [];
  const processedCustomerIds = new Set<string>();

  const parseItems = (raw: string) => {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  };

  // 1. Abandoned Checkouts (carts abandoned >1h ago)
  const abandonedCarts = db.prepare(`
    SELECT c.*, cart.id as cart_id, cart.items as cart_items, 
           cart.total_paise as cart_total, cart.created_at as cart_created,
           cart.last_activity as cart_last_activity, cart.status as cart_status
    FROM customers c
    JOIN carts cart ON cart.customer_id = c.id
    WHERE cart.status = 'abandoned'
    AND datetime(cart.last_activity) <= datetime('now', '-1 hour')
    AND NOT EXISTS (
      SELECT 1 FROM recovery_offers ro 
      WHERE ro.customer_id = c.id 
      AND ro.status IN ('pending', 'sent')
      AND datetime(ro.expires_at) > datetime('now')
    )
  `).all() as any[];

  for (const row of abandonedCarts) {
    const customer = getCustomerFromRow(row);
    if (processedCustomerIds.has(customer.id)) continue;

    const cart: Cart = {
      id: row.cart_id,
      customer_id: customer.id,
      items: parseItems(row.cart_items),
      total_paise: row.cart_total,
      created_at: row.cart_created,
      last_activity: row.cart_last_activity,
      status: row.cart_status,
    };

    const completedOrders = getCompletedOrders(db, customer.id);
    const failedOrders = getFailedOrders(db, customer.id);
    const existingOffers = getExistingOffers(db, customer.id);

    opportunities.push({
      customer,
      opportunityType: 'abandoned_checkout',
      cart,
      failedOrders,
      completedOrders,
      existingOffers,
    });
    processedCustomerIds.add(customer.id);
  }

  // 2. Failed Payments (within last 48h)
  const failedPaymentRows = db.prepare(`
    SELECT c.*, o.id as order_id, o.total_paise as order_total, 
           o.created_at as order_created, o.failure_reason, o.items as order_items
    FROM customers c
    JOIN orders o ON o.customer_id = c.id
    WHERE o.status = 'failed'
    AND datetime(o.created_at) >= datetime('now', '-48 hours')
    AND NOT EXISTS (
      SELECT 1 FROM recovery_offers ro 
      WHERE ro.customer_id = c.id 
      AND ro.status IN ('pending', 'sent')
      AND datetime(ro.expires_at) > datetime('now')
    )
  `).all() as any[];

  for (const row of failedPaymentRows) {
    const customer = getCustomerFromRow(row);
    if (processedCustomerIds.has(customer.id)) continue;

    const completedOrders = getCompletedOrders(db, customer.id);
    const failedOrders = getFailedOrders(db, customer.id);
    const existingOffers = getExistingOffers(db, customer.id);

    opportunities.push({
      customer,
      opportunityType: 'failed_payment',
      failedOrders,
      completedOrders,
      existingOffers,
    });
    processedCustomerIds.add(customer.id);
  }

  // 3. Upsell Candidates (3+ completed orders, VIP/premium tier)
  const upsellCandidates = db.prepare(`
    SELECT c.*
    FROM customers c
    WHERE c.total_orders >= 3
    AND c.tier IN ('premium', 'vip')
    AND NOT EXISTS (
      SELECT 1 FROM carts cart WHERE cart.customer_id = c.id AND cart.status = 'abandoned'
    )
    AND NOT EXISTS (
      SELECT 1 FROM recovery_offers ro 
      WHERE ro.customer_id = c.id 
      AND ro.status IN ('pending', 'sent')
      AND datetime(ro.expires_at) > datetime('now')
    )
  `).all() as any[];

  for (const row of upsellCandidates) {
    const customer = getCustomerFromRow(row);
    if (processedCustomerIds.has(customer.id)) continue;

    const completedOrders = getCompletedOrders(db, customer.id);
    const failedOrders = getFailedOrders(db, customer.id);
    const existingOffers = getExistingOffers(db, customer.id);

    opportunities.push({
      customer,
      opportunityType: 'upsell',
      failedOrders,
      completedOrders,
      existingOffers,
    });
    processedCustomerIds.add(customer.id);
  }

  // 4. Re-engagement (inactive >30 days, 2+ prior orders)
  const reengagementCandidates = db.prepare(`
    SELECT c.*
    FROM customers c
    WHERE c.total_orders >= 2
    AND datetime(c.last_purchase_date) <= datetime('now', '-30 days')
    AND NOT EXISTS (
      SELECT 1 FROM recovery_offers ro 
      WHERE ro.customer_id = c.id 
      AND ro.status IN ('pending', 'sent')
      AND datetime(ro.expires_at) > datetime('now')
    )
  `).all() as any[];

  for (const row of reengagementCandidates) {
    const customer = getCustomerFromRow(row);
    if (processedCustomerIds.has(customer.id)) continue;

    const completedOrders = getCompletedOrders(db, customer.id);
    const failedOrders = getFailedOrders(db, customer.id);
    const existingOffers = getExistingOffers(db, customer.id);

    opportunities.push({
      customer,
      opportunityType: 're_engagement',
      failedOrders,
      completedOrders,
      existingOffers,
    });
    processedCustomerIds.add(customer.id);
  }

  return opportunities;
}

function getCustomerFromRow(row: any): Customer {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    tier: row.tier,
    lifetime_spend_paise: row.lifetime_spend_paise,
    total_orders: row.total_orders,
    first_purchase_date: row.first_purchase_date,
    last_purchase_date: row.last_purchase_date,
    notes: row.notes,
    created_at: row.created_at,
  };
}

function getCompletedOrders(db: Database.Database, customerId: string): Order[] {
  const rows = db.prepare(`
    SELECT * FROM orders WHERE customer_id = ? AND status = 'completed' ORDER BY created_at DESC
  `).all(customerId) as any[];

  return rows.map((r) => ({
    id: r.id,
    customer_id: r.customer_id,
    status: r.status,
    total_paise: r.total_paise,
    created_at: r.created_at,
    completed_at: r.completed_at,
    items: JSON.parse(r.items || '[]'),
  }));
}

function getFailedOrders(db: Database.Database, customerId: string): Order[] {
  const rows = db.prepare(`
    SELECT * FROM orders WHERE customer_id = ? AND status = 'failed' ORDER BY created_at DESC
  `).all(customerId) as any[];

  return rows.map((r) => ({
    id: r.id,
    customer_id: r.customer_id,
    status: r.status,
    total_paise: r.total_paise,
    created_at: r.created_at,
    failure_reason: r.failure_reason,
    items: JSON.parse(r.items || '[]'),
  }));
}

function getExistingOffers(db: Database.Database, customerId: string): RecoveryOffer[] {
  const rows = db.prepare(`
    SELECT * FROM recovery_offers WHERE customer_id = ? ORDER BY created_at DESC
  `).all(customerId) as any[];

  return rows.map((r) => ({
    id: r.id,
    customer_id: r.customer_id,
    action_type: r.action_type,
    amount_paise: r.amount_paise,
    discount_percent: r.discount_percent,
    status: r.status,
    created_at: r.created_at,
    expires_at: r.expires_at,
    razorpay_payment_link_id: r.razorpay_payment_link_id,
    razorpay_order_id: r.razorpay_order_id,
  }));
}
