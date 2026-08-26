import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: 'gemini-3.6-flash',
  },
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
  },
  execution: {
    maxLiveLinks: 10,
    defaultMode: (process.env.EXECUTION_MODE || 'simulated') as 'live' | 'simulated',
  },
  dbPath: path.join(process.cwd(), 'data', 'merchant.db'),
  auditPath: path.join(process.cwd(), 'data', 'audit.jsonl'),
};