import { PrismaClient } from '@prisma/client';
import { Cart, Customer, Order, OpportunityType, RecoveryOffer, ActionType } from '../shared/types';

export interface CustomerOpportunity {
  customer: Customer;
  opportunityType: OpportunityType;
  cart?: Cart;
  failedOrders: Order[];
  completedOrders: Order[];
  existingOffers: RecoveryOffer[];
}

export async function detectOpportunities(prisma: PrismaClient): Promise<CustomerOpportunity[]> {
  const opportunities: CustomerOpportunity[] = [];
  const processedCustomerIds = new Set<string>();

  const parseItems = (raw: any) => {
    if (typeof raw === 'string') {
      try { return JSON.parse(raw); } catch { return []; }
    }
    return Array.isArray(raw) ? raw : [];
  };

  const formatDateStr = (d?: Date | null): string => {
    return d ? d.toISOString() : '';
  };

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // 1. Abandoned Checkouts (carts abandoned >1h ago)
  const abandonedCarts = await prisma.cart.findMany({
    where: {
      status: 'abandoned',
      last_activity: { lte: oneHourAgo },
      customer: {
        recovery_offers: {
          none: {
            status: { in: ['pending', 'sent'] },
            expires_at: { gt: now },
          },
        },
      },
    },
    include: {
      customer: true,
    },
  });

  for (const cartRow of abandonedCarts) {
    const customer = mapCustomer(cartRow.customer);
    if (processedCustomerIds.has(customer.id)) continue;

    const cart: Cart = {
      id: cartRow.id,
      customer_id: customer.id,
      items: parseItems(cartRow.items),
      total_paise: cartRow.total_paise,
      created_at: formatDateStr(cartRow.created_at),
      last_activity: formatDateStr(cartRow.last_activity),
      status: cartRow.status as 'abandoned' | 'active' | 'converted',
    };

    const completedOrders = await getCompletedOrders(prisma, customer.id);
    const failedOrders = await getFailedOrders(prisma, customer.id);
    const existingOffers = await getExistingOffers(prisma, customer.id);

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
  const failedPaymentOrders = await prisma.order.findMany({
    where: {
      status: 'failed',
      created_at: { gte: fortyEightHoursAgo },
      customer: {
        recovery_offers: {
          none: {
            status: { in: ['pending', 'sent'] },
            expires_at: { gt: now },
          },
        },
      },
    },
    include: {
      customer: true,
    },
  });

  for (const orderRow of failedPaymentOrders) {
    const customer = mapCustomer(orderRow.customer);
    if (processedCustomerIds.has(customer.id)) continue;

    const completedOrders = await getCompletedOrders(prisma, customer.id);
    const failedOrders = await getFailedOrders(prisma, customer.id);
    const existingOffers = await getExistingOffers(prisma, customer.id);

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
  const upsellCandidates = await prisma.customer.findMany({
    where: {
      total_orders: { gte: 3 },
      tier: { in: ['premium', 'vip'] },
      carts: {
        none: { status: 'abandoned' },
      },
      recovery_offers: {
        none: {
          status: { in: ['pending', 'sent'] },
          expires_at: { gt: now },
        },
      },
    },
  });

  for (const custRow of upsellCandidates) {
    const customer = mapCustomer(custRow);
    if (processedCustomerIds.has(customer.id)) continue;

    const completedOrders = await getCompletedOrders(prisma, customer.id);
    const failedOrders = await getFailedOrders(prisma, customer.id);
    const existingOffers = await getExistingOffers(prisma, customer.id);

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
  const reengagementCandidates = await prisma.customer.findMany({
    where: {
      total_orders: { gte: 2 },
      last_purchase_date: { lte: thirtyDaysAgo },
      recovery_offers: {
        none: {
          status: { in: ['pending', 'sent'] },
          expires_at: { gt: now },
        },
      },
    },
  });

  for (const custRow of reengagementCandidates) {
    const customer = mapCustomer(custRow);
    if (processedCustomerIds.has(customer.id)) continue;

    const completedOrders = await getCompletedOrders(prisma, customer.id);
    const failedOrders = await getFailedOrders(prisma, customer.id);
    const existingOffers = await getExistingOffers(prisma, customer.id);

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

function mapCustomer(c: any): Customer {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone ?? undefined,
    tier: c.tier,
    lifetime_spend_paise: c.lifetime_spend_paise,
    total_orders: c.total_orders,
    first_purchase_date: c.first_purchase_date ? c.first_purchase_date.toISOString() : undefined,
    last_purchase_date: c.last_purchase_date ? c.last_purchase_date.toISOString() : undefined,
    notes: c.notes ?? undefined,
    created_at: c.created_at ? c.created_at.toISOString() : '',
  };
}

async function getCompletedOrders(prisma: PrismaClient, customerId: string): Promise<Order[]> {
  const rows = await prisma.order.findMany({
    where: { customer_id: customerId, status: 'completed' },
    orderBy: { created_at: 'desc' },
  });

  return rows.map((r) => ({
    id: r.id,
    customer_id: r.customer_id,
    status: r.status as 'completed' | 'abandoned' | 'failed' | 'pending',
    total_paise: r.total_paise,
    created_at: r.created_at.toISOString(),
    completed_at: r.completed_at ? r.completed_at.toISOString() : undefined,
    items: Array.isArray(r.items) ? (r.items as any) : typeof r.items === 'string' ? JSON.parse(r.items) : [],
  }));
}

async function getFailedOrders(prisma: PrismaClient, customerId: string): Promise<Order[]> {
  const rows = await prisma.order.findMany({
    where: { customer_id: customerId, status: 'failed' },
    orderBy: { created_at: 'desc' },
  });

  return rows.map((r) => ({
    id: r.id,
    customer_id: r.customer_id,
    status: r.status as 'completed' | 'abandoned' | 'failed' | 'pending',
    total_paise: r.total_paise,
    created_at: r.created_at.toISOString(),
    failure_reason: r.failure_reason ?? undefined,
    items: Array.isArray(r.items) ? (r.items as any) : typeof r.items === 'string' ? JSON.parse(r.items) : [],
  }));
}

async function getExistingOffers(prisma: PrismaClient, customerId: string): Promise<RecoveryOffer[]> {
  const rows = await prisma.recoveryOffer.findMany({
    where: { customer_id: customerId },
    orderBy: { created_at: 'desc' },
  });

  return rows.map((r) => ({
    id: r.id,
    customer_id: r.customer_id,
    action_type: r.action_type as ActionType,
    amount_paise: r.amount_paise,
    discount_percent: r.discount_percent,
    status: r.status as RecoveryOffer['status'],
    created_at: r.created_at.toISOString(),
    expires_at: r.expires_at.toISOString(),
    razorpay_payment_link_id: r.razorpay_payment_link_id ?? undefined,
    razorpay_order_id: r.razorpay_order_id ?? undefined,
  }));
}
