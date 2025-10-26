/**
 * Strategy Engine Service
 *
 * Core business logic for trading strategy:
 * - Confluence calculation (6 factors)
 * - Technical indicators (RSI, Support/Resistance, FVG, Order Blocks)
 * - Position sizing with risk management
 * - Liquidation price calculation
 *
 * This service is independent of external APIs and can be tested with mock data.
 */

// ============================================
// TYPES (matching Drift API structure)
// ============================================

export interface DriftMarketData {
  asset: string;
  price: number;
  price_change_24h_pct: number;
  volume_24h: number;
  open_interest: number;
  oi_change_24h_pct: number;
  funding_rate: number;
  funding_rate_annualized: number;
  next_funding_time: string;
  last_update: string;
}

export interface DriftCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ConfluenceResult {
  score: number; // 0-6
  factors: {
    rsi_oversold_bought: boolean;
    support_resistance: boolean;
    oi_divergence: boolean;
    fvg_present: boolean;
    order_block: boolean;
    funding_extreme: boolean;
  };
  details: {
    rsi: number;
    support_levels: number[];
    resistance_levels: number[];
    fvg_zones: Array<{ top: number; bottom: number }>;
    order_blocks: Array<{ price: number; type: 'demand' | 'supply' }>;
    funding_rate: number;
  };
}

export interface PositionCalculation {
  position_size: number;
  notional_value: number;
  margin_required: number;
  liquidation_price: number;
  liquidation_distance_pct: number;
  risk_amount_usd: number;
  risk_per_unit: number;
  is_safe: boolean;
  warnings: string[];
}

// ============================================
// STRATEGY ENGINE
// ============================================

export class StrategyEngine {
  /**
   * Calculate confluence score based on multiple factors
   *
   * Evaluates 6 technical factors:
   * 1. RSI oversold/overbought
   * 2. Price near support/resistance
   * 3. OI divergence (price vs OI direction)
   * 4. Fair Value Gap present
   * 5. Order Block present
   * 6. Funding rate extreme
   */
  calculateConfluence(params: {
    asset: string;
    marketData: DriftMarketData;
    candles: DriftCandle[];
  }): ConfluenceResult {
    const { marketData, candles } = params;

    // Calculate indicators
    const rsi = this.calculateRSI(candles, 14);
    const { supports, resistances } = this.findSupportResistance(candles);
    const oiDivergence = this.detectOIDivergence(marketData, candles);
    const fvgZones = this.detectFairValueGaps(candles);
    const orderBlocks = this.detectOrderBlocks(candles);
    const fundingExtreme = Math.abs(marketData.funding_rate) > 0.02;

    // Evaluate each factor
    const factors = {
      rsi_oversold_bought: rsi < 35 || rsi > 65,
      support_resistance: this.isPriceNearLevel(
        marketData.price,
        [...supports, ...resistances],
        0.02
      ),
      oi_divergence: oiDivergence,
      fvg_present: fvgZones.length > 0,
      order_block: orderBlocks.length > 0,
      funding_extreme: fundingExtreme,
    };

    // Count true factors
    const score = Object.values(factors).filter(Boolean).length;

    return {
      score,
      factors,
      details: {
        rsi,
        support_levels: supports,
        resistance_levels: resistances,
        fvg_zones: fvgZones,
        order_blocks: orderBlocks,
        funding_rate: marketData.funding_rate,
      },
    };
  }

  /**
   * Calculate position size based on risk management rules
   *
   * Formula: position_size = (account_size * risk_pct) / (entry - stop)
   *
   * Also calculates:
   * - Liquidation price (approximate for 10x leverage)
   * - Margin required
   * - Safety checks (liq distance > 8%, sufficient balance)
   */
  calculatePosition(params: {
    entry_price: number;
    stop_loss: number;
    risk_pct: number; // 1 = 1%
    account_size: number;
    leverage: number;
  }): PositionCalculation {
    const { entry_price, stop_loss, risk_pct, account_size, leverage } = params;

    const risk_amount_usd = account_size * (risk_pct / 100);
    const risk_per_unit = Math.abs(entry_price - stop_loss);
    const position_size = risk_amount_usd / risk_per_unit;
    const notional_value = position_size * entry_price;
    const margin_required = notional_value / leverage;

    // Simplified liquidation calculation (Drift uses maintenance margin)
    // This is approximate - actual calculation depends on Drift's margin requirements
    const maintenanceMarginPct = 0.03; // 3% maintenance margin (example)
    const direction = entry_price > stop_loss ? 'long' : 'short';

    let liquidation_price: number;
    if (direction === 'long') {
      liquidation_price = entry_price * (1 - 1 / leverage + maintenanceMarginPct);
    } else {
      liquidation_price = entry_price * (1 + 1 / leverage - maintenanceMarginPct);
    }

    const liquidation_distance_pct =
      (Math.abs(liquidation_price - entry_price) / entry_price) * 100;

    const warnings: string[] = [];
    if (liquidation_distance_pct < 8) {
      warnings.push('Liquidation price too close (< 8%)');
    }
    if (margin_required > account_size) {
      warnings.push('Insufficient account balance');
    }

    return {
      position_size,
      notional_value,
      margin_required,
      liquidation_price,
      liquidation_distance_pct,
      risk_amount_usd,
      risk_per_unit,
      is_safe: liquidation_distance_pct >= 8 && margin_required <= account_size,
      warnings,
    };
  }

  // ============================================
  // TECHNICAL INDICATORS (Private Methods)
  // ============================================

  /**
   * Calculate RSI (Relative Strength Index)
   *
   * Classic 14-period RSI calculation:
   * - RSI < 30: Oversold
   * - RSI > 70: Overbought
   *
   * Returns 50 if insufficient data.
   */
  private calculateRSI(candles: DriftCandle[], period: number = 14): number {
    if (candles.length < period + 1) return 50; // Not enough data

    let gains = 0;
    let losses = 0;

    for (let i = candles.length - period; i < candles.length; i++) {
      const change = candles[i].close - candles[i - 1].close;
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);

    return rsi;
  }

  /**
   * Find support and resistance levels
   *
   * Identifies local highs/lows in recent price action (last 20 candles).
   * Returns deduplicated levels (within 1% proximity).
   */
  private findSupportResistance(
    candles: DriftCandle[]
  ): { supports: number[]; resistances: number[] } {
    // Simplified: Find local highs/lows in recent candles
    const lookback = 20;
    const recentCandles = candles.slice(-lookback);

    const highs = recentCandles.map((c) => c.high);
    const lows = recentCandles.map((c) => c.low);

    // Find pivots (simple implementation)
    const resistances = this.findLocalExtrema(highs, 'max');
    const supports = this.findLocalExtrema(lows, 'min');

    return { supports, resistances };
  }

  /**
   * Find local extrema (peaks or valleys)
   *
   * Uses 3-candle window to identify local max/min.
   */
  private findLocalExtrema(values: number[], type: 'max' | 'min'): number[] {
    const extrema: number[] = [];
    const window = 3;

    for (let i = window; i < values.length - window; i++) {
      const slice = values.slice(i - window, i + window + 1);
      const value = values[i];

      if (type === 'max' && value === Math.max(...slice)) {
        extrema.push(value);
      } else if (type === 'min' && value === Math.min(...slice)) {
        extrema.push(value);
      }
    }

    // Deduplicate nearby levels (within 1%)
    return this.deduplicateLevels(extrema, 0.01);
  }

  /**
   * Deduplicate price levels within threshold
   */
  private deduplicateLevels(levels: number[], thresholdPct: number): number[] {
    const sorted = [...levels].sort((a, b) => a - b);
    const deduplicated: number[] = [];

    for (const level of sorted) {
      if (
        deduplicated.length === 0 ||
        Math.abs(level - deduplicated[deduplicated.length - 1]) / level >
          thresholdPct
      ) {
        deduplicated.push(level);
      }
    }

    return deduplicated;
  }

  /**
   * Check if price is near a key level (within threshold %)
   */
  private isPriceNearLevel(
    price: number,
    levels: number[],
    thresholdPct: number
  ): boolean {
    return levels.some((level) => Math.abs(price - level) / level < thresholdPct);
  }

  /**
   * Detect Open Interest divergence
   *
   * OI divergence signals potential reversal:
   * - Price down + OI up = Shorts building (potential squeeze)
   * - Price up + OI down = Longs closing (potential dump)
   *
   * Returns true if opposite signs and both significant.
   */
  private detectOIDivergence(
    marketData: DriftMarketData,
    candles: DriftCandle[]
  ): boolean {
    // OI divergence: Price down + OI up (or vice versa)
    const priceChange = marketData.price_change_24h_pct;
    const oiChange = marketData.oi_change_24h_pct;

    // Divergence: opposite signs and both significant
    return (
      Math.sign(priceChange) !== Math.sign(oiChange) &&
      Math.abs(priceChange) > 2 &&
      Math.abs(oiChange) > 5
    );
  }

  /**
   * Detect Fair Value Gaps (FVG)
   *
   * FVG = imbalance zone where price moved too fast.
   * - Bullish FVG: Gap between prev.high and next.low
   * - Bearish FVG: Gap between prev.low and next.high
   *
   * Returns last 5 FVGs.
   */
  private detectFairValueGaps(
    candles: DriftCandle[]
  ): Array<{ top: number; bottom: number }> {
    const fvgs: Array<{ top: number; bottom: number }> = [];

    // FVG: Gap between candle[i-1].high and candle[i+1].low (or vice versa)
    for (let i = 1; i < candles.length - 1; i++) {
      const prev = candles[i - 1];
      const curr = candles[i];
      const next = candles[i + 1];

      // Bullish FVG: prev.high < next.low
      if (prev.high < next.low) {
        fvgs.push({ bottom: prev.high, top: next.low });
      }

      // Bearish FVG: prev.low > next.high
      if (prev.low > next.high) {
        fvgs.push({ top: prev.low, bottom: next.high });
      }
    }

    // Filter only recent FVGs (last 5)
    return fvgs.slice(-5);
  }

  /**
   * Detect Order Blocks (demand/supply zones)
   *
   * Order Block = zone where large institutional orders occurred.
   * Identified by:
   * - Large move candle (1.5x average range)
   * - Followed by retracement
   *
   * Returns last 3 order blocks.
   */
  private detectOrderBlocks(
    candles: DriftCandle[]
  ): Array<{ price: number; type: 'demand' | 'supply' }> {
    const blocks: Array<{ price: number; type: 'demand' | 'supply' }> = [];

    // Order Block: Large move candle followed by retracement
    for (let i = 1; i < candles.length - 1; i++) {
      const curr = candles[i];
      const next = candles[i + 1];

      const currRange = curr.high - curr.low;
      const avgRange =
        candles
          .slice(Math.max(0, i - 10), i)
          .reduce((sum, c) => sum + (c.high - c.low), 0) / 10;

      // Large bullish candle (demand zone)
      if (curr.close > curr.open && currRange > avgRange * 1.5) {
        blocks.push({ price: curr.low, type: 'demand' });
      }

      // Large bearish candle (supply zone)
      if (curr.close < curr.open && currRange > avgRange * 1.5) {
        blocks.push({ price: curr.high, type: 'supply' });
      }
    }

    return blocks.slice(-3); // Recent order blocks only
  }
}

/**
 * Singleton instance of StrategyEngine
 */
export const strategyEngine = new StrategyEngine();
