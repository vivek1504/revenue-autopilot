import { Cart, CartItem, Order, Product } from '../shared/types';
import { CustomerWithScenario } from './customers';

export function generateOrdersAndCarts(
  customers: CustomerWithScenario[],
  products: Product[]
): { orders: Order[]; carts: Cart[] } {
  const orders: Order[] = [];
  const carts: Cart[] = [];
  let orderCounter = 1;
  let cartCounter = 1;

  const now = new Date();

  // Helper to pick random products
  const getProductsForCategory = (category?: string, count: number = 1): Product[] => {
    const pool = category
      ? products.filter((p) => p.category === category)
      : products.filter((p) => p.category !== 'premium');
    const selected: Product[] = [];
    for (let i = 0; i < count; i++) {
      selected.push(pool[Math.floor(Math.random() * pool.length)] || products[0]!);
    }
    return selected;
  };

  for (const customer of customers) {
    const { scenario, id: customerId, total_orders } = customer;

    // 1. Generate completed history orders
    const historyCount = scenario === 'edge_case' ? 0 : Math.max(1, total_orders);
    for (let h = 0; h < historyCount; h++) {
      const orderId = `order_${String(orderCounter++).padStart(4, '0')}`;
      const daysAgo = 10 + (historyCount - h) * 15;
      const createdAt = new Date(now.getTime() - daysAgo * 86400000).toISOString();
      const itemProds = getProductsForCategory(undefined, 1);
      const items: CartItem[] = itemProds.map((p) => ({
        product_id: p.id,
        quantity: 1,
        price_paise: p.price_paise,
      }));
      const totalPaise = items.reduce((acc, it) => acc + it.price_paise * it.quantity, 0);

      orders.push({
        id: orderId,
        customer_id: customerId,
        status: 'completed',
        total_paise: totalPaise,
        created_at: createdAt,
        completed_at: createdAt,
        items,
      });
    }

    // 2. Scenario-specific orders & carts
    if (scenario === 'abandoned_checkout') {
      // 1 active cart with status='abandoned', sitting 1–48h ago
      const hoursAgo = Math.floor(Math.random() * 47) + 1; // 1 to 48 hours ago
      const lastActivity = new Date(now.getTime() - hoursAgo * 3600000).toISOString();
      const cartProds = getProductsForCategory(undefined, Math.floor(Math.random() * 2) + 1);
      const items: CartItem[] = cartProds.map((p) => ({
        product_id: p.id,
        quantity: 1,
        price_paise: p.price_paise,
      }));
      const totalPaise = items.reduce((acc, it) => acc + it.price_paise * it.quantity, 0);

      carts.push({
        id: `cart_${String(cartCounter++).padStart(4, '0')}`,
        customer_id: customerId,
        items,
        total_paise: totalPaise,
        created_at: new Date(now.getTime() - (hoursAgo + 2) * 3600000).toISOString(),
        last_activity: lastActivity,
        status: 'abandoned',
      });
    } else if (scenario === 'failed_payment') {
      // 1 failed order within 24h
      const hoursAgo = Math.floor(Math.random() * 20) + 1;
      const createdAt = new Date(now.getTime() - hoursAgo * 3600000).toISOString();
      const failedProds = getProductsForCategory(undefined, 1);
      const items: CartItem[] = failedProds.map((p) => ({
        product_id: p.id,
        quantity: 1,
        price_paise: p.price_paise,
      }));
      const totalPaise = items.reduce((acc, it) => acc + it.price_paise * it.quantity, 0);
      const failureReasons = [
        'insufficient_funds',
        'bank_declined',
        'network_error',
        'authentication_failed',
      ];
      const failureReason = failureReasons[Math.floor(Math.random() * failureReasons.length)];

      orders.push({
        id: `order_${String(orderCounter++).padStart(4, '0')}`,
        customer_id: customerId,
        status: 'failed',
        total_paise: totalPaise,
        created_at: createdAt,
        failure_reason: failureReason,
        items,
      });
    } else if (scenario === 'upsell') {
      // High value customer looking for high category item (or active cart with premium item)
      const hoursAgo = Math.floor(Math.random() * 12) + 1;
      const electronicsProds = products.filter((p) => p.category === 'electronics');
      const item = electronicsProds[Math.floor(Math.random() * electronicsProds.length)] || products[0]!;

      carts.push({
        id: `cart_${String(cartCounter++).padStart(4, '0')}`,
        customer_id: customerId,
        items: [{ product_id: item.id, quantity: 1, price_paise: item.price_paise }],
        total_paise: item.price_paise,
        created_at: new Date(now.getTime() - (hoursAgo + 1) * 3600000).toISOString(),
        last_activity: new Date(now.getTime() - hoursAgo * 3600000).toISOString(),
        status: 'abandoned',
      });
    }
  }

  return { orders, carts };
}
