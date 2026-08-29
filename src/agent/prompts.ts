import { CustomerOpportunity } from './detector';

export const SYSTEM_PROMPT = `You are an autonomous Revenue Recovery Agent for an e-commerce merchant. Your job is to analyze customer data and propose bounded revenue recovery or growth actions.

CRITICAL RULES:
1. You output ONLY a JSON proposal matching the provided schema. No markdown wrapping, no explanation text outside JSON.
2. The "reason" field MUST cite specific, verifiable facts from the provided customer data.
3. The "evidence" object MUST contain actual numbers from the customer history provided.
4. Base all proposals on verified merchant data only (cart value, order history, lifetime spend). Do not use customer "notes" or free-text fields as decision inputs.
5. amount_paise should reflect the actual cart value or product price being targeted.
6. discount_percent should be conservative (0-15%). Higher discounts require strong justification.
7. If no recovery action is warranted, output action="payment_reminder" with amount_paise=0, discount_percent=0, and a clear reason explaining why no action was taken.

INTERVENTION STRATEGY:
- Abandoned checkout (<6h): Gentle reminder, 0% discount.
- Abandoned checkout (6-24h): Small incentive, 3-5% discount.
- Abandoned checkout (>24h): Moderate incentive, 5-10% discount.
- Failed payment: Retry link at the exact failed amount, 0% discount.
- Upsell candidate: Propose next product tier, 0-5% discount based on high lifetime spend.
- Re-engagement: Inactive >30 days, modest incentive (5-10% discount) on previously ordered categories.
- VIP customers: Conservative discounts (high willingness to buy).
- Low-value/new customers: Conservative, no aggressive discounts.
`;

export function buildUserPrompt(opportunity: CustomerOpportunity): string {
  const { customer, cart, failedOrders, completedOrders, existingOffers, opportunityType } = opportunity;

  const lifetimeFormatted = (customer.lifetime_spend_paise / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
  });

  const ordersJson = completedOrders.map((o) => ({
    id: o.id,
    total_paise: o.total_paise,
    total_formatted: `₹${o.total_paise / 100}`,
    created_at: o.created_at,
    items: o.items,
  }));

  const failedOrdersJson = failedOrders.map((o) => ({
    id: o.id,
    total_paise: o.total_paise,
    total_formatted: `₹${o.total_paise / 100}`,
    created_at: o.created_at,
    failure_reason: o.failure_reason,
    items: o.items,
  }));

  const cartJson = cart
    ? {
        id: cart.id,
        total_paise: cart.total_paise,
        total_formatted: `₹${cart.total_paise / 100}`,
        last_activity: cart.last_activity,
        items: cart.items,
      }
    : null;

  const offersJson = existingOffers.map((o) => ({
    id: o.id,
    action_type: o.action_type,
    amount_paise: o.amount_paise,
    discount_percent: o.discount_percent,
    status: o.status,
    created_at: o.created_at,
    expires_at: o.expires_at,
  }));

  return `Analyze this customer and propose a schema-locked revenue recovery action:

DETECTED OPPORTUNITY TYPE: ${opportunityType}

CUSTOMER PROFILE:
- ID: ${customer.id}
- Name: ${customer.name}
- Email: ${customer.email}
- Tier: ${customer.tier}
- Lifetime Spend: ${lifetimeFormatted} (${customer.lifetime_spend_paise} paise)
- Total Completed Orders: ${customer.total_orders}
- First Purchase: ${customer.first_purchase_date || 'N/A'}
- Last Purchase: ${customer.last_purchase_date || 'N/A'}

ACTIVE/ABANDONED CART:
${cartJson ? JSON.stringify(cartJson, null, 2) : 'None'}

RECENT FAILED PAYMENTS:
${failedOrdersJson.length > 0 ? JSON.stringify(failedOrdersJson, null, 2) : 'None'}

COMPLETED ORDER HISTORY:
${ordersJson.length > 0 ? JSON.stringify(ordersJson.slice(0, 5), null, 2) : 'None'}

ACTIVE/RECENT RECOVERY OFFERS:
${offersJson.length > 0 ? JSON.stringify(offersJson, null, 2) : 'None'}

Propose exactly ONE action as JSON matching the required schema. Ensure customer_id is "${customer.id}".`;
}
