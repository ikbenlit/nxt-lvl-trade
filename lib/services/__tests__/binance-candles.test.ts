/**
 * Unit Tests for BinanceCandlesService
 *
 * Tests:
 * - Input validation (symbol, interval, limit)
 * - Data transformation (Binance kline → DriftCandle)
 * - Cache behavior (TTL, hits, misses)
 * - Error handling (timeout, rate limit, network errors)
 * - Data validation (timestamps, OHLC consistency)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BinanceCandlesService } from '../binance-candles.service';
import type { DriftCandle } from '../strategy-engine.service';

describe('BinanceCandlesService', () => {
  let service: BinanceCandlesService;

  beforeEach(() => {
    service = new BinanceCandlesService();
    service.clearCache();
    vi.clearAllMocks();
  });

  // ============================================
  // INPUT VALIDATION TESTS
  // ============================================

  describe('Input Validation', () => {
    it('should accept valid symbols (SOLUSDT, BTCUSDT)', async () => {
      // Mock fetch to avoid real API calls
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockBinanceKlines(10),
      });

      await expect(service.getCandles('SOLUSDT', '1h', 10)).resolves.toBeDefined();
      await expect(service.getCandles('BTCUSDT', '1h', 10)).resolves.toBeDefined();
    });

    it('should reject invalid symbols', async () => {
      await expect(
        // @ts-expect-error Testing invalid input
        service.getCandles('ETHUSDT', '1h', 10)
      ).rejects.toThrow('Invalid symbol');
    });

    it('should accept all valid intervals', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockBinanceKlines(10),
      });

      const validIntervals = ['1m', '5m', '15m', '1h', '4h', '1d'] as const;
      for (const interval of validIntervals) {
        await expect(service.getCandles('SOLUSDT', interval, 10)).resolves.toBeDefined();
      }
    });

    it('should reject invalid intervals', async () => {
      await expect(
        // @ts-expect-error Testing invalid input
        service.getCandles('SOLUSDT', '2h', 10)
      ).rejects.toThrow('Invalid interval');
    });

    it('should accept limit range 1-1500', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockBinanceKlines(10),
      });

      await expect(service.getCandles('SOLUSDT', '1h', 1)).resolves.toBeDefined();
      await expect(service.getCandles('SOLUSDT', '1h', 1500)).resolves.toBeDefined();
    });

    it('should reject limit < 1', async () => {
      await expect(service.getCandles('SOLUSDT', '1h', 0)).rejects.toThrow('Invalid limit');
    });

    it('should reject limit > 1500', async () => {
      await expect(service.getCandles('SOLUSDT', '1h', 1501)).rejects.toThrow('Invalid limit');
    });
  });

  // ============================================
  // DATA TRANSFORMATION TESTS
  // ============================================

  describe('Data Transformation', () => {
    it('should transform Binance klines to DriftCandle format', async () => {
      const mockKlines = mockBinanceKlines(3);
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockKlines,
      });

      const candles = await service.getCandles('SOLUSDT', '1h', 3);

      expect(candles).toHaveLength(3);
      expect(candles[0]).toMatchObject({
        timestamp: mockKlines[0][0],
        open: parseFloat(mockKlines[0][1]),
        high: parseFloat(mockKlines[0][2]),
        low: parseFloat(mockKlines[0][3]),
        close: parseFloat(mockKlines[0][4]),
        volume: parseFloat(mockKlines[0][5]),
      });
    });

    it('should parse string prices to numbers', async () => {
      const mockKlines = [
        [1640000000000, '100.5', '102.3', '99.8', '101.2', '1000000', 1640003599999, '0', 0, '0', '0', '0'],
      ];
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockKlines,
      });

      const candles = await service.getCandles('SOLUSDT', '1h', 1);

      expect(typeof candles[0].open).toBe('number');
      expect(candles[0].open).toBe(100.5);
      expect(candles[0].close).toBe(101.2);
    });

    it('should return correct number of candles', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockBinanceKlines(50),
      });

      const candles = await service.getCandles('SOLUSDT', '1h', 50);
      expect(candles).toHaveLength(50);
    });
  });

  // ============================================
  // CACHE BEHAVIOR TESTS
  // ============================================

  describe('Cache Behavior', () => {
    it('should cache results for 5 minutes', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockBinanceKlines(10),
      });
      global.fetch = mockFetch;

      // First call - should hit API
      await service.getCandles('SOLUSDT', '1h', 10);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await service.getCandles('SOLUSDT', '1h', 10);
      expect(mockFetch).toHaveBeenCalledTimes(1); // No additional call
    });

    it('should use different cache keys for different parameters', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockBinanceKlines(10),
      });
      global.fetch = mockFetch;

      await service.getCandles('SOLUSDT', '1h', 10);
      await service.getCandles('SOLUSDT', '4h', 10); // Different interval
      await service.getCandles('BTCUSDT', '1h', 10); // Different symbol

      expect(mockFetch).toHaveBeenCalledTimes(3); // 3 different cache keys
    });

    it('should clear cache when clearCache() is called', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockBinanceKlines(10),
      });
      global.fetch = mockFetch;

      await service.getCandles('SOLUSDT', '1h', 10);
      service.clearCache();
      await service.getCandles('SOLUSDT', '1h', 10);

      expect(mockFetch).toHaveBeenCalledTimes(2); // Cache was cleared
    });
  });

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================

  describe('Error Handling', () => {
    it('should handle HTTP 429 rate limit error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      await expect(service.getCandles('SOLUSDT', '1h', 10)).rejects.toThrow('rate limit');
    });

    it('should handle HTTP 500 server error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(service.getCandles('SOLUSDT', '1h', 10)).rejects.toThrow('Binance API error: 500');
    });

    it('should handle network timeout', async () => {
      global.fetch = vi.fn().mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('AbortError')), 100))
      );

      await expect(service.getCandles('SOLUSDT', '1h', 10)).rejects.toThrow('timeout');
    });

    it('should handle network error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('fetch failed'));

      await expect(service.getCandles('SOLUSDT', '1h', 10)).rejects.toThrow('Network error');
    });

    it('should throw error if no candles returned', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      await expect(service.getCandles('SOLUSDT', '1h', 10)).rejects.toThrow('No candles returned');
    });
  });

  // ============================================
  // DATA VALIDATION TESTS
  // ============================================

  describe('Data Validation', () => {
    it('should validate timestamps are ascending', async () => {
      const invalidKlines = [
        [1640003600000, '100', '102', '99', '101', '1000', 1640007199999, '0', 0, '0', '0', '0'],
        [1640000000000, '101', '103', '100', '102', '1100', 1640003599999, '0', 0, '0', '0', '0'], // Wrong order
      ];
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => invalidKlines,
      });

      await expect(service.getCandles('SOLUSDT', '1h', 2)).rejects.toThrow('ascending timestamp order');
    });

    it('should validate OHLC consistency (H >= O,C)', async () => {
      const invalidKlines = [
        [1640000000000, '100', '98', '99', '101', '1000', 1640003599999, '0', 0, '0', '0', '0'], // High < Open
      ];
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => invalidKlines,
      });

      await expect(service.getCandles('SOLUSDT', '1h', 1)).rejects.toThrow('Invalid candle');
    });

    it('should validate OHLC consistency (L <= O,C)', async () => {
      const invalidKlines = [
        [1640000000000, '100', '102', '103', '101', '1000', 1640003599999, '0', 0, '0', '0', '0'], // Low > Open
      ];
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => invalidKlines,
      });

      await expect(service.getCandles('SOLUSDT', '1h', 1)).rejects.toThrow('Invalid candle');
    });

    it('should accept valid OHLC data', async () => {
      const validKlines = mockBinanceKlines(10);
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => validKlines,
      });

      await expect(service.getCandles('SOLUSDT', '1h', 10)).resolves.toBeDefined();
    });
  });

  // ============================================
  // INTEGRATION TESTS
  // ============================================

  describe('Integration', () => {
    it('should return candles compatible with StrategyEngine', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockBinanceKlines(15),
      });

      const candles = await service.getCandles('SOLUSDT', '1h', 15);

      // Verify structure matches DriftCandle interface
      candles.forEach((candle) => {
        expect(candle).toHaveProperty('timestamp');
        expect(candle).toHaveProperty('open');
        expect(candle).toHaveProperty('high');
        expect(candle).toHaveProperty('low');
        expect(candle).toHaveProperty('close');
        expect(candle).toHaveProperty('volume');
        expect(typeof candle.timestamp).toBe('number');
        expect(typeof candle.open).toBe('number');
      });
    });
  });
});

// ============================================
// MOCK DATA HELPERS
// ============================================

/**
 * Generate mock Binance kline data
 * Returns array of [timestamp, O, H, L, C, V, ...] arrays
 */
function mockBinanceKlines(count: number): any[] {
  const klines: any[] = [];
  const baseTimestamp = 1640000000000; // 2021-12-20
  const basePrice = 100;

  for (let i = 0; i < count; i++) {
    const timestamp = baseTimestamp + i * 3600 * 1000; // 1 hour intervals
    const open = basePrice + i;
    const high = open + 2;
    const low = open - 1;
    const close = open + 1;
    const volume = 1000000 + i * 10000;

    klines.push([
      timestamp,
      open.toString(),
      high.toString(),
      low.toString(),
      close.toString(),
      volume.toString(),
      timestamp + 3599999, // Close time
      '0', // Quote asset volume
      0, // Number of trades
      '0', // Taker buy base volume
      '0', // Taker buy quote volume
      '0', // Ignore
    ]);
  }

  return klines;
}
