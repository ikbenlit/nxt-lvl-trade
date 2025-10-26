import { eq, desc, and, sql } from 'drizzle-orm';
import { db } from '../client';
import {
  conversationThreads,
  conversationMessages,
  type ConversationThread,
  type NewConversationThread,
  type ConversationMessage,
  type NewConversationMessage,
} from '../schema';

/**
 * ConversationsRepository - Single source of truth for conversation data
 *
 * Manages conversation threads and messages for the chat interface.
 * Each thread contains multiple messages (user/assistant/system).
 */
export class ConversationsRepository {
  // ============================================
  // THREAD OPERATIONS
  // ============================================

  /**
   * Create a new conversation thread
   */
  async createThread(thread: NewConversationThread): Promise<ConversationThread> {
    try {
      const result = await db
        .insert(conversationThreads)
        .values(thread)
        .returning();

      if (!result[0]) {
        throw new Error('Failed to create conversation thread');
      }

      console.log(`✅ Conversation thread created: ID ${result[0].id}`);
      return result[0];
    } catch (error) {
      console.error('❌ Error creating thread:', error);
      throw error;
    }
  }

  /**
   * Get thread by ID
   */
  async getThreadById(id: number): Promise<ConversationThread | undefined> {
    try {
      const result = await db
        .select()
        .from(conversationThreads)
        .where(eq(conversationThreads.id, id))
        .limit(1);

      return result[0];
    } catch (error) {
      console.error(`❌ Error fetching thread ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all threads, optionally filtered by asset
   */
  async getAllThreads(filters?: {
    asset?: string;
    relatedTradeId?: number;
    limit?: number;
    offset?: number;
  }): Promise<ConversationThread[]> {
    try {
      let query = db.select().from(conversationThreads);

      // Apply filters
      if (filters?.asset) {
        query = query.where(eq(conversationThreads.asset, filters.asset)) as any;
      }

      if (filters?.relatedTradeId) {
        query = query.where(eq(conversationThreads.relatedTradeId, filters.relatedTradeId)) as any;
      }

      // Order by most recent
      query = query.orderBy(desc(conversationThreads.updatedAt)) as any;

      // Pagination
      if (filters?.limit) {
        query = query.limit(filters.limit) as any;
      }

      if (filters?.offset) {
        query = query.offset(filters.offset) as any;
      }

      return await query;
    } catch (error) {
      console.error('❌ Error fetching threads:', error);
      throw error;
    }
  }

  /**
   * Update thread
   */
  async updateThread(
    id: number,
    data: Partial<NewConversationThread>
  ): Promise<ConversationThread> {
    try {
      const updateData = {
        ...data,
        updatedAt: new Date(),
      };

      const result = await db
        .update(conversationThreads)
        .set(updateData)
        .where(eq(conversationThreads.id, id))
        .returning();

      if (!result[0]) {
        throw new Error(`Thread ${id} not found`);
      }

      console.log(`✅ Thread updated: ID ${id}`);
      return result[0];
    } catch (error) {
      console.error(`❌ Error updating thread ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete thread (cascades to messages)
   */
  async deleteThread(id: number): Promise<void> {
    try {
      const result = await db
        .delete(conversationThreads)
        .where(eq(conversationThreads.id, id))
        .returning();

      if (!result[0]) {
        throw new Error(`Thread ${id} not found`);
      }

      console.log(`🗑️  Thread deleted: ID ${id}`);
    } catch (error) {
      console.error(`❌ Error deleting thread ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get recent threads (last N threads)
   */
  async getRecentThreads(limit: number = 10): Promise<ConversationThread[]> {
    return this.getAllThreads({ limit });
  }

  // ============================================
  // MESSAGE OPERATIONS
  // ============================================

  /**
   * Add a message to a thread
   */
  async addMessage(message: NewConversationMessage): Promise<ConversationMessage> {
    try {
      // Insert message
      const result = await db
        .insert(conversationMessages)
        .values(message)
        .returning();

      if (!result[0]) {
        throw new Error('Failed to add message');
      }

      // Update thread's updatedAt timestamp
      await db
        .update(conversationThreads)
        .set({ updatedAt: new Date() })
        .where(eq(conversationThreads.id, message.threadId));

      console.log(`✅ Message added to thread ${message.threadId}`);
      return result[0];
    } catch (error) {
      console.error('❌ Error adding message:', error);
      throw error;
    }
  }

  /**
   * Get all messages for a thread
   */
  async getMessagesByThread(threadId: number): Promise<ConversationMessage[]> {
    try {
      const result = await db
        .select()
        .from(conversationMessages)
        .where(eq(conversationMessages.threadId, threadId))
        .orderBy(conversationMessages.timestamp); // Chronological order

      return result;
    } catch (error) {
      console.error(`❌ Error fetching messages for thread ${threadId}:`, error);
      throw error;
    }
  }

  /**
   * Get message by ID
   */
  async getMessageById(id: number): Promise<ConversationMessage | undefined> {
    try {
      const result = await db
        .select()
        .from(conversationMessages)
        .where(eq(conversationMessages.id, id))
        .limit(1);

      return result[0];
    } catch (error) {
      console.error(`❌ Error fetching message ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update a message
   */
  async updateMessage(
    id: number,
    data: Partial<NewConversationMessage>
  ): Promise<ConversationMessage> {
    try {
      const result = await db
        .update(conversationMessages)
        .set(data)
        .where(eq(conversationMessages.id, id))
        .returning();

      if (!result[0]) {
        throw new Error(`Message ${id} not found`);
      }

      console.log(`✅ Message updated: ID ${id}`);
      return result[0];
    } catch (error) {
      console.error(`❌ Error updating message ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(id: number): Promise<void> {
    try {
      const result = await db
        .delete(conversationMessages)
        .where(eq(conversationMessages.id, id))
        .returning();

      if (!result[0]) {
        throw new Error(`Message ${id} not found`);
      }

      console.log(`🗑️  Message deleted: ID ${id}`);
    } catch (error) {
      console.error(`❌ Error deleting message ${id}:`, error);
      throw error;
    }
  }

  // ============================================
  // COMBINED OPERATIONS
  // ============================================

  /**
   * Get thread with all its messages
   */
  async getThreadWithMessages(threadId: number): Promise<{
    thread: ConversationThread;
    messages: ConversationMessage[];
  } | null> {
    try {
      const thread = await this.getThreadById(threadId);
      if (!thread) {
        return null;
      }

      const messages = await this.getMessagesByThread(threadId);

      return {
        thread,
        messages,
      };
    } catch (error) {
      console.error(`❌ Error fetching thread with messages ${threadId}:`, error);
      throw error;
    }
  }

  /**
   * Create thread and add initial message in one transaction
   */
  async createThreadWithMessage(
    thread: NewConversationThread,
    message: Omit<NewConversationMessage, 'threadId'>
  ): Promise<{
    thread: ConversationThread;
    message: ConversationMessage;
  }> {
    try {
      // Create thread
      const newThread = await this.createThread(thread);

      // Add message
      const newMessage = await this.addMessage({
        ...message,
        threadId: newThread.id,
      });

      console.log(`✅ Thread ${newThread.id} created with initial message`);

      return {
        thread: newThread,
        message: newMessage,
      };
    } catch (error) {
      console.error('❌ Error creating thread with message:', error);
      throw error;
    }
  }

  // ============================================
  // ANALYTICS & UTILITIES
  // ============================================

  /**
   * Get total token usage across all conversations
   */
  async getTotalTokenUsage(filters?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    totalMessages: number;
    totalTokens: number;
    avgTokensPerMessage: number;
  }> {
    try {
      const result = await db
        .select({
          count: sql<number>`count(*)`,
          totalTokens: sql<number>`sum(${conversationMessages.tokensUsed})`,
        })
        .from(conversationMessages)
        .where(eq(conversationMessages.role, 'assistant')); // Only count Claude responses

      const totalMessages = Number(result[0]?.count || 0);
      const totalTokens = Number(result[0]?.totalTokens || 0);
      const avgTokensPerMessage = totalMessages > 0 ? totalTokens / totalMessages : 0;

      return {
        totalMessages,
        totalTokens,
        avgTokensPerMessage,
      };
    } catch (error) {
      console.error('❌ Error calculating token usage:', error);
      throw error;
    }
  }

  /**
   * Get most used Claude tools
   */
  async getMostUsedTools(): Promise<{
    toolName: string;
    count: number;
  }[]> {
    try {
      // Get all messages with tools
      const messages = await db
        .select()
        .from(conversationMessages)
        .where(eq(conversationMessages.role, 'assistant'));

      // Count tool usage
      const toolCounts = new Map<string, number>();

      for (const message of messages) {
        if (!message.toolsUsed) continue;

        for (const tool of message.toolsUsed) {
          const count = toolCounts.get(tool.name) || 0;
          toolCounts.set(tool.name, count + 1);
        }
      }

      // Convert to array and sort
      const results = Array.from(toolCounts.entries())
        .map(([toolName, count]) => ({ toolName, count }))
        .sort((a, b) => b.count - a.count);

      return results;
    } catch (error) {
      console.error('❌ Error calculating tool usage:', error);
      throw error;
    }
  }

  /**
   * Count threads by asset
   */
  async countThreadsByAsset(): Promise<{
    asset: string | null;
    count: number;
  }[]> {
    try {
      const result = await db
        .select({
          asset: conversationThreads.asset,
          count: sql<number>`count(*)`,
        })
        .from(conversationThreads)
        .groupBy(conversationThreads.asset);

      return result.map(r => ({
        asset: r.asset,
        count: Number(r.count),
      }));
    } catch (error) {
      console.error('❌ Error counting threads by asset:', error);
      throw error;
    }
  }

  /**
   * Get conversation stats (messages per thread, etc.)
   */
  async getConversationStats(): Promise<{
    totalThreads: number;
    totalMessages: number;
    avgMessagesPerThread: number;
  }> {
    try {
      const [threadsResult, messagesResult] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(conversationThreads),
        db.select({ count: sql<number>`count(*)` }).from(conversationMessages),
      ]);

      const totalThreads = Number(threadsResult[0]?.count || 0);
      const totalMessages = Number(messagesResult[0]?.count || 0);
      const avgMessagesPerThread = totalThreads > 0 ? totalMessages / totalThreads : 0;

      return {
        totalThreads,
        totalMessages,
        avgMessagesPerThread,
      };
    } catch (error) {
      console.error('❌ Error calculating conversation stats:', error);
      throw error;
    }
  }
}

/**
 * Singleton instance of ConversationsRepository
 */
export const conversationsRepository = new ConversationsRepository();
