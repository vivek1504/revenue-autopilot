import EventEmitter from 'events';
import Database from 'better-sqlite3';
import { initializeDatabase } from '../data/schema';
import { RazorpayClient } from '../gateway/razorpay-client';
import { AuditLogger } from '../audit/logger';
import { config } from '../shared/config';

export const autopilotEmitter = new EventEmitter();

export const db: Database.Database = initializeDatabase(config.dbPath);

export const rzpClient = new RazorpayClient(
  config.razorpay.keyId,
  config.razorpay.keySecret,
  config.razorpay.webhookSecret
);

export const auditLogger = new AuditLogger(config.auditPath);
