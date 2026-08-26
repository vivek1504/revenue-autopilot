import { Router, Request, Response } from 'express';
import { getAllCurrentActions } from '../helpers/audit-reader';
import { AnalyticsService } from '../../services/analytics.service';

export function createAnalyticsRouter(): Router {
  const router = Router();
  const analyticsService = new AnalyticsService();

  router.get('/timeseries', async (req: Request, res: Response) => {
    try {
      const items = await getAllCurrentActions();
      const timeseries = await analyticsService.getTimeseries(items);
      res.json(timeseries);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/cohorts', async (req: Request, res: Response) => {
    try {
      const items = await getAllCurrentActions();
      const cohorts = analyticsService.getCohorts(items);
      res.json(cohorts);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
