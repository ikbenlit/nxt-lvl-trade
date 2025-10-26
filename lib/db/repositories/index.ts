/**
 * Repository Pattern - Barrel Export
 *
 * Single source of truth for all database operations.
 * Import repositories from here throughout the application.
 *
 * @example
 * import { tradesRepository, conversationsRepository } from '@/lib/db/repositories';
 */

export { TradesRepository, tradesRepository } from './trades.repository';
export { ConversationsRepository, conversationsRepository } from './conversations.repository';
