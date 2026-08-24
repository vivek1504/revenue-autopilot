export const DEFAULT_MERCHANT_POLICY = {
  maxAutomatedTransactionPaise: 10_00_000, // ₹10,000 max (1,000,000 paise)
  maxDiscountPercent: 15,                  // 15% max discount
  maxExpiryHours: 72,                      // 72 hours max expiry
  minExpiryHours: 1,                       // 1 hour min expiry
  maxOffersPerCustomerPerDay: 1,           // Maximum 1 offer per customer per day
  requireEvidenceField: true,               // Require evidence object with values
  allowedActions: [
    'discounted_payment_link',
    'payment_reminder',
    'upsell_payment_link',
    'retry_payment_link',
  ] as const,
};

export type MerchantPolicy = typeof DEFAULT_MERCHANT_POLICY;
