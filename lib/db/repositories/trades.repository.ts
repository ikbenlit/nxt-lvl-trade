import { eq, and, desc, asc, sql, gte, lte, SQL } from 'drizzle-orm';
import { db } from '../client';
import { trades, type Trade, type NewTrade } from '../schema';

/**
 * TradesRepository - Single source of truth for trade data operations
 *
 * Implements CRUD operations and analytics for the trades table.
 * Used by API routes and services to interact with trade data.
 */
export class TradesRepository {
  // ============================================
  // CRUD OPERATIONS
  // ============================================

  /**
   * Create a new trade
   */
  async create(trade: NewTrade): Promise<Trade> {
    try {
      const result = await db
        .insert(trades)
        .values(trade)
        .returning();

      if (!result[0]) {
        throw new Error('Failed to create trade');
      }

      console.log(`✅ Trade created: ID ${result[0].id}`);
      return result[0];
    } catch (error) {
      console.error('❌ Error creating trade:', error);
      throw error;
    }
  }

  /**
   * Get trade by ID
   */
  async getById(id: number): Promise<Trade | undefined> {
    try {
      const result = await db
        .select()
        .from(trades)
        .where(eq(trades.id, id))
        .limit(1);

      return result[0];
    } catch (error) {
      console.error(`❌ Error fetching trade ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all trades with optional filters
   */
  async getAll(filters?: {
    asset?: 'SOL-PERP' | 'BTC-PERP';
    status?: 'open' | 'closed' | 'cancelled';
    minConfluence?: number;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
    orderBy?: 'entryTimestamp' | 'createdAt' | 'pnlPct';
    orderDirection?: 'asc' | 'desc';
  }): Promise<Trade[]> {
    try {
      let query = db.select().from(trades);

      // Build WHERE conditions
      const conditions: SQL[] = [];

      if (filters?.asset) {
        conditions.push(eq(trades.asset, filters.asset));
      }

      if (filters?.status) {
        conditions.push(eq(trades.status, filters.status));
      }

      if (filters?.minConfluence !== undefined) {
        conditions.push(gte(trades.confluenceScore, filters.minConfluence));
      }

      if (filters?.startDate) {
        conditions.push(gte(trades.entryTimestamp, filters.startDate));
      }

      if (filters?.endDate) {
        conditions.push(lte(trades.entryTimestamp, filters.endDate));
      }

      // Apply conditions
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      // Apply ordering
      const orderField = filters?.orderBy || 'entryTimestamp';
      const orderDir = filters?.orderDirection || 'desc';

      query = (orderDir === 'desc'
        ? query.orderBy(desc(trades[orderField]))
        : query.orderBy(asc(trades[orderField]))) as any;

      // Apply pagination
      if (filters?.limit) {
        query = query.limit(filters.limit) as any;
      }

      if (filters?.offset) {
        query = query.offset(filters.offset) as any;
      }

      const result = await query;
      return result;
    } catch (error) {
      console.error('❌ Error fetching trades:', error);
      throw error;
    }
  }

  /**
   * Update a trade by ID
   */
  async update(id: number, data: Partial<NewTrade>): Promise<Trade> {
    try {
      // Add updatedAt timestamp
      const updateData = {
        ...data,
        updatedAt: new Date(),
      };

      const result = await db
        .update(trades)
        .set(updateData)
        .where(eq(trades.id, id))
        .returning();

      if (!result[0]) {
        throw new Error(`Trade ${id} not found`);
      }

      console.log(`✅ Trade updated: ID ${id}`);
      return result[0];
    } catch (error) {
      console.error(`❌ Error updating trade ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a trade by ID
   */
  async delete(id: number): Promise<void> {
    try {
      const result = await db
        .delete(trades)
        .where(eq(trades.id, id))
        .returning();

      if (!result[0]) {
        throw new Error(`Trade ${id} not found`);
      }

      console.log(`🗑️  Trade deleted: ID ${id}`);
    } catch (error) {
      console.error(`❌ Error deleting trade ${id}:`, error);
      throw error;
    }
  }

  // ============================================
  // CONVENIENCE QUERIES
  // ============================================

  /**
   * Get all open trades
   */
  async getOpenTrades(asset?: 'SOL-PERP' | 'BTC-PERP'): Promise<Trade[]> {
    return this.getAll({ status: 'open', asset });
  }

  /**
   * Get all closed trades
   */
  async getClosedTrades(asset?: 'SOL-PERP' | 'BTC-PERP'): Promise<Trade[]> {
    return this.getAll({ status: 'closed', asset });
  }

  /**
   * Get trades by asset
   */
  async getByAsset(asset: 'SOL-PERP' | 'BTC-PERP'): Promise<Trade[]> {
    return this.getAll({ asset });
  }

  /**
   * Get recent trades (last N trades)
   */
  async getRecent(limit: number = 10): Promise<Trade[]> {
    return this.getAll({
      limit,
      orderBy: 'createdAt',
      orderDirection: 'desc'
    });
  }

  /**
   * Close a trade (set exit details and calculate metrics)
   */
  async closeTrade(
    id: number,
    exitPrice: number,
    exitReason: 'target_1' | 'target_2' | 'target_3' | 'stop' | 'manual' | 'liquidation'
  ): Promise<Trade> {
    try {
      const trade = await this.getById(id);
      if (!trade) {
        throw new Error(`Trade ${id} not found`);
      }

      const exitTimestamp = new Date();

      // Calculate P&L percentage
      const pnlPct = trade.direction === 'long'
        ? ((exitPrice - trade.entryPrice) / trade.entryPrice) * 100
        : ((trade.entryPrice - exitPrice) / trade.entryPrice) * 100;

      // Calculate P&L in USD (simplified - not accounting for fees)
      const pnlUsd = (pnlPct / 100) * (trade.entryPrice * trade.entrySize);

      // Calculate hold duration in hours
      const holdDurationHours =
        (exitTimestamp.getTime() - new Date(trade.entryTimestamp).getTime()) / (1000 * 60 * 60);

      // Calculate R-multiple (actual R:R achieved)
      const riskPerUnit = Math.abs(trade.entryPrice - trade.stopLoss);
      const gainPerUnit = Math.abs(exitPrice - trade.entryPrice);
      const rMultiple = trade.direction === 'long'
        ? (exitPrice >= trade.entryPrice ? gainPerUnit / riskPerUnit : -gainPerUnit / riskPerUnit)
        : (exitPrice <= trade.entryPrice ? gainPerUnit / riskPerUnit : -gainPerUnit / riskPerUnit);

      return await this.update(id, {
        exitPrice,
        exitTimestamp,
        exitReason,
        pnlPct,
        pnlUsd,
        holdDurationHours,
        rMultiple,
        status: 'closed',
      });
    } catch (error) {
      console.error(`❌ Error closing trade ${id}:`, error);
      throw error;
    }
  }

  /**
   * Count trades by status
   */
  async countByStatus(): Promise<{
    open: number;
    closed: number;
    cancelled: number;
  }> {
    try {
      const [openCount, closedCount, cancelledCount] = await Promise.all([
        db.select({ count: sql<number>`count(*)` })
          .from(trades)
          .where(eq(trades.status, 'open')),
        db.select({ count: sql<number>`count(*)` })
          .from(trades)
          .where(eq(trades.status, 'closed')),
        db.select({ count: sql<number>`count(*)` })
          .from(trades)
          .where(eq(trades.status, 'cancelled')),
      ]);

      return {
        open: Number(openCount[0]?.count || 0),
        closed: Number(closedCount[0]?.count || 0),
        cancelled: Number(cancelledCount[0]?.count || 0),
      };
    } catch (error) {
      console.error('❌ Error counting trades:', error);
      throw error;
    }
  }

  // ============================================
  // ANALYTICS METHODS
  // ============================================

  /**
   * Get overall trading statistics
   */
  async getStatistics(filters?: {
    asset?: 'SOL-PERP' | 'BTC-PERP';
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    avgPnlPct: number;
    avgPnlUsd: number;
    totalPnlUsd: number;
    avgRMultiple: number;
    avgHoldDurationHours: number;
    bestTrade: number;
    worstTrade: number;
    expectancy: number;
  }> {
    try {
      // Get closed trades only
      const closedTrades = await this.getAll({
        status: 'closed',
        asset: filters?.asset,
        startDate: filters?.startDate,
        endDate: filters?.endDate,
      });

      if (closedTrades.length === 0) {
        return {
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          winRate: 0,
          avgPnlPct: 0,
          avgPnlUsd: 0,
          totalPnlUsd: 0,
          avgRMultiple: 0,
          avgHoldDurationHours: 0,
          bestTrade: 0,
          worstTrade: 0,
          expectancy: 0,
        };
      }

      const totalTrades = closedTrades.length;
      const winningTrades = closedTrades.filter(t => (t.pnlPct || 0) > 0).length;
      const losingTrades = closedTrades.filter(t => (t.pnlPct || 0) < 0).length;
      const winRate = (winningTrades / totalTrades) * 100;

      const totalPnlUsd = closedTrades.reduce((sum, t) => sum + (t.pnlUsd || 0), 0);
      const avgPnlUsd = totalPnlUsd / totalTrades;

      const totalPnlPct = closedTrades.reduce((sum, t) => sum + (t.pnlPct || 0), 0);
      const avgPnlPct = totalPnlPct / totalTrades;

      const totalRMultiple = closedTrades.reduce((sum, t) => sum + (t.rMultiple || 0), 0);
      const avgRMultiple = totalRMultiple / totalTrades;

      const totalHoldDuration = closedTrades.reduce((sum, t) => sum + (t.holdDurationHours || 0), 0);
      const avgHoldDurationHours = totalHoldDuration / totalTrades;

      const pnls = closedTrades.map(t => t.pnlPct || 0);
      const bestTrade = Math.max(...pnls);
      const worstTrade = Math.min(...pnls);

      // Expectancy = (Win% × Avg Win) - (Loss% × Avg Loss)
      const wins = closedTrades.filter(t => (t.pnlPct || 0) > 0);
      const losses = closedTrades.filter(t => (t.pnlPct || 0) < 0);
      const avgWin = wins.length > 0
        ? wins.reduce((sum, t) => sum + (t.pnlPct || 0), 0) / wins.length
        : 0;
      const avgLoss = losses.length > 0
        ? Math.abs(losses.reduce((sum, t) => sum + (t.pnlPct || 0), 0) / losses.length)
        : 0;
      const expectancy = (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss;

      return {
        totalTrades,
        winningTrades,
        losingTrades,
        winRate,
        avgPnlPct,
        avgPnlUsd,
        totalPnlUsd,
        avgRMultiple,
        avgHoldDurationHours,
        bestTrade,
        worstTrade,
        expectancy,
      };
    } catch (error) {
      console.error('❌ Error calculating statistics:', error);
      throw error;
    }
  }

  /**
   * Get statistics by asset (SOL-PERP vs BTC-PERP comparison)
   */
  async getStatisticsByAsset(): Promise<{
    'SOL-PERP': Awaited<ReturnType<TradesRepository['getStatistics']>>;
    'BTC-PERP': Awaited<ReturnType<TradesRepository['getStatistics']>>;
  }> {
    const [solStats, btcStats] = await Promise.all([
      this.getStatistics({ asset: 'SOL-PERP' }),
      this.getStatistics({ asset: 'BTC-PERP' }),
    ]);

    return {
      'SOL-PERP': solStats,
      'BTC-PERP': btcStats,
    };
  }

  /**
   * Get confluence score effectiveness (win rate by confluence score)
   */
  async getConfluenceEffectiveness(): Promise<{
    score: number;
    count: number;
    winRate: number;
    avgRMultiple: number;
  }[]> {
    try {
      const closedTrades = await this.getAll({ status: 'closed' });

      // Group by confluence score
      const grouped = new Map<number, Trade[]>();

      for (const trade of closedTrades) {
        const score = trade.confluenceScore || 0;
        if (!grouped.has(score)) {
          grouped.set(score, []);
        }
        grouped.get(score)!.push(trade);
      }

      // Calculate stats for each score
      const results = Array.from(grouped.entries()).map(([score, trades]) => {
        const winningTrades = trades.filter(t => (t.pnlPct || 0) > 0).length;
        const winRate = (winningTrades / trades.length) * 100;
        const avgRMultiple = trades.reduce((sum, t) => sum + (t.rMultiple || 0), 0) / trades.length;

        return {
          score,
          count: trades.length,
          winRate,
          avgRMultiple,
        };
      });

      // Sort by score ascending
      return results.sort((a, b) => a.score - b.score);
    } catch (error) {
      console.error('❌ Error calculating confluence effectiveness:', error);
      throw error;
    }
  }

  /**
   * Get trades grouped by month (for equity curve visualization)
   */
  async getTradesByMonth(year?: number): Promise<{
    month: string;
    count: number;
    totalPnl: number;
    winRate: number;
  }[]> {
    try {
      const closedTrades = await this.getAll({ status: 'closed' });

      // Filter by year if provided
      const filteredTrades = year
        ? closedTrades.filter(t => new Date(t.entryTimestamp).getFullYear() === year)
        : closedTrades;

      // Group by month
      const grouped = new Map<string, Trade[]>();

      for (const trade of filteredTrades) {
        const date = new Date(trade.entryTimestamp);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!grouped.has(monthKey)) {
          grouped.set(monthKey, []);
        }
        grouped.get(monthKey)!.push(trade);
      }

      // Calculate stats for each month
      const results = Array.from(grouped.entries()).map(([month, trades]) => {
        const totalPnl = trades.reduce((sum, t) => sum + (t.pnlUsd || 0), 0);
        const winningTrades = trades.filter(t => (t.pnlPct || 0) > 0).length;
        const winRate = (winningTrades / trades.length) * 100;

        return {
          month,
          count: trades.length,
          totalPnl,
          winRate,
        };
      });

      // Sort by month
      return results.sort((a, b) => a.month.localeCompare(b.month));
    } catch (error) {
      console.error('❌ Error calculating trades by month:', error);
      throw error;
    }
  }

  /**
   * Get best and worst performing confluence factor combinations
   */
  async getConfluenceFactorPerformance(): Promise<{
    factors: string[];
    count: number;
    winRate: number;
    avgRMultiple: number;
  }[]> {
    try {
      const closedTrades = await this.getAll({ status: 'closed' });

      // Group by confluence factors
      const grouped = new Map<string, Trade[]>();

      for (const trade of closedTrades) {
        if (!trade.confluenceFactors) continue;

        const factors = Object.entries(trade.confluenceFactors)
          .filter(([_, value]) => value === true)
          .map(([key]) => key)
          .sort();

        const key = factors.join(',');

        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push(trade);
      }

      // Calculate stats for each combination
      const results = Array.from(grouped.entries())
        .map(([factorKey, trades]) => {
          const winningTrades = trades.filter(t => (t.pnlPct || 0) > 0).length;
          const winRate = (winningTrades / trades.length) * 100;
          const avgRMultiple = trades.reduce((sum, t) => sum + (t.rMultiple || 0), 0) / trades.length;

          return {
            factors: factorKey.split(',').filter(f => f.length > 0),
            count: trades.length,
            winRate,
            avgRMultiple,
          };
        })
        .filter(r => r.count >= 3) // Minimum 3 trades for statistical relevance
        .sort((a, b) => b.winRate - a.winRate); // Sort by win rate descending

      return results;
    } catch (error) {
      console.error('❌ Error calculating confluence factor performance:', error);
      throw error;
    }
  }
}

/**
 * Singleton instance of TradesRepository
 */
export const tradesRepository = new TradesRepository();
