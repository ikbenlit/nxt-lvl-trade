/**
 * Database barrel export
 * Provides clean imports: import { db, trades, Trade } from '@/lib/db'
 */

// Database client
export { db, getSqlite, closeDatabase } from './client';

// Schema tables
export {
  trades,
  conversationThreads,
  conversationMessages,
  learnings,
  strategyVersions,
  userSettings,
  apiLogs,
} from './schema';

// Relations
export {
  tradesRelations,
  conversationThreadsRelations,
  conversationMessagesRelations,
} from './schema';

// TypeScript types
export type {
  Trade,
  NewTrade,
  ConversationThread,
  NewConversationThread,
  ConversationMessage,
  NewConversationMessage,
  Learning,
  NewLearning,
  StrategyVersion,
  NewStrategyVersion,
  UserSetting,
  NewUserSetting,
  ApiLog,
  NewApiLog,
} from './schema';

// Repositories
export {
  TradesRepository,
  tradesRepository,
  ConversationsRepository,
  conversationsRepository,
} from './repositories';
