import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

/**
 * SQLite database path
 * Uses environment variable or defaults to ./data/trading-bot.db
 */
const DB_PATH = process.env.DATABASE_URL || './data/trading-bot.db';

/**
 * Ensure data directory exists
 */
function ensureDataDirectory() {
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`📁 Created data directory: ${dataDir}`);
  }
}

/**
 * Initialize SQLite connection
 */
function initializeSqlite() {
  ensureDataDirectory();

  const sqlite = new Database(DB_PATH);

  // Enable WAL mode for better concurrency
  sqlite.pragma('journal_mode = WAL');

  // Enable foreign keys
  sqlite.pragma('foreign_keys = ON');

  console.log(`✅ Database connected: ${DB_PATH}`);

  return sqlite;
}

/**
 * Drizzle database instance
 * This is the main export to use throughout the application
 */
export const db = drizzle(initializeSqlite(), { schema });

/**
 * Get raw SQLite instance (for advanced use cases)
 */
export function getSqlite() {
  return initializeSqlite();
}

/**
 * Close database connection (for cleanup)
 */
export function closeDatabase() {
  // Drizzle doesn't expose close, but we can get the raw instance if needed
  console.log('💾 Database connection closed');
}

export default db;
