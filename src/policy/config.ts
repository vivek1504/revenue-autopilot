export const DEFAULT_MERCHANT_POLICY = {
  maxAutomatedTransactionPaise: 10_00_000, // ₹10,000 max (1,000,000 paise)
  maxDiscountPercent: 15,                  // 15% max discount
  maxExpiryHours: 72,                      // 72 hours max expiry
  minExpiryHours: 1,                       // 1 hour min expiry
  maxOffersPerCustomerPerDay: 1,           // Maximum 1 offer per customer per day
  maxContactsPerCustomer7Days: 3,          // Stop after 3 attempts in 7 days (Stopping Rule)
  humanEscalationThresholdPaise: 25_00_000, // ₹25,000+ requires human escalation (Escalation Gate)
  minConfidenceScore: 0.70,                // 70% minimum agent confidence score required
  requireEvidenceField: true,               // Require evidence object with values
  allowedActions: [
    'discounted_payment_link',
    'payment_reminder',
    'upsell_payment_link',
    'retry_payment_link',
  ] as const,
};

export type MerchantPolicy = typeof DEFAULT_MERCHANT_POLICY;

