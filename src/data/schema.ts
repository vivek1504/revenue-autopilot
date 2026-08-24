import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { config } from '../shared/config';

export function initializeDatabase(customPath?: string): Database.Database {
  const dbPath = customPath || config.dbPath;
  const dir = path.dirname(dbPath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);
  
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    -- Customers
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      tier TEXT DEFAULT 'standard',
      lifetime_spend_paise INTEGER DEFAULT 0,
      total_orders INTEGER DEFAULT 0,
      first_purchase_date TEXT,
      last_purchase_date TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Products
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price_paise INTEGER NOT NULL,
      description TEXT
    );

    -- Orders
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL REFERENCES customers(id),
      status TEXT NOT NULL,
      total_paise INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      completed_at TEXT,
      failure_reason TEXT,
      items TEXT NOT NULL
    );

    -- Active/Abandoned Carts
    CREATE TABLE IF NOT EXISTS carts (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL REFERENCES customers(id),
      items TEXT NOT NULL,
      total_paise INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      last_activity TEXT NOT NULL,
      status TEXT DEFAULT 'active'
    );

    -- Recovery Offers
    CREATE TABLE IF NOT EXISTS recovery_offers (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL REFERENCES customers(id),
      action_type TEXT NOT NULL,
      amount_paise INTEGER NOT NULL,
      discount_percent REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      razorpay_payment_link_id TEXT,
      razorpay_order_id TEXT
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_carts_customer ON carts(customer_id);
    CREATE INDEX IF NOT EXISTS idx_carts_status ON carts(status);
    CREATE INDEX IF NOT EXISTS idx_recovery_customer ON recovery_offers(customer_id);
  `);

  return db;
}
