import { Router, Request, Response } from 'express';
import { db } from '../dependencies';
import { getAllCurrentActions } from '../helpers/audit-reader';
import { DashboardService } from '../../services/dashboard.service';

export function createDashboardRouter(): Router {
  const router = Router();
  const dashboardService = new DashboardService(db);

  router.get('/summary', (req: Request, res: Response) => {
    try {
      const items = getAllCurrentActions();
      const summary = dashboardService.getSummary(items);
      res.json(summary);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
