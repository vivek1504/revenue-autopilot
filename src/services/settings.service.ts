import Database from 'better-sqlite3';
import { SystemSettings } from '../shared/types';

export class SettingsService {
  constructor(private db: Database.Database) {}

  public getSettings(): SystemSettings {
    const rows = this.db.prepare('SELECT key, value FROM system_settings').all() as any[];
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

  public updateSettings(body: Partial<SystemSettings>): void {
    const {
      model,
      autonomy_mode,
      max_discount_percent,
      max_expiry_hours,
      high_value_threshold_paise,
    } = body;

    const upsert = this.db.prepare(`
      INSERT INTO system_settings (key, value, updated_at) 
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);

    if (model) upsert.run('model', JSON.stringify(model));
    if (autonomy_mode) upsert.run('autonomy_mode', JSON.stringify(autonomy_mode));
    if (max_discount_percent !== undefined) upsert.run('max_discount_percent', JSON.stringify(max_discount_percent));
    if (max_expiry_hours !== undefined) upsert.run('max_expiry_hours', JSON.stringify(max_expiry_hours));
    if (high_value_threshold_paise !== undefined) upsert.run('high_value_threshold_paise', JSON.stringify(high_value_threshold_paise));
  }
}
