/**
 * Database migration script
 * Creates all tables if they don't exist
 * Run with: node --loader ts-node/esm lib/db/migrate.ts
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_URL || './data/trading-bot.db';

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`📁 Created data directory: ${dataDir}`);
}

console.log(`🗄️  Connecting to database: ${DB_PATH}`);
const db = new Database(DB_PATH);

// Enable WAL mode and foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('⚙️  Running migrations...\n');

// Migration 1: Core tables
const migration1 = `
-- Trades table
CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset TEXT NOT NULL CHECK(asset IN ('SOL-PERP', 'BTC-PERP')),
    direction TEXT NOT NULL CHECK(direction IN ('long', 'short')),
    entry_price REAL NOT NULL CHECK(entry_price > 0),
    entry_timestamp INTEGER NOT NULL,
    entry_size REAL NOT NULL,
    leverage REAL NOT NULL DEFAULT 1.0,
    exit_price REAL,
    exit_timestamp INTEGER,
    exit_reason TEXT CHECK(exit_reason IN ('target_1', 'target_2', 'target_3', 'stop', 'manual', 'liquidation')),
    stop_loss REAL NOT NULL CHECK(stop_loss > 0),
    target_1 REAL,
    target_2 REAL,
    target_3 REAL,
    pnl_pct REAL,
    pnl_usd REAL,
    hold_duration_hours REAL,
    r_multiple REAL,
    confluence_score INTEGER CHECK(confluence_score >= 0 AND confluence_score <= 6),
    confluence_factors TEXT,
    user_reasoning TEXT,
    emotional_notes TEXT,
    claude_setup_analysis TEXT,
    claude_confidence TEXT CHECK(claude_confidence IN ('LOW', 'MEDIUM', 'HIGH')),
    claude_evaluation TEXT,
    evaluation_timestamp INTEGER,
    market_context TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'closed', 'cancelled')),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Conversation threads
CREATE TABLE IF NOT EXISTS conversation_threads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic TEXT,
    asset TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    related_trade_id INTEGER,
    FOREIGN KEY (related_trade_id) REFERENCES trades(id) ON DELETE SET NULL
);

-- Conversation messages
CREATE TABLE IF NOT EXISTS conversation_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id INTEGER NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    timestamp INTEGER NOT NULL DEFAULT (unixepoch()),
    model TEXT,
    tokens_used INTEGER,
    tools_used TEXT,
    related_trade_ids TEXT,
    FOREIGN KEY (thread_id) REFERENCES conversation_threads(id) ON DELETE CASCADE
);

-- Learnings
CREATE TABLE IF NOT EXISTS learnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    insight_type TEXT NOT NULL CHECK(insight_type IN ('pattern', 'edge', 'weakness', 'rule', 'warning')),
    title TEXT NOT NULL,
    description TEXT,
    supporting_trade_ids TEXT,
    sample_size INTEGER,
    win_rate REAL,
    avg_r_multiple REAL,
    confidence_score REAL,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'disproven', 'archived')),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Strategy versions
CREATE TABLE IF NOT EXISTS strategy_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version TEXT UNIQUE NOT NULL,
    config_yaml TEXT NOT NULL,
    changelog TEXT,
    description TEXT,
    active INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- User settings
CREATE TABLE IF NOT EXISTS user_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- API logs
CREATE TABLE IF NOT EXISTS api_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    request_params TEXT,
    status_code INTEGER,
    response_time_ms INTEGER,
    error_message TEXT,
    tokens_input INTEGER,
    tokens_output INTEGER,
    cost_usd REAL,
    timestamp INTEGER NOT NULL DEFAULT (unixepoch())
);
`;

try {
  db.exec(migration1);
  console.log('✅ Core tables created');
} catch (error) {
  console.error('❌ Error creating tables:', error);
  process.exit(1);
}

// Migration 2: Indexes
const migration2 = `
CREATE INDEX IF NOT EXISTS idx_trades_asset ON trades(asset);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_entry_timestamp ON trades(entry_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_trades_confluence_score ON trades(confluence_score);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_asset_status ON trades(asset, status);

CREATE INDEX IF NOT EXISTS idx_messages_thread ON conversation_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON conversation_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_threads_created ON conversation_threads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_learnings_type ON learnings(insight_type);
CREATE INDEX IF NOT EXISTS idx_learnings_status ON learnings(status);

CREATE INDEX IF NOT EXISTS idx_api_logs_timestamp ON api_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_service ON api_logs(service, timestamp DESC);
`;

try {
  db.exec(migration2);
  console.log('✅ Indexes created');
} catch (error) {
  console.error('❌ Error creating indexes:', error);
}

// Migration 3: Triggers
const migration3 = `
DROP TRIGGER IF EXISTS update_trades_timestamp;
CREATE TRIGGER update_trades_timestamp
AFTER UPDATE ON trades
BEGIN
    UPDATE trades SET updated_at = unixepoch() WHERE id = NEW.id;
END;

DROP TRIGGER IF EXISTS update_threads_timestamp;
CREATE TRIGGER update_threads_timestamp
AFTER UPDATE ON conversation_threads
BEGIN
    UPDATE conversation_threads SET updated_at = unixepoch() WHERE id = NEW.id;
END;

DROP TRIGGER IF EXISTS update_learnings_timestamp;
CREATE TRIGGER update_learnings_timestamp
AFTER UPDATE ON learnings
BEGIN
    UPDATE learnings SET updated_at = unixepoch() WHERE id = NEW.id;
END;

DROP TRIGGER IF EXISTS update_settings_timestamp;
CREATE TRIGGER update_settings_timestamp
AFTER UPDATE ON user_settings
BEGIN
    UPDATE user_settings SET updated_at = unixepoch() WHERE key = NEW.key;
END;
`;

try {
  db.exec(migration3);
  console.log('✅ Triggers created');
} catch (error) {
  console.error('❌ Error creating triggers:', error);
}

console.log('\n🎉 Database migration completed successfully!');
console.log(`📊 Database location: ${DB_PATH}\n`);

// Show table count
const tables = db
  .prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
  )
  .all();
console.log(`📋 Tables created: ${tables.length}`);
tables.forEach((table: any) => {
  console.log(`   - ${table.name}`);
});

db.close();
