import { PrismaClient } from '@prisma/client';
import { Cart, Customer, Order, OpportunityType, RecoveryOffer, ActionType } from '../shared/types';

export interface CustomerOpportunity {
  customer: Customer;
  opportunityType: OpportunityType;
  opportunityId?: string;
  cart?: Cart;
  failedOrders: Order[];
  completedOrders: Order[];
  existingOffers: RecoveryOffer[];
}

const STRATEGY_COOLDOWNS: Record<string, number> = {
  PREMIUM_UPSELL: 30,
  WINBACK: 30,
};

export async function detectOpportunities(prisma: PrismaClient): Promise<CustomerOpportunity[]> {
  const opportunities: CustomerOpportunity[] = [];

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
            status: { in: ['PENDING', 'DISPATCHED', 'pending', 'sent'] },
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

    const idempotencyKey = `ABANDONED_CART:${cartRow.id}`;
    let oppRecord = await prisma.recoveryOpportunity.findUnique({
      where: { idempotency_key: idempotencyKey },
    });

    if (!oppRecord) {
      try {
        oppRecord = await prisma.recoveryOpportunity.create({
          data: {
            customer_id: customer.id,
            idempotency_key: idempotencyKey,
            type: 'ABANDONED_CART',
            source_type: 'CART',
            source_id: cartRow.id,
            estimated_value_paise: cartRow.total_paise,
            value_is_estimated: false,
            status: 'OPEN',
          },
        });
      } catch {
        oppRecord = await prisma.recoveryOpportunity.findUnique({
          where: { idempotency_key: idempotencyKey },
        });
      }
    }

    if (!oppRecord || oppRecord.status !== 'OPEN') continue;

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
      opportunityId: oppRecord.id,
      cart,
      failedOrders,
      completedOrders,
      existingOffers,
    });
  }

  // 2. Failed Payments (within last 48h)
  const failedPaymentOrders = await prisma.order.findMany({
    where: {
      status: 'failed',
      created_at: { gte: fortyEightHoursAgo },
      customer: {
        recovery_offers: {
          none: {
            status: { in: ['PENDING', 'DISPATCHED', 'pending', 'sent'] },
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

    const idempotencyKey = `FAILED_PAYMENT:${orderRow.id}`;
    let oppRecord = await prisma.recoveryOpportunity.findUnique({
      where: { idempotency_key: idempotencyKey },
    });

    if (!oppRecord) {
      try {
        oppRecord = await prisma.recoveryOpportunity.create({
          data: {
            customer_id: customer.id,
            idempotency_key: idempotencyKey,
            type: 'FAILED_PAYMENT',
            source_type: 'ORDER',
            source_id: orderRow.id,
            estimated_value_paise: orderRow.total_paise,
            value_is_estimated: false,
            status: 'OPEN',
          },
        });
      } catch {
        oppRecord = await prisma.recoveryOpportunity.findUnique({
          where: { idempotency_key: idempotencyKey },
        });
      }
    }

    if (!oppRecord || oppRecord.status !== 'OPEN') continue;

    const completedOrders = await getCompletedOrders(prisma, customer.id);
    const failedOrders = await getFailedOrders(prisma, customer.id);
    const existingOffers = await getExistingOffers(prisma, customer.id);

    opportunities.push({
      customer,
      opportunityType: 'failed_payment',
      opportunityId: oppRecord.id,
      failedOrders,
      completedOrders,
      existingOffers,
    });
  }

  // 3. Upsell Candidates (3+ completed orders, VIP/premium tier, explicit 30-day cooldown)
  const upsellCandidates = await prisma.customer.findMany({
    where: {
      total_orders: { gte: 3 },
      tier: { in: ['premium', 'vip'] },
      carts: {
        none: { status: 'abandoned' },
      },
      recovery_offers: {
        none: {
          status: { in: ['PENDING', 'DISPATCHED', 'pending', 'sent'] },
          expires_at: { gt: now },
        },
      },
    },
  });

  const upsellCooldownDays = STRATEGY_COOLDOWNS['PREMIUM_UPSELL'] || 30;
  const upsellCooldownStart = new Date(now.getTime() - upsellCooldownDays * 24 * 60 * 60 * 1000);

  for (const custRow of upsellCandidates) {
    const customer = mapCustomer(custRow);

    const recentUpsell = await prisma.recoveryOpportunity.findFirst({
      where: {
        customer_id: customer.id,
        type: 'UPSELL',
        detected_at: { gte: upsellCooldownStart },
      },
    });
    if (recentUpsell && recentUpsell.status !== 'OPEN') continue;

    const idempotencyKey = `UPSELL:${customer.id}:${now.toISOString().slice(0, 10)}`;
    let oppRecord = recentUpsell || (await prisma.recoveryOpportunity.findUnique({
      where: { idempotency_key: idempotencyKey },
    }));

    if (!oppRecord) {
      const completed = await getCompletedOrders(prisma, customer.id);
      const estimatedValue = completed.length > 0
        ? Math.round(completed[0]!.total_paise * 1.3)
        : 499900;

      try {
        oppRecord = await prisma.recoveryOpportunity.create({
          data: {
            customer_id: customer.id,
            idempotency_key: idempotencyKey,
            type: 'UPSELL',
            strategy_key: 'PREMIUM_UPSELL',
            estimated_value_paise: estimatedValue,
            value_is_estimated: true,
            status: 'OPEN',
          },
        });
      } catch {
        oppRecord = await prisma.recoveryOpportunity.findUnique({
          where: { idempotency_key: idempotencyKey },
        });
      }
    }

    if (!oppRecord || oppRecord.status !== 'OPEN') continue;

    const completedOrders = await getCompletedOrders(prisma, customer.id);
    const failedOrders = await getFailedOrders(prisma, customer.id);
    const existingOffers = await getExistingOffers(prisma, customer.id);

    opportunities.push({
      customer,
      opportunityType: 'upsell',
      opportunityId: oppRecord.id,
      failedOrders,
      completedOrders,
      existingOffers,
    });
  }

  // 4. Re-engagement (inactive >30 days, 2+ prior orders, explicit 30-day cooldown)
  const reengagementCandidates = await prisma.customer.findMany({
    where: {
      total_orders: { gte: 2 },
      last_purchase_date: { lte: thirtyDaysAgo },
      recovery_offers: {
        none: {
          status: { in: ['PENDING', 'DISPATCHED', 'pending', 'sent'] },
          expires_at: { gt: now },
        },
      },
    },
  });

  const winbackCooldownDays = STRATEGY_COOLDOWNS['WINBACK'] || 30;
  const winbackCooldownStart = new Date(now.getTime() - winbackCooldownDays * 24 * 60 * 60 * 1000);

  for (const custRow of reengagementCandidates) {
    const customer = mapCustomer(custRow);

    const recentWinback = await prisma.recoveryOpportunity.findFirst({
      where: {
        customer_id: customer.id,
        type: 'REENGAGEMENT',
        detected_at: { gte: winbackCooldownStart },
      },
    });
    if (recentWinback && recentWinback.status !== 'OPEN') continue;

    const idempotencyKey = `REENGAGEMENT:${customer.id}:${now.toISOString().slice(0, 10)}`;
    let oppRecord = recentWinback || (await prisma.recoveryOpportunity.findUnique({
      where: { idempotency_key: idempotencyKey },
    }));

    if (!oppRecord) {
      try {
        oppRecord = await prisma.recoveryOpportunity.create({
          data: {
            customer_id: customer.id,
            idempotency_key: idempotencyKey,
            type: 'REENGAGEMENT',
            strategy_key: 'WINBACK',
            estimated_value_paise: 249900,
            value_is_estimated: true,
            status: 'OPEN',
          },
        });
      } catch {
        oppRecord = await prisma.recoveryOpportunity.findUnique({
          where: { idempotency_key: idempotencyKey },
        });
      }
    }

    if (!oppRecord || oppRecord.status !== 'OPEN') continue;

    const completedOrders = await getCompletedOrders(prisma, customer.id);
    const failedOrders = await getFailedOrders(prisma, customer.id);
    const existingOffers = await getExistingOffers(prisma, customer.id);

    opportunities.push({
      customer,
      opportunityType: 're_engagement',
      opportunityId: oppRecord.id,
      failedOrders,
      completedOrders,
      existingOffers,
    });
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
