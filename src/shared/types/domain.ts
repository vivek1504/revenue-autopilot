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

export type OpportunityStatus = 'OPEN' | 'PURSUING' | 'RECOVERED' | 'EXPIRED' | 'CLOSED';

export interface RecoveryOpportunity {
  id: string;
  customer_id: string;
  idempotency_key: string;
  type: 'FAILED_PAYMENT' | 'ABANDONED_CART' | 'UPSELL' | 'REENGAGEMENT';
  source_type?: 'ORDER' | 'CART' | null;
  source_id?: string | null;
  strategy_key?: string | null;
  estimated_value_paise: number;
  value_is_estimated: boolean;
  status: OpportunityStatus;
  detected_at: string;
  resolved_at?: string | null;
}

export type ActionType =
  | 'discounted_payment_link'
  | 'payment_reminder'
  | 'upsell_payment_link'
  | 'retry_payment_link';

export type RecoveryOfferStatus =
  | 'PENDING'
  | 'ESCALATED'
  | 'DISPATCHED'
  | 'EXECUTION_FAILED'
  | 'RECOVERED'
  | 'EXPIRED';

export type ExecutionMode = 'LIVE' | 'SIMULATED';

export interface RecoveryOffer {
  id: string;
  customer_id: string;
  opportunity_id?: string | null;
  action_type: ActionType;
  amount_paise: number;
  discount_percent: number;
  status: RecoveryOfferStatus;
  execution_mode?: ExecutionMode | null;
  created_at: string;
  expires_at: string;
  razorpay_payment_link_id?: string | null;
  razorpay_order_id?: string | null;
  opportunity_type?: string | null;
  policy_verdict?: string | null;
  ai_reason?: string | null;
  ai_confidence_score?: number | null;
}
