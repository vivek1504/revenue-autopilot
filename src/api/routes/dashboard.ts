import { Router, Request, Response } from 'express';
import { prisma } from '../dependencies';
import { getAllCurrentActions } from '../helpers/audit-reader';
import { DashboardService } from '../../services/dashboard.service';

export function createDashboardRouter(): Router {
  const router = Router();
  const dashboardService = new DashboardService(prisma);

  router.get('/summary', async (req: Request, res: Response) => {
    try {
      const items = await getAllCurrentActions();
      const summary = await dashboardService.getSummary(items);
      res.json(summary);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
