import { Router, Request, Response } from 'express';
import { prisma } from '../dependencies';
import { AnalyticsService } from '../../services/analytics.service';

export function createAnalyticsRouter(): Router {
  const router = Router();
  const analyticsService = new AnalyticsService(prisma);

  router.get('/timeseries', async (req: Request, res: Response) => {
    try {
      const timeseries = await analyticsService.getTimeseries();
      res.json(timeseries);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/cohorts', async (req: Request, res: Response) => {
    try {
      const cohorts = await analyticsService.getCohorts();
      res.json(cohorts);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
