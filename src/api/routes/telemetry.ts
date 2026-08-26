import { Router, Request, Response } from 'express';
import { getAllCurrentActions, getAuditRecords } from '../helpers/audit-reader';
import { TelemetryService } from '../../services/telemetry.service';

export function createTelemetryRouter(): Router {
  const router = Router();
  const telemetryService = new TelemetryService();

  router.get('/benchmarks', (req: Request, res: Response) => {
    try {
      const items = getAllCurrentActions();
      const auditRecords = getAuditRecords();
      const benchmarks = telemetryService.getBenchmarks(items, auditRecords);
      res.json(benchmarks);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
