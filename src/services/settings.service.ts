import { PrismaClient } from '@prisma/client';
import { SystemSettings } from '../shared/types';
import { DEFAULT_MERCHANT_POLICY, MerchantPolicy } from '../policy/config';

export class SettingsService {
  constructor(private prisma: PrismaClient) {}

  public async getSettings(): Promise<SystemSettings> {
    const rows = await this.prisma.systemSetting.findMany();
    const settingsMap: Record<string, any> = {};
    for (const r of rows) {
      try {
        settingsMap[r.key] = JSON.parse(r.value);
      } catch {
        settingsMap[r.key] = r.value;
      }
    }

    return {
      model: settingsMap.model || 'gemini-3.6-flash',
      autonomy_mode: settingsMap.autonomy_mode || 'autonomous',
      max_discount_percent: settingsMap.max_discount_percent ?? 15,
      max_expiry_hours: settingsMap.max_expiry_hours ?? 72,
      high_value_threshold_paise: settingsMap.high_value_threshold_paise ?? 2500000,
      max_automated_amount_paise: settingsMap.max_automated_amount_paise ?? 1000000,
      max_contacts_per_week: settingsMap.max_contacts_per_week ?? 3,
      min_confidence_score: settingsMap.min_confidence_score ?? 0.70,
    };
  }

  public async loadMerchantPolicy(): Promise<MerchantPolicy> {
    const settings = await this.getSettings();
    return {
      ...DEFAULT_MERCHANT_POLICY,
      maxDiscountPercent: settings.max_discount_percent,
      maxExpiryHours: settings.max_expiry_hours,
      humanEscalationThresholdPaise: settings.high_value_threshold_paise,
      maxAutomatedTransactionPaise: settings.max_automated_amount_paise ?? DEFAULT_MERCHANT_POLICY.maxAutomatedTransactionPaise,
      maxContactsPerCustomer7Days: settings.max_contacts_per_week ?? DEFAULT_MERCHANT_POLICY.maxContactsPerCustomer7Days,
      minConfidenceScore: settings.min_confidence_score ?? DEFAULT_MERCHANT_POLICY.minConfidenceScore,
    };
  }

  public async updateSettings(body: Partial<SystemSettings>): Promise<void> {
    const {
      model,
      autonomy_mode,
      max_discount_percent,
      max_expiry_hours,
      high_value_threshold_paise,
      max_automated_amount_paise,
      max_contacts_per_week,
      min_confidence_score,
    } = body;

    const upsertKey = async (key: string, val: any) => {
      const stringValue = JSON.stringify(val);
      await this.prisma.systemSetting.upsert({
        where: { key },
        create: { key, value: stringValue, updated_at: new Date() },
        update: { value: stringValue, updated_at: new Date() },
      });
    };

    if (model) await upsertKey('model', model);
    if (autonomy_mode) await upsertKey('autonomy_mode', autonomy_mode);
    if (max_discount_percent !== undefined) await upsertKey('max_discount_percent', max_discount_percent);
    if (max_expiry_hours !== undefined) await upsertKey('max_expiry_hours', max_expiry_hours);
    if (high_value_threshold_paise !== undefined) await upsertKey('high_value_threshold_paise', high_value_threshold_paise);
    if (max_automated_amount_paise !== undefined) await upsertKey('max_automated_amount_paise', max_automated_amount_paise);
    if (max_contacts_per_week !== undefined) await upsertKey('max_contacts_per_week', max_contacts_per_week);
    if (min_confidence_score !== undefined) await upsertKey('min_confidence_score', min_confidence_score);
  }
}
