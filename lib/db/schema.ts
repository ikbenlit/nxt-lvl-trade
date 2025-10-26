import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// ============================================
// CORE TABLES
// ============================================

/**
 * Trades table - Central entity for all trade records
 */
export const trades = sqliteTable(
  'trades',
  {
    // Primary Key
    id: integer('id').primaryKey({ autoIncrement: true }),

    // Trade Identification
    asset: text('asset', { enum: ['SOL-PERP', 'BTC-PERP'] }).notNull(),
    direction: text('direction', { enum: ['long', 'short'] }).notNull(),

    // Entry Details
    entryPrice: real('entry_price').notNull(),
    entryTimestamp: integer('entry_timestamp', { mode: 'timestamp' }).notNull(),
    entrySize: real('entry_size').notNull(), // Position size in asset units (e.g., 250 SOL)
    leverage: real('leverage').notNull().default(1.0),

    // Exit Details (nullable until trade closes)
    exitPrice: real('exit_price'),
    exitTimestamp: integer('exit_timestamp', { mode: 'timestamp' }),
    exitReason: text('exit_reason', {
      enum: ['target_1', 'target_2', 'target_3', 'stop', 'manual', 'liquidation'],
    }),

    // Risk Management
    stopLoss: real('stop_loss').notNull(),
    target1: real('target_1'),
    target2: real('target_2'),
    target3: real('target_3'),

    // Performance Metrics
    pnlPct: real('pnl_pct'), // P&L as percentage
    pnlUsd: real('pnl_usd'), // P&L in USD
    holdDurationHours: real('hold_duration_hours'),
    rMultiple: real('r_multiple'), // Actual R:R achieved

    // Setup Context
    confluenceScore: integer('confluence_score'), // 0-6
    confluenceFactors: text('confluence_factors', { mode: 'json' }).$type<{
      rsi?: boolean;
      fvg?: boolean;
      oi_divergence?: boolean;
      orderblock?: boolean;
      liquidation_cluster?: boolean;
      funding_rate?: boolean;
    }>(),

    // User Input (CRITICAL for learning loop)
    userReasoning: text('user_reasoning'),
    emotionalNotes: text('emotional_notes'),

    // AI Context
    claudeSetupAnalysis: text('claude_setup_analysis'),
    claudeConfidence: text('claude_confidence', { enum: ['LOW', 'MEDIUM', 'HIGH'] }),
    claudeEvaluation: text('claude_evaluation'),
    evaluationTimestamp: integer('evaluation_timestamp', { mode: 'timestamp' }),

    // Market Context (snapshot at entry time)
    marketContext: text('market_context', { mode: 'json' }).$type<{
      btc_price?: number;
      spx_close?: number;
      sol_funding?: number;
      btc_funding?: number;
      sol_rsi_4h?: number;
      btc_rsi_4h?: number;
      [key: string]: any;
    }>(),

    // Status
    status: text('status', { enum: ['open', 'closed', 'cancelled'] })
      .notNull()
      .default('open'),

    // Timestamps
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    // Indexes for performance
    assetIdx: index('idx_trades_asset').on(table.asset),
    statusIdx: index('idx_trades_status').on(table.status),
    entryTimestampIdx: index('idx_trades_entry_timestamp').on(table.entryTimestamp),
    confluenceScoreIdx: index('idx_trades_confluence_score').on(table.confluenceScore),
    createdAtIdx: index('idx_trades_created_at').on(table.createdAt),
    assetStatusIdx: index('idx_trades_asset_status').on(table.asset, table.status),
  })
);

/**
 * Conversation threads - Chat session management
 */
export const conversationThreads = sqliteTable(
  'conversation_threads',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),

    // Metadata
    topic: text('topic'),
    asset: text('asset'), // Asset being discussed (optional)

    // Timestamps
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),

    // Optional: Link to trade if conversation led to trade
    relatedTradeId: integer('related_trade_id').references(() => trades.id, {
      onDelete: 'set null',
    }),
  },
  (table) => ({
    createdAtIdx: index('idx_threads_created').on(table.createdAt),
  })
);

/**
 * Individual messages within conversation threads
 */
export const conversationMessages = sqliteTable(
  'conversation_messages',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    threadId: integer('thread_id')
      .notNull()
      .references(() => conversationThreads.id, { onDelete: 'cascade' }),

    // Message Content
    role: text('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
    content: text('content').notNull(),

    // Metadata
    timestamp: integer('timestamp', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),

    // Claude-specific
    model: text('model'), // "claude-3-5-sonnet-20250219"
    tokensUsed: integer('tokens_used'), // For cost tracking
    toolsUsed: text('tools_used', { mode: 'json' }).$type<
      Array<{
        name: string;
        input: any;
        output: any;
      }>
    >(),

    // Context
    relatedTradeIds: text('related_trade_ids', { mode: 'json' }).$type<number[]>(),
  },
  (table) => ({
    threadIdx: index('idx_messages_thread').on(table.threadId),
    timestampIdx: index('idx_messages_timestamp').on(table.timestamp),
  })
);

/**
 * Learnings extracted by Claude from trade analysis
 */
export const learnings = sqliteTable(
  'learnings',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),

    // Learning Type
    insightType: text('insight_type', {
      enum: ['pattern', 'edge', 'weakness', 'rule', 'warning'],
    }).notNull(),

    // Content
    title: text('title').notNull(),
    description: text('description'),

    // Evidence
    supportingTradeIds: text('supporting_trade_ids', { mode: 'json' }).$type<number[]>(),
    sampleSize: integer('sample_size'),
    winRate: real('win_rate'), // 0.0-1.0
    avgRMultiple: real('avg_r_multiple'),

    // Metadata
    confidenceScore: real('confidence_score'), // 0.0-1.0
    status: text('status', { enum: ['active', 'disproven', 'archived'] }).default('active'),

    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    typeIdx: index('idx_learnings_type').on(table.insightType),
    statusIdx: index('idx_learnings_status').on(table.status),
  })
);

/**
 * Strategy versions (Phase 2+)
 */
export const strategyVersions = sqliteTable('strategy_versions', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  version: text('version').notNull().unique(),
  configYaml: text('config_yaml').notNull(),

  // Documentation
  changelog: text('changelog'),
  description: text('description'),

  // Performance tracking
  active: integer('active', { mode: 'boolean' }).notNull().default(false),

  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * User settings - Key-value store
 */
export const userSettings = sqliteTable('user_settings', {
  key: text('key').primaryKey(),
  value: text('value', { mode: 'json' }).notNull().$type<any>(),

  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * API call logs - Debugging and cost tracking
 */
export const apiLogs = sqliteTable(
  'api_logs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),

    service: text('service').notNull(), // 'claude', 'drift', 'coinglass'
    endpoint: text('endpoint').notNull(),

    // Request
    requestParams: text('request_params', { mode: 'json' }).$type<any>(),

    // Response
    statusCode: integer('status_code'),
    responseTimeMs: integer('response_time_ms'),
    errorMessage: text('error_message'),

    // Cost tracking (for Claude)
    tokensInput: integer('tokens_input'),
    tokensOutput: integer('tokens_output'),
    costUsd: real('cost_usd'),

    timestamp: integer('timestamp', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    timestampIdx: index('idx_api_logs_timestamp').on(table.timestamp),
    serviceTimestampIdx: index('idx_api_logs_service').on(table.service, table.timestamp),
  })
);

// ============================================
// RELATIONS
// ============================================

export const tradesRelations = relations(trades, ({ many, one }) => ({
  conversations: many(conversationThreads),
}));

export const conversationThreadsRelations = relations(conversationThreads, ({ many, one }) => ({
  messages: many(conversationMessages),
  relatedTrade: one(trades, {
    fields: [conversationThreads.relatedTradeId],
    references: [trades.id],
  }),
}));

export const conversationMessagesRelations = relations(conversationMessages, ({ one }) => ({
  thread: one(conversationThreads, {
    fields: [conversationMessages.threadId],
    references: [conversationThreads.id],
  }),
}));

// ============================================
// TYPESCRIPT TYPES
// ============================================

export type Trade = typeof trades.$inferSelect;
export type NewTrade = typeof trades.$inferInsert;

export type ConversationThread = typeof conversationThreads.$inferSelect;
export type NewConversationThread = typeof conversationThreads.$inferInsert;

export type ConversationMessage = typeof conversationMessages.$inferSelect;
export type NewConversationMessage = typeof conversationMessages.$inferInsert;

export type Learning = typeof learnings.$inferSelect;
export type NewLearning = typeof learnings.$inferInsert;

export type StrategyVersion = typeof strategyVersions.$inferSelect;
export type NewStrategyVersion = typeof strategyVersions.$inferInsert;

export type UserSetting = typeof userSettings.$inferSelect;
export type NewUserSetting = typeof userSettings.$inferInsert;

export type ApiLog = typeof apiLogs.$inferSelect;
export type NewApiLog = typeof apiLogs.$inferInsert;
