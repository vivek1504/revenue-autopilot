import { Router, Request, Response } from 'express';
import { db } from '../dependencies';
import { SettingsService } from '../../services/settings.service';

export function createSettingsRouter(): Router {
  const router = Router();
  const settingsService = new SettingsService(db);

  router.get('/', (req: Request, res: Response) => {
    try {
      const currentSettings = settingsService.getSettings();
      res.json(currentSettings);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/', (req: Request, res: Response) => {
    try {
      settingsService.updateSettings(req.body);
      res.json({ status: 'success', message: 'Settings saved successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
