import { Router, Request, Response } from 'express';
import fs from 'fs';
import { getAuditRecords } from '../helpers/audit-reader';
import { verifyAuditIntegrity } from '../../audit/verifier';
import { config } from '../../shared/config';
import { AuditRecord } from '../../shared/types';

export function createAuditRouter(): Router {
  const router = Router();

  router.get('/log', (req: Request, res: Response) => {
    const records = getAuditRecords();
    res.json(records);
  });

  router.post('/verify', (req: Request, res: Response) => {
    try {
      const result = verifyAuditIntegrity(config.auditPath);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/tamper', (req: Request, res: Response): any => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: 'Audit tamper endpoint is disabled in production environments',
      });
    }

    const sequence = req.body.sequence || 1;

    if (!fs.existsSync(config.auditPath)) {
      return res.status(404).json({ error: 'Audit file not found' });
    }

    try {
      const lines = fs
        .readFileSync(config.auditPath, 'utf-8')
        .trim()
        .split('\n')
        .filter(Boolean);

      let tampered = false;
      const modifiedLines = lines.map((line) => {
        const record: AuditRecord = JSON.parse(line);
        if (record.sequence === sequence) {
          tampered = true;
          record.proposal.amount_paise += 1000000;
          record.proposal.reason += ' (TAMPERED VIA DEMO API)';
          return JSON.stringify(record);
        }
        return line;
      });

      if (!tampered) {
        return res
          .status(404)
          .json({ error: `Sequence ${sequence} not found` });
      }

      fs.writeFileSync(config.auditPath, modifiedLines.join('\n') + '\n');
      res.json({ status: 'tampered', sequence });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
