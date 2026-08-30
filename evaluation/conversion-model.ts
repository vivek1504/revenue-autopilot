import { CustomerEvalProfile } from './types';

// Deterministic Pseudo-Random Number Generator based on string seed
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const x = Math.sin(hash++) * 10000;
  return x - Math.floor(x);
}

export function computeConversionProbability(
  profile: CustomerEvalProfile,
  discountPercent: number,
  isSpammingContact: boolean = false
): number {
  // 1. Base conversion by opportunity type
  let baseRate = 0.32; // Default for abandoned cart
  if (profile.opportunity_type === 'failed_payment') {
    baseRate = 0.52; // High intent: they already tried to pay
  } else if (profile.opportunity_type === 'abandoned_checkout') {
    baseRate = 0.34;
  } else if (profile.opportunity_type === 'upsell') {
    baseRate = 0.18;
  } else if (profile.opportunity_type === 're_engagement') {
    baseRate = 0.24;
  }

  // 2. Customer tier multiplier
  let tierMultiplier = 1.0;
  if (profile.tier === 'vip') {
    tierMultiplier = 1.32; // VIPs convert higher naturally
  } else if (profile.tier === 'premium') {
    tierMultiplier = 1.15;
  }

  // 3. Discount elasticity effect (diminishing returns curve)
  // 0% -> 1.0x
  // 3% -> 1.05x
  // 5% -> 1.10x
  // 10% -> 1.18x
  // 15% -> 1.22x
  const discountEffect = 1.0 + Math.min(discountPercent * 0.016, 0.24);

  // 4. Contact frequency fatigue penalty
  const fatiguePenalty = isSpammingContact || profile.recent_contacts_7d >= 3 ? 0.70 : 1.0;

  // 5. Amount elasticity: Orders > ₹1L without enterprise sales consultation have very low link conversion
  const amountLakhs = profile.amount_paise / 10000000;
  let amountPenalty = 1.0;
  if (amountLakhs >= 1.0) {
    amountPenalty = 0.05; // 5% conversion for unmanaged 6-figure corporate links
  } else if (amountLakhs > 0.25) {
    amountPenalty = 0.90;
  }

  const rawProb = baseRate * tierMultiplier * discountEffect * fatiguePenalty * amountPenalty;
  return Math.min(0.92, Math.max(0.02, Math.round(rawProb * 1000) / 1000));
}

export function simulateCustomerPaymentOutcome(
  profile: CustomerEvalProfile,
  strategyKey: string,
  conversionProb: number
): boolean {
  // Use deterministic seed: profile.id + strategyKey to ensure stable simulation
  const randomValue = seededRandom(`${profile.id}_${strategyKey}_pay_v1`);
  return randomValue <= conversionProb;
}
