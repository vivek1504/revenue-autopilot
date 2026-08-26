import { PrismaClient } from '@prisma/client';
import { SystemSettings } from '../shared/types';

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
      high_value_threshold_paise: settingsMap.high_value_threshold_paise ?? 5000000,
    };
  }

  public async updateSettings(body: Partial<SystemSettings>): Promise<void> {
    const {
      model,
      autonomy_mode,
      max_discount_percent,
      max_expiry_hours,
      high_value_threshold_paise,
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
  }
}
