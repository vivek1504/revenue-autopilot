import { z } from 'zod';
import { SchemaType, ResponseSchema } from '@google/generative-ai';

export const AgentProposalSchema = z.object({
  customer_id: z.string().regex(/^cust_[a-zA-Z0-9_]+$/),
  action: z.enum([
    'discounted_payment_link',
    'payment_reminder',
    'upsell_payment_link',
    'retry_payment_link',
  ]),
  amount_paise: z.number().int().min(0),
  discount_percent: z.number().min(0).max(100),
  expiry_hours: z.number().int().min(1).max(168),
  reason: z.string().min(10).max(500),
  opportunity_type: z.enum([
    'abandoned_checkout',
    'failed_payment',
    'upsell',
    're_engagement',
  ]),
  confidence_score: z.number().min(0).max(1).optional(),
  evidence: z.object({
    cart_value_paise: z.number().optional(),
    lifetime_spend_paise: z.number().optional(),
    last_purchase_days_ago: z.number().optional(),
    failed_payment_count: z.number().optional(),
    cart_abandoned_hours_ago: z.number().optional(),
  }),
});

export type AgentProposalValidated = z.infer<typeof AgentProposalSchema>;

export const GEMINI_PROPOSAL_RESPONSE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    customer_id: {
      type: SchemaType.STRING,
      description: 'The customer identifier e.g. cust_042 or cust_demo_01',
    },
    action: {
      type: SchemaType.STRING,
      format: 'enum',
      enum: [
        'discounted_payment_link',
        'payment_reminder',
        'upsell_payment_link',
        'retry_payment_link',
      ],
      description: 'The proposed revenue recovery or growth action',
    },
    amount_paise: {
      type: SchemaType.INTEGER,
      description: 'Amount in paise (e.g. 50000 for ₹500)',
    },
    discount_percent: {
      type: SchemaType.NUMBER,
      description: 'Discount percentage between 0 and 100',
    },
    expiry_hours: {
      type: SchemaType.INTEGER,
      description: 'Link expiration time in hours (1-168)',
    },
    reason: {
      type: SchemaType.STRING,
      description: 'Short explanation justifying this action',
    },
    opportunity_type: {
      type: SchemaType.STRING,
      format: 'enum',
      enum: [
        'abandoned_checkout',
        'failed_payment',
        'upsell',
        're_engagement',
      ],
      description: 'The identified trigger reason',
    },
    evidence: {
      type: SchemaType.OBJECT,
      properties: {
        cart_value_paise: { type: SchemaType.INTEGER },
        lifetime_spend_paise: { type: SchemaType.INTEGER },
        last_purchase_days_ago: { type: SchemaType.INTEGER },
        failed_payment_count: { type: SchemaType.INTEGER },
        cart_abandoned_hours_ago: { type: SchemaType.INTEGER },
      },
      description: 'Evidence supporting this proposal',
    },
  },
  required: [
    'customer_id',
    'action',
    'amount_paise',
    'discount_percent',
    'expiry_hours',
    'reason',
    'opportunity_type',
    'evidence',
  ],
};
