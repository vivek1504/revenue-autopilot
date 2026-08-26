import { AuditRecord } from '../shared/types';

export class ExportService {
  public generateCsv(records: AuditRecord[]): string {
    const headers = ['Sequence', 'Timestamp', 'Customer ID', 'Opportunity Type', 'Action', 'Amount (Paise)', 'Discount %', 'Verdict', 'Reason'];
    const csvRows = [headers.join(',')];

    for (const rec of records) {
      csvRows.push([
        rec.sequence,
        `"${rec.timestamp}"`,
        rec.proposal.customer_id,
        rec.proposal.opportunity_type,
        rec.proposal.action,
        rec.proposal.amount_paise,
        rec.proposal.discount_percent,
        rec.policy_result.verdict,
        `"${rec.proposal.reason.replace(/"/g, '""')}"`,
      ].join(','));
    }

    return csvRows.join('\n');
  }
}
