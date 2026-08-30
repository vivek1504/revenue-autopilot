import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { runBenchmarkEvaluation } from '../../../evaluation/runner';

export function createEvaluateRouter(): Router {
  const router = Router();
  const reportPath = path.join(__dirname, '../../../data/evaluation-report.json');

  router.get('/report', async (_req: Request, res: Response) => {
    try {
      if (fs.existsSync(reportPath)) {
        const raw = fs.readFileSync(reportPath, 'utf-8');
        return res.json(JSON.parse(raw));
      }
      // If not yet generated, run live
      const freshReport = runBenchmarkEvaluation();
      return res.json(freshReport);
    } catch (err: any) {
      console.error('[Evaluate API] Error retrieving benchmark report:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  router.post('/run', async (_req: Request, res: Response) => {
    try {
      console.log('[Evaluate API] Re-running 3-tier benchmark evaluation...');
      const freshReport = runBenchmarkEvaluation();
      return res.json(freshReport);
    } catch (err: any) {
      console.error('[Evaluate API] Error running benchmark evaluation:', err);
      return res.status(500).json({ error: err.message });
    }
  });

  return router;
}
