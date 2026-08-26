import EventEmitter from 'events';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { RazorpayClient } from '../gateway/razorpay-client';
import { AuditLogger } from '../audit/logger';
import { config } from '../shared/config';

export const autopilotEmitter = new EventEmitter();

const pool = new pg.Pool({ connectionString: config.databaseUrl });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

export const rzpClient = new RazorpayClient(
  config.razorpay.keyId,
  config.razorpay.keySecret,
  config.razorpay.webhookSecret
);

export const auditLogger = new AuditLogger(config.auditPath);
