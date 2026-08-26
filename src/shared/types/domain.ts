export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  tier: 'standard' | 'premium' | 'vip';
  lifetime_spend_paise: number;
  total_orders: number;
  first_purchase_date?: string;
  last_purchase_date?: string;
  notes?: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price_paise: number;
  description: string;
}

export interface CartItem {
  product_id: string;
  quantity: number;
  price_paise: number;
}

export interface Cart {
  id: string;
  customer_id: string;
  items: CartItem[];
  total_paise: number;
  created_at: string;
  last_activity: string;
  status: 'active' | 'abandoned' | 'converted';
}

export interface Order {
  id: string;
  customer_id: string;
  status: 'completed' | 'failed' | 'abandoned' | 'pending';
  total_paise: number;
  created_at: string;
  completed_at?: string;
  failure_reason?: string;
  items: CartItem[];
}

export type ActionType =
  | 'discounted_payment_link'
  | 'payment_reminder'
  | 'upsell_payment_link'
  | 'retry_payment_link';

export interface RecoveryOffer {
  id: string;
  customer_id: string;
  action_type: ActionType;
  amount_paise: number;
  discount_percent: number;
  status: 'pending' | 'sent' | 'redeemed' | 'expired';
  created_at: string;
  expires_at: string;
  razorpay_payment_link_id?: string;
  razorpay_order_id?: string;
}
