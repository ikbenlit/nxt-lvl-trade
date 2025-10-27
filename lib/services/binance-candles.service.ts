/**
 * Binance Candles Service
 *
 * Fetches historical OHLCV candle data from Binance Futures API.
 * Used as price data source for technical analysis (RSI, S/R, FVG, Order Blocks).
 *
 * WHY BINANCE:
 * - Drift Protocol has no native OHLCV API
 * - Binance SOLUSDT/BTCUSDT perpetuals have ~95% price correlation with Drift
 * - Free, public API with high rate limits (2400 req/min)
 * - Good enough accuracy for technical analysis patterns
 *
 * TRADE-OFF:
 * - Binance funding rates ≠ Drift funding rates (use DriftService for funding/OI)
 * - Price may differ by 1-2% (acceptable for technical patterns)
 *
 * API DOCS: https://binance-docs.github.io/apidocs/futures/en/#kline-candlestick-data
 */

import type { DriftCandle } from './strategy-engine.service';

// ============================================
// TYPES
// ============================================

export type BinanceSymbol = 'SOLUSDT' | 'BTCUSDT';
export type BinanceInterval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

/**
 * Binance API response format for klines
 * Array of [timestamp, open, high, low, close, volume, ...]
 */
type BinanceKline = [
  number, // 0: Open time (timestamp ms)
  string, // 1: Open price
  string, // 2: High price
  string, // 3: Low price
  string, // 4: Close price
  string, // 5: Volume
  number, // 6: Close time
  string, // 7: Quote asset volume
  number, // 8: Number of trades
  string, // 9: Taker buy base asset volume
  string, // 10: Taker buy quote asset volume
  string  // 11: Ignore
];

// ============================================
// CONSTANTS
// ============================================

const BINANCE_FUTURES_BASE_URL = 'https://fapi.binance.com/fapi/v1';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes (candles don't change often)
const REQUEST_TIMEOUT_MS = 10_000; // 10 seconds

// ============================================
// BINANCE CANDLES SERVICE
// ============================================

export class BinanceCandlesService {
  private cache = new Map<string, { data: DriftCandle[]; expiry: number }>();

  /**
   * Get historical candles from Binance Futures API
   *
   * @param symbol - Binance perpetual symbol (SOLUSDT, BTCUSDT)
   * @param interval - Candle timeframe (1m, 5m, 15m, 1h, 4h, 1d)
   * @param limit - Number of candles to fetch (1-1500, default 100)
   * @returns Array of DriftCandle objects (ascending timestamp order)
   */
  async getCandles(
    symbol: BinanceSymbol,
    interval: BinanceInterval = '1h',
    limit: number = 100
  ): Promise<DriftCandle[]> {
    // Validate inputs
    this.validateInputs(symbol, interval, limit);

    // Check cache first
    const cacheKey = `${symbol}_${interval}_${limit}`;
    const cached = this.getCached(cacheKey);
    if (cached) {
      console.log(`📦 Cache hit: ${symbol} ${interval} candles (${limit})`);
      return cached;
    }

    try {
      console.log(`🔍 Fetching ${symbol} ${interval} candles from Binance (limit: ${limit})...`);

      // Build API URL
      const url = `${BINANCE_FUTURES_BASE_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

      // Fetch data with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
      }

      // Parse response
      const data: BinanceKline[] = await response.json();

      // Transform to DriftCandle format
      const candles = this.transformToDriftCandles(data);

      // Validate candle data
      this.validateCandles(candles);

      // Cache result
      this.setCache(cacheKey, candles);

      console.log(
        `✅ ${symbol}: ${candles.length} candles fetched (${new Date(candles[0].timestamp).toISOString()} → ${new Date(candles[candles.length - 1].timestamp).toISOString()})`
      );

      return candles;
    } catch (error) {
      console.error(`❌ Failed to fetch ${symbol} candles:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️  Binance candles cache cleared');
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  /**
   * Validate input parameters
   */
  private validateInputs(symbol: BinanceSymbol, interval: BinanceInterval, limit: number): void {
    // Validate symbol
    const validSymbols: BinanceSymbol[] = ['SOLUSDT', 'BTCUSDT'];
    if (!validSymbols.includes(symbol)) {
      throw new Error(
        `Invalid symbol: ${symbol}. Must be one of: ${validSymbols.join(', ')}`
      );
    }

    // Validate interval
    const validIntervals: BinanceInterval[] = ['1m', '5m', '15m', '1h', '4h', '1d'];
    if (!validIntervals.includes(interval)) {
      throw new Error(
        `Invalid interval: ${interval}. Must be one of: ${validIntervals.join(', ')}`
      );
    }

    // Validate limit
    if (limit < 1 || limit > 1500) {
      throw new Error(`Invalid limit: ${limit}. Must be between 1 and 1500`);
    }
  }

  /**
   * Transform Binance kline data to DriftCandle format
   */
  private transformToDriftCandles(klines: BinanceKline[]): DriftCandle[] {
    return klines.map((kline) => ({
      timestamp: kline[0], // Open time in ms
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5]),
    }));
  }

  /**
   * Validate candle data structure
   */
  private validateCandles(candles: DriftCandle[]): void {
    if (candles.length === 0) {
      throw new Error('No candles returned from Binance API');
    }

    // Check timestamps are ascending
    for (let i = 1; i < candles.length; i++) {
      if (candles[i].timestamp <= candles[i - 1].timestamp) {
        throw new Error('Candles are not in ascending timestamp order');
      }
    }

    // Check OHLC consistency (H >= O,C and L <= O,C)
    for (const candle of candles) {
      if (candle.high < candle.open || candle.high < candle.close) {
        throw new Error(
          `Invalid candle: high (${candle.high}) < open/close at ${new Date(candle.timestamp).toISOString()}`
        );
      }
      if (candle.low > candle.open || candle.low > candle.close) {
        throw new Error(
          `Invalid candle: low (${candle.low}) > open/close at ${new Date(candle.timestamp).toISOString()}`
        );
      }
    }
  }

  /**
   * Get cached candles if not expired
   */
  private getCached(key: string): DriftCandle[] | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set cache with TTL
   */
  private setCache(key: string, data: DriftCandle[]): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + CACHE_TTL_MS,
    });
  }

  /**
   * Handle errors with user-friendly messages
   */
  private handleError(error: unknown): Error {
    if (error instanceof Error) {
      // Abort/timeout error
      if (error.name === 'AbortError' || error.message.includes('AbortError') || error.message.includes('timeout')) {
        return new Error(
          `Binance API timeout: Request took longer than ${REQUEST_TIMEOUT_MS / 1000}s. Check network connection.`
        );
      }

      // Rate limit error (429)
      if (error.message.includes('429')) {
        return new Error(
          'Binance API rate limit exceeded. Wait a moment and try again. (Limit: 2400 req/min)'
        );
      }

      // Network error
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return new Error('Network error: Unable to reach Binance API. Check internet connection.');
      }

      // Generic API error
      return new Error(`Binance API error: ${error.message}`);
    }

    return new Error('Unknown error while fetching Binance candles');
  }
}

/**
 * Singleton instance of BinanceCandlesService
 */
export const binanceCandlesService = new BinanceCandlesService();
