import { Router, Request, Response } from 'express';
import { getAllCurrentActions } from '../helpers/audit-reader';

export function createOpportunitiesRouter(): Router {
  const router = Router();

  router.get('/queue', (req: Request, res: Response) => {
    try {
      const items = getAllCurrentActions();
      res.json(items);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
