/**
 * Drift Service - Market Data Integration via SDK
 *
 * Fase 1.3 Implementation:
 * - Read-only access to Drift Protocol on-chain data
 * - No wallet or API keys required (only Solana RPC)
 * - Fetches price, open interest, funding rate, orderbook
 * - 30s caching to reduce RPC calls
 *
 * Uses:
 * - Drift TypeScript SDK (@drift-labs/sdk)
 * - Helius RPC endpoint (free tier: 100k requests/day)
 */

import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import {
  DriftClient,
  initialize,
  PerpMarkets,
  convertToNumber,
  PRICE_PRECISION,
  BASE_PRECISION,
  QUOTE_PRECISION,
  BN,
  Wallet,
} from '@drift-labs/sdk';

// Import DriftMarketData and DriftCandle from strategyEngine (avoid duplication)
import type { DriftMarketData, DriftCandle } from './strategy-engine.service';
import { binanceCandlesService } from './binance-candles.service';
import type { BinanceInterval } from './binance-candles.service';

// ============================================
// TYPES
// ============================================

export type DriftAsset = 'SOL-PERP' | 'BTC-PERP';

/**
 * Orderbook snapshot (DLOB + AMM combined)
 */
export interface DriftOrderbook {
  bids: Array<{ price: number; size: number }>;
  asks: Array<{ price: number; size: number }>;
  spread: number;                   // Spread in % (ask - bid) / mid
  midPrice: number;                 // (bid + ask) / 2
  timestamp: number;
}

/**
 * Liquidity check result (for confluence factor)
 */
export interface DriftLiquidity {
  bidLiquidity: number;             // Total size within 0.2% below mid
  askLiquidity: number;             // Total size within 0.2% above mid
  totalLiquidity: number;           // bidLiquidity + askLiquidity
  isSufficient: boolean;            // true if both sides > threshold
  threshold: number;                // Min liquidity per side (e.g., $10k)
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Market index mapping for Drift Protocol
 * See: https://github.com/drift-labs/protocol-v2/blob/master/sdk/src/constants/perpMarkets.ts
 */
const MARKET_INDEX: Record<DriftAsset, number> = {
  'SOL-PERP': 0,
  'BTC-PERP': 1,
};

const CACHE_TTL_MS = 30_000; // 30 seconds
const RPC_TIMEOUT_MS = 5_000; // 5 seconds
const LIQUIDITY_THRESHOLD_USD = 10_000; // $10k per side
const LIQUIDITY_RANGE_PERCENT = 0.2; // 0.2% range from mid

// ============================================
// DRIFT SERVICE
// ============================================

export class DriftService {
  private client: DriftClient | null = null;
  private connection: Connection;
  private cache = new Map<string, { data: any; expiry: number }>();
  private isSubscribed = false;

  constructor() {
    // Use Helius RPC (free tier) or fallback to public Solana RPC
    const rpcUrl = process.env.HELIUS_API_URL ||
                   process.env.SOLANA_RPC_URL ||
                   'https://api.mainnet-beta.solana.com';

    console.log(`🌐 DriftService: Connecting to Solana RPC...`);

    this.connection = new Connection(rpcUrl, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: RPC_TIMEOUT_MS,
    });
  }

  /**
   * Initialize DriftClient (call once before using)
   * Read-only mode - no wallet required
   */
  async initialize(): Promise<void> {
    if (this.client && this.isSubscribed) {
      console.log('✅ DriftClient already initialized');
      return;
    }

    try {
      console.log('🔄 Initializing DriftClient (read-only mode)...');

      // Initialize SDK config
      const sdkConfig = initialize({ env: 'mainnet-beta' });

      // Create dummy wallet for read-only mode (no private key needed)
      // This wallet won't sign any transactions - we only use it for reading on-chain data
      const dummyKeypair = Keypair.generate();
      const dummyWallet = new Wallet(dummyKeypair);

      // Create read-only DriftClient
      this.client = new DriftClient({
        connection: this.connection,
        wallet: dummyWallet,
        env: 'mainnet-beta',
      });

      // Subscribe to on-chain account updates
      await this.client.subscribe();
      this.isSubscribed = true;

      console.log('✅ DriftClient initialized and subscribed');
    } catch (error) {
      console.error('❌ Failed to initialize DriftClient:', error);
      throw new Error(
        `Drift SDK initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get comprehensive market data for an asset
   *
   * Includes: price, OI, funding rate, volume, 24h change
   * Cached for 30s to reduce RPC calls
   */
  async getMarketData(asset: DriftAsset): Promise<DriftMarketData> {
    // Check cache first
    const cached = this.getCached<DriftMarketData>(`market_${asset}`);
    if (cached) {
      console.log(`📦 Cache hit: ${asset} market data`);
      return cached;
    }

    // Ensure client is initialized
    if (!this.client || !this.isSubscribed) {
      await this.initialize();
    }

    try {
      console.log(`🔍 Fetching ${asset} market data from Drift...`);

      const marketIndex = MARKET_INDEX[asset];

      // Get perp market account
      const perpMarket = this.client!.getPerpMarketAccount(marketIndex);
      if (!perpMarket) {
        throw new Error(`Market ${asset} not found (index ${marketIndex})`);
      }

      // Get oracle price data
      const oracleData = this.client!.getOracleDataForPerpMarket(marketIndex);

      // Calculate bid/ask prices
      const [bidBN, askBN] = calculateBidAskPrice(perpMarket.amm, oracleData);
      const price = convertToNumber(oracleData.price, PRICE_PRECISION);
      const bidPrice = convertToNumber(bidBN, PRICE_PRECISION);
      const askPrice = convertToNumber(askBN, PRICE_PRECISION);

      // Extract open interest
      const openInterestBN = perpMarket.amm.baseAssetAmountWithAmm.abs();
      const open_interest = convertToNumber(openInterestBN, BASE_PRECISION);

      // Extract funding rate (per-hour basis, then convert)
      const fundingRateBN = perpMarket.amm.lastFundingRate;
      const funding_rate = convertToNumber(fundingRateBN, PRICE_PRECISION); // Per-hour funding
      const funding_rate_annualized = funding_rate * 365 * 24 * 100; // Annualized %

      // TODO: Get volume_24h, price_change_24h_pct, oi_change_24h_pct from historical data
      // For now, return placeholder values (will be implemented with Historical Data API)
      const volume_24h = 0;
      const price_change_24h_pct = 0;
      const oi_change_24h_pct = 0;

      // Next funding time (Drift funding happens every hour)
      const next_funding_time = new Date(Date.now() + 3600 * 1000).toISOString();

      const marketData: DriftMarketData = {
        asset,
        price,
        price_change_24h_pct,
        volume_24h,
        open_interest,
        oi_change_24h_pct,
        funding_rate,
        funding_rate_annualized,
        next_funding_time,
        last_update: new Date().toISOString(),
      };

      // Cache result
      this.setCache(`market_${asset}`, marketData);

      console.log(`✅ ${asset}: $${price.toFixed(2)}, OI: ${open_interest.toFixed(0)} units, Funding: ${(funding_rate * 100).toFixed(4)}%/h`);

      return marketData;
    } catch (error) {
      console.error(`❌ Failed to fetch ${asset} market data:`, error);
      throw this.handleError(error, 'getMarketData');
    }
  }

  /**
   * Get orderbook snapshot (DLOB + AMM)
   *
   * Returns top N levels for bids and asks
   * Used for spread and liquidity analysis
   */
  async getOrderbook(asset: DriftAsset, depth = 10): Promise<DriftOrderbook> {
    // Check cache
    const cached = this.getCached<DriftOrderbook>(`orderbook_${asset}`);
    if (cached) {
      console.log(`📦 Cache hit: ${asset} orderbook`);
      return cached;
    }

    // Ensure client is initialized
    if (!this.client || !this.isSubscribed) {
      await this.initialize();
    }

    try {
      console.log(`🔍 Fetching ${asset} orderbook (depth: ${depth})...`);

      const marketIndex = MARKET_INDEX[asset];
      const perpMarket = this.client!.getPerpMarketAccount(marketIndex);
      if (!perpMarket) {
        throw new Error(`Market ${asset} not found (index ${marketIndex})`);
      }

      const oracleData = this.client!.getOracleDataForPerpMarket(marketIndex);

      // Calculate bid/ask prices from AMM
      const [bidBN, askBN] = calculateBidAskPrice(perpMarket.amm, oracleData);
      const bidPrice = convertToNumber(bidBN, PRICE_PRECISION);
      const askPrice = convertToNumber(askBN, PRICE_PRECISION);

      // For MVP, we'll use AMM prices as single-level orderbook
      // Full DLOB integration would require DriftClient.getDLOBProvider()
      // which adds complexity - defer to post-MVP if needed
      const bids = [{ price: bidPrice, size: 100 }]; // Placeholder size
      const asks = [{ price: askPrice, size: 100 }]; // Placeholder size

      const midPrice = (bidPrice + askPrice) / 2;
      const spread = ((askPrice - bidPrice) / midPrice) * 100;

      const orderbook: DriftOrderbook = {
        bids,
        asks,
        spread,
        midPrice,
        timestamp: Date.now(),
      };

      // Cache result
      this.setCache(`orderbook_${asset}`, orderbook);

      console.log(`✅ ${asset} orderbook: mid $${midPrice.toFixed(2)}, spread ${spread.toFixed(3)}%`);

      return orderbook;
    } catch (error) {
      console.error(`❌ Failed to fetch ${asset} orderbook:`, error);
      throw this.handleError(error, 'getOrderbook');
    }
  }

  /**
   * Check liquidity within 0.2% of mid price
   *
   * Used as confluence factor (tight spreads + deep liquidity = high conviction)
   */
  async checkLiquidity(asset: DriftAsset): Promise<DriftLiquidity> {
    // Check cache
    const cached = this.getCached<DriftLiquidity>(`liquidity_${asset}`);
    if (cached) {
      console.log(`📦 Cache hit: ${asset} liquidity`);
      return cached;
    }

    try {
      console.log(`🔍 Checking ${asset} liquidity...`);

      // Get orderbook (cached if available)
      const orderbook = await this.getOrderbook(asset);

      // Calculate liquidity within 0.2% range
      const rangeMultiplier = LIQUIDITY_RANGE_PERCENT / 100;
      const bidThreshold = orderbook.midPrice * (1 - rangeMultiplier);
      const askThreshold = orderbook.midPrice * (1 + rangeMultiplier);

      // Sum up sizes within range
      const bidLiquidity = orderbook.bids
        .filter(level => level.price >= bidThreshold)
        .reduce((sum, level) => sum + level.size * level.price, 0);

      const askLiquidity = orderbook.asks
        .filter(level => level.price <= askThreshold)
        .reduce((sum, level) => sum + level.size * level.price, 0);

      const totalLiquidity = bidLiquidity + askLiquidity;
      const isSufficient = bidLiquidity >= LIQUIDITY_THRESHOLD_USD &&
                          askLiquidity >= LIQUIDITY_THRESHOLD_USD;

      const liquidity: DriftLiquidity = {
        bidLiquidity,
        askLiquidity,
        totalLiquidity,
        isSufficient,
        threshold: LIQUIDITY_THRESHOLD_USD,
      };

      // Cache result
      this.setCache(`liquidity_${asset}`, liquidity);

      console.log(`✅ ${asset} liquidity: $${(totalLiquidity / 1e3).toFixed(1)}k (sufficient: ${isSufficient})`);

      return liquidity;
    } catch (error) {
      console.error(`❌ Failed to check ${asset} liquidity:`, error);
      throw this.handleError(error, 'checkLiquidity');
    }
  }

  /**
   * Get historical candles for technical analysis
   *
   * NOTE: Uses Binance Futures as data source (~95% price correlation with Drift).
   * This is a pragmatic trade-off for MVP:
   * - Drift has no native OHLCV API
   * - Binance SOLUSDT/BTCUSDT perpetuals correlate well with Drift pricing
   * - Technical patterns (RSI, S/R, FVG, OB) are similar across exchanges
   *
   * For exchange-specific data (funding, OI), use getMarketData() which queries Drift directly.
   *
   * @param asset - SOL-PERP or BTC-PERP
   * @param interval - Candle timeframe (1m, 5m, 15m, 1h, 4h, 1d)
   * @param limit - Number of candles (1-1500, default 100)
   * @returns Array of DriftCandle objects (ascending timestamp order)
   */
  async getCandles(
    asset: DriftAsset,
    interval: BinanceInterval = '1h',
    limit: number = 100
  ): Promise<DriftCandle[]> {
    try {
      console.log(`🔍 Fetching ${asset} ${interval} candles (limit: ${limit})...`);

      // Map Drift asset to Binance symbol
      const symbol = asset === 'SOL-PERP' ? 'SOLUSDT' : 'BTCUSDT';

      // Delegate to BinanceCandlesService
      const candles = await binanceCandlesService.getCandles(symbol, interval, limit);

      console.log(`✅ ${asset}: ${candles.length} candles ready for analysis`);

      return candles;
    } catch (error) {
      console.error(`❌ Failed to fetch ${asset} candles:`, error);
      throw this.handleError(error, 'getCandles');
    }
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️  Cache cleared');
  }

  /**
   * Unsubscribe from DriftClient (cleanup on shutdown)
   */
  async cleanup(): Promise<void> {
    if (this.client && this.isSubscribed) {
      await this.client.unsubscribe();
      this.isSubscribed = false;
      console.log('👋 DriftClient unsubscribed');
    }
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiry) {
      return cached.data as T;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + CACHE_TTL_MS,
    });
  }

  private handleError(error: unknown, method: string): Error {
    if (error instanceof Error) {
      // Connection timeout
      if (error.message.includes('timeout')) {
        return new Error(
          `Drift SDK timeout: RPC connection failed (${RPC_TIMEOUT_MS}ms). Check HELIUS_API_URL in .env.local`
        );
      }

      // Rate limit
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        return new Error(
          'Drift SDK rate limit: Too many RPC requests. Wait a moment or upgrade Helius tier.'
        );
      }

      // Invalid market
      if (error.message.includes('not found')) {
        return error; // Already user-friendly
      }

      // Generic error
      return new Error(`Drift SDK error in ${method}: ${error.message}`);
    }

    return new Error(`Drift SDK unknown error in ${method}`);
  }
}

/**
 * Helper: Calculate bid/ask price from AMM
 * Extracted from Drift SDK examples
 */
function calculateBidAskPrice(amm: any, oracleData: any): [BN, BN] {
  const price = oracleData.price;

  // Simplified bid/ask calculation
  // In production, use SDK's calculateBidAskPrice helper
  const spreadBps = 10; // 0.1% spread (10 basis points)
  const spreadMultiplier = new BN(spreadBps);
  const bpsBase = new BN(10000);

  const bid = price.mul(bpsBase.sub(spreadMultiplier)).div(bpsBase);
  const ask = price.mul(bpsBase.add(spreadMultiplier)).div(bpsBase);

  return [bid, ask];
}

/**
 * Singleton instance of DriftService
 */
export const driftService = new DriftService();
