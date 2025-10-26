/**
 * Strategy Engine Unit Tests
 *
 * Tests all technical indicators and business logic:
 * - RSI calculation
 * - Confluence score calculation
 * - Position sizing
 * - Liquidation price calculation
 * - Support/Resistance detection
 * - FVG detection
 * - Order Block detection
 */

import { describe, it, expect } from 'vitest';
import {
  StrategyEngine,
  type DriftMarketData,
  type DriftCandle,
} from '../strategy-engine.service';

describe('StrategyEngine', () => {
  const engine = new StrategyEngine();

  // ============================================
  // MOCK DATA GENERATORS
  // ============================================

  function generateMockCandles(count: number, basePrice: number = 100): DriftCandle[] {
    const candles: DriftCandle[] = [];
    let price = basePrice;

    for (let i = 0; i < count; i++) {
      // Simulate price movement
      const change = (Math.random() - 0.5) * 2; // Random walk
      price += change;

      const high = price + Math.random();
      const low = price - Math.random();
      const open = price + (Math.random() - 0.5);
      const close = price + (Math.random() - 0.5);

      candles.push({
        timestamp: Date.now() - (count - i) * 3600000, // 1h intervals
        open,
        high,
        low,
        close,
        volume: 10000 + Math.random() * 5000,
      });
    }

    return candles;
  }

  function generateTrendingCandles(
    count: number,
    direction: 'up' | 'down',
    basePrice: number = 100
  ): DriftCandle[] {
    const candles: DriftCandle[] = [];
    let price = basePrice;

    for (let i = 0; i < count; i++) {
      const trend = direction === 'up' ? 0.5 : -0.5;
      price += trend;

      candles.push({
        timestamp: Date.now() - (count - i) * 3600000,
        open: price - 0.2,
        high: price + 0.3,
        low: price - 0.3,
        close: price + 0.2,
        volume: 10000,
      });
    }

    return candles;
  }

  function generateMockMarketData(overrides?: Partial<DriftMarketData>): DriftMarketData {
    return {
      asset: 'SOL-PERP',
      price: 138.5,
      price_change_24h_pct: 2.5,
      volume_24h: 50000000,
      open_interest: 100000,
      oi_change_24h_pct: -3.2,
      funding_rate: 0.015,
      funding_rate_annualized: 5.475,
      next_funding_time: '2025-10-27T00:00:00Z',
      last_update: '2025-10-26T22:00:00Z',
      ...overrides,
    };
  }

  // ============================================
  // RSI TESTS
  // ============================================

  describe('calculateRSI', () => {
    it('should return 50 if insufficient data', () => {
      const candles = generateMockCandles(10); // Less than 14 + 1
      // @ts-expect-error - accessing private method for testing
      const rsi = engine.calculateRSI(candles, 14);
      expect(rsi).toBe(50);
    });

    it('should return RSI between 0-100', () => {
      const candles = generateMockCandles(30);
      // @ts-expect-error - accessing private method for testing
      const rsi = engine.calculateRSI(candles, 14);
      expect(rsi).toBeGreaterThanOrEqual(0);
      expect(rsi).toBeLessThanOrEqual(100);
    });

    it('should return high RSI for uptrend', () => {
      const candles = generateTrendingCandles(30, 'up');
      // @ts-expect-error - accessing private method for testing
      const rsi = engine.calculateRSI(candles, 14);
      expect(rsi).toBeGreaterThan(50); // Uptrend should have RSI > 50
    });

    it('should return low RSI for downtrend', () => {
      const candles = generateTrendingCandles(30, 'down');
      // @ts-expect-error - accessing private method for testing
      const rsi = engine.calculateRSI(candles, 14);
      expect(rsi).toBeLessThan(50); // Downtrend should have RSI < 50
    });

    it('should return 100 if no losses', () => {
      const candles: DriftCandle[] = [];
      for (let i = 0; i < 20; i++) {
        candles.push({
          timestamp: Date.now() - i * 3600000,
          open: 100 + i,
          high: 101 + i,
          low: 100 + i,
          close: 101 + i,
          volume: 10000,
        });
      }
      // @ts-expect-error - accessing private method for testing
      const rsi = engine.calculateRSI(candles, 14);
      expect(rsi).toBe(100);
    });
  });

  // ============================================
  // CONFLUENCE CALCULATION TESTS
  // ============================================

  describe('calculateConfluence', () => {
    it('should return score between 0-6', () => {
      const candles = generateMockCandles(50);
      const marketData = generateMockMarketData();

      const result = engine.calculateConfluence({
        asset: 'SOL-PERP',
        marketData,
        candles,
      });

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(6);
    });

    it('should detect RSI oversold condition', () => {
      // Generate downtrend to get low RSI
      const candles = generateTrendingCandles(30, 'down');
      const marketData = generateMockMarketData();

      const result = engine.calculateConfluence({
        asset: 'SOL-PERP',
        marketData,
        candles,
      });

      expect(result.details.rsi).toBeLessThan(50);
    });

    it('should detect OI divergence', () => {
      const candles = generateMockCandles(50);
      const marketData = generateMockMarketData({
        price_change_24h_pct: 5.0, // Price up
        oi_change_24h_pct: -8.0, // OI down (divergence)
      });

      const result = engine.calculateConfluence({
        asset: 'SOL-PERP',
        marketData,
        candles,
      });

      expect(result.factors.oi_divergence).toBe(true);
    });

    it('should detect funding rate extreme', () => {
      const candles = generateMockCandles(50);
      const marketData = generateMockMarketData({
        funding_rate: 0.025, // > 2% threshold
      });

      const result = engine.calculateConfluence({
        asset: 'SOL-PERP',
        marketData,
        candles,
      });

      expect(result.factors.funding_extreme).toBe(true);
    });

    it('should count all factors correctly', () => {
      const candles = generateMockCandles(50);
      const marketData = generateMockMarketData();

      const result = engine.calculateConfluence({
        asset: 'SOL-PERP',
        marketData,
        candles,
      });

      const manualCount = Object.values(result.factors).filter(Boolean).length;
      expect(result.score).toBe(manualCount);
    });

    it('should include all factor details', () => {
      const candles = generateMockCandles(50);
      const marketData = generateMockMarketData();

      const result = engine.calculateConfluence({
        asset: 'SOL-PERP',
        marketData,
        candles,
      });

      expect(result.details).toHaveProperty('rsi');
      expect(result.details).toHaveProperty('support_levels');
      expect(result.details).toHaveProperty('resistance_levels');
      expect(result.details).toHaveProperty('fvg_zones');
      expect(result.details).toHaveProperty('order_blocks');
      expect(result.details).toHaveProperty('funding_rate');
    });
  });

  // ============================================
  // POSITION SIZING TESTS
  // ============================================

  describe('calculatePosition', () => {
    it('should calculate position size correctly (1% risk)', () => {
      const result = engine.calculatePosition({
        entry_price: 138.5,
        stop_loss: 136.5, // $2 risk per unit
        risk_pct: 1, // 1% of account
        account_size: 50000,
        leverage: 10,
      });

      // Expected: (50000 * 0.01) / 2 = 250 units
      expect(result.position_size).toBe(250);
      expect(result.risk_amount_usd).toBe(500);
      expect(result.risk_per_unit).toBe(2);
    });

    it('should calculate notional value correctly', () => {
      const result = engine.calculatePosition({
        entry_price: 100,
        stop_loss: 98,
        risk_pct: 1,
        account_size: 10000,
        leverage: 10,
      });

      // position_size = 100 * (0.01 * 10000) / 2 = 50 units
      // notional = 50 * 100 = 5000
      expect(result.position_size).toBe(50);
      expect(result.notional_value).toBe(5000);
    });

    it('should calculate margin required correctly', () => {
      const result = engine.calculatePosition({
        entry_price: 100,
        stop_loss: 98,
        risk_pct: 1,
        account_size: 10000,
        leverage: 10,
      });

      // notional = 5000, leverage = 10
      // margin = 5000 / 10 = 500
      expect(result.margin_required).toBe(500);
    });

    it('should calculate liquidation price for long position', () => {
      const result = engine.calculatePosition({
        entry_price: 100,
        stop_loss: 98,
        risk_pct: 1,
        account_size: 10000,
        leverage: 10,
      });

      // Long: liq = entry * (1 - 1/leverage + maintenance)
      // liq = 100 * (1 - 0.1 + 0.03) = 93
      expect(result.liquidation_price).toBe(93);
    });

    it('should calculate liquidation price for short position', () => {
      const result = engine.calculatePosition({
        entry_price: 100,
        stop_loss: 102, // Short (stop above entry)
        risk_pct: 1,
        account_size: 10000,
        leverage: 10,
      });

      // Short: liq = entry * (1 + 1/leverage - maintenance)
      // liq = 100 * (1 + 0.1 - 0.03) = 107
      expect(result.liquidation_price).toBe(107);
    });

    it('should warn if liquidation too close (< 8%)', () => {
      const result = engine.calculatePosition({
        entry_price: 100,
        stop_loss: 98,
        risk_pct: 1,
        account_size: 10000,
        leverage: 20, // High leverage = close liq
      });

      expect(result.is_safe).toBe(false);
      expect(result.warnings).toContain('Liquidation price too close (< 8%)');
    });

    it('should warn if insufficient balance', () => {
      const result = engine.calculatePosition({
        entry_price: 100,
        stop_loss: 98,
        risk_pct: 10, // 10% risk (too high)
        account_size: 1000, // Small account
        leverage: 2, // Low leverage = high margin
      });

      expect(result.warnings).toContain('Insufficient account balance');
    });

    it('should mark as safe if all conditions met', () => {
      const result = engine.calculatePosition({
        entry_price: 100,
        stop_loss: 98,
        risk_pct: 1,
        account_size: 50000,
        leverage: 5, // Lower leverage for safer liquidation distance
      });

      expect(result.is_safe).toBe(true);
      expect(result.warnings).toHaveLength(0);
      expect(result.liquidation_distance_pct).toBeGreaterThanOrEqual(8);
    });

    it('should calculate liquidation distance percentage', () => {
      const result = engine.calculatePosition({
        entry_price: 100,
        stop_loss: 98,
        risk_pct: 1,
        account_size: 10000,
        leverage: 10,
      });

      // liq = 93, entry = 100
      // distance = (100 - 93) / 100 * 100 = 7%
      expect(result.liquidation_distance_pct).toBeCloseTo(7, 1); // Within 0.1
    });
  });

  // ============================================
  // SUPPORT/RESISTANCE TESTS
  // ============================================

  describe('findSupportResistance', () => {
    it('should find support and resistance levels', () => {
      const candles = generateMockCandles(50);
      // @ts-expect-error - accessing private method for testing
      const result = engine.findSupportResistance(candles);

      expect(result).toHaveProperty('supports');
      expect(result).toHaveProperty('resistances');
      expect(Array.isArray(result.supports)).toBe(true);
      expect(Array.isArray(result.resistances)).toBe(true);
    });
  });

  // ============================================
  // FVG DETECTION TESTS
  // ============================================

  describe('detectFairValueGaps', () => {
    it('should detect bullish FVG', () => {
      const candles: DriftCandle[] = [
        { timestamp: 1, open: 100, high: 101, low: 99, close: 100.5, volume: 1000 },
        { timestamp: 2, open: 100.5, high: 105, low: 100, close: 104, volume: 1000 }, // Gap up
        { timestamp: 3, open: 104, high: 106, low: 103, close: 105, volume: 1000 }, // Leaves gap below
      ];

      // @ts-expect-error - accessing private method for testing
      const fvgs = engine.detectFairValueGaps(candles);

      expect(fvgs.length).toBeGreaterThan(0);
      expect(fvgs[0]).toHaveProperty('top');
      expect(fvgs[0]).toHaveProperty('bottom');
    });

    it('should return max 5 recent FVGs', () => {
      const candles = generateMockCandles(100);
      // @ts-expect-error - accessing private method for testing
      const fvgs = engine.detectFairValueGaps(candles);

      expect(fvgs.length).toBeLessThanOrEqual(5);
    });
  });

  // ============================================
  // ORDER BLOCK DETECTION TESTS
  // ============================================

  describe('detectOrderBlocks', () => {
    it('should detect demand order block (large bullish candle)', () => {
      const candles: DriftCandle[] = [];

      // Setup: 10 normal candles + 1 large bullish
      for (let i = 0; i < 10; i++) {
        candles.push({
          timestamp: i,
          open: 100,
          high: 100.5,
          low: 99.5,
          close: 100,
          volume: 1000,
        });
      }

      // Large bullish candle (demand)
      candles.push({
        timestamp: 11,
        open: 100,
        high: 103, // Large range
        low: 100,
        close: 102.5,
        volume: 5000,
      });

      candles.push({
        timestamp: 12,
        open: 102.5,
        high: 103,
        low: 102,
        close: 102.5,
        volume: 1000,
      });

      // @ts-expect-error - accessing private method for testing
      const blocks = engine.detectOrderBlocks(candles);

      expect(blocks.length).toBeGreaterThan(0);
      const demandBlock = blocks.find((b) => b.type === 'demand');
      expect(demandBlock).toBeDefined();
    });

    it('should return max 3 recent order blocks', () => {
      const candles = generateMockCandles(100);
      // @ts-expect-error - accessing private method for testing
      const blocks = engine.detectOrderBlocks(candles);

      expect(blocks.length).toBeLessThanOrEqual(3);
    });
  });
});
