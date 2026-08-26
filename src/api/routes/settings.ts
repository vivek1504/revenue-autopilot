import { Router, Request, Response } from 'express';
import { prisma } from '../dependencies';
import { SettingsService } from '../../services/settings.service';

export function createSettingsRouter(): Router {
  const router = Router();
  const settingsService = new SettingsService(prisma);

  router.get('/', async (req: Request, res: Response) => {
    try {
      const currentSettings = await settingsService.getSettings();
      res.json(currentSettings);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/', async (req: Request, res: Response) => {
    try {
      await settingsService.updateSettings(req.body);
      res.json({ status: 'success', message: 'Settings saved successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
