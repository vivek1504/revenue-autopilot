import { Router, Request, Response } from 'express';
import { getAuditRecords } from '../helpers/audit-reader';
import { ExportService } from '../../services/export.service';

export function createExportRouter(): Router {
  const router = Router();
  const exportService = new ExportService();

  router.get('/', (req: Request, res: Response) => {
    try {
      const auditRecords = getAuditRecords();
      const format = req.query.format || 'json';

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="revenue_guard_report.csv"');
        const csvContent = exportService.generateCsv(auditRecords);
        return res.send(csvContent);
      }

      res.json(auditRecords);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
