/**
 * Claude Tools - Function calling definitions
 *
 * These tools allow Claude to fetch real-time data and perform calculations.
 * Each tool has:
 * - Definition (for Claude API)
 * - Implementation (actual function)
 */

import Anthropic from '@anthropic-ai/sdk';
import { driftService } from '@/lib/services/drift.service';
import { strategyEngine } from '@/lib/services/strategy-engine.service';

// ============================================
// TOOL DEFINITIONS (for Claude API)
// ============================================

export const tools: Anthropic.Tool[] = [
  {
    name: 'fetch_drift_data',
    description:
      'Fetch real-time market data for SOL-PERP or BTC-PERP from Drift Protocol. ' +
      'Returns current price, 24h change, open interest, funding rate, bid/ask prices.',
    input_schema: {
      type: 'object' as const,
      properties: {
        asset: {
          type: 'string',
          enum: ['SOL-PERP', 'BTC-PERP'],
          description: 'The perpetual futures contract to fetch data for',
        },
      },
      required: ['asset'],
    },
  },
  {
    name: 'calculate_confluence',
    description:
      'Calculate confluence score (0-6) for a trading setup. ' +
      'Checks 6 factors: RSI oversold/overbought, support/resistance, OI divergence, ' +
      'Fair Value Gaps, Order Blocks, extreme funding. Returns detailed breakdown.',
    input_schema: {
      type: 'object' as const,
      properties: {
        asset: {
          type: 'string',
          enum: ['SOL-PERP', 'BTC-PERP'],
          description: 'The asset to analyze',
        },
        interval: {
          type: 'string',
          enum: ['1h', '4h', '1d'],
          description: 'Timeframe for technical analysis (default: 4h)',
        },
      },
      required: ['asset'],
    },
  },
  {
    name: 'calculate_position_size',
    description:
      'Calculate position size based on 1% risk rule. ' +
      'Returns position size, notional value, margin required, liquidation price, R:R ratio.',
    input_schema: {
      type: 'object' as const,
      properties: {
        asset: {
          type: 'string',
          enum: ['SOL-PERP', 'BTC-PERP'],
          description: 'The asset to trade',
        },
        entryPrice: {
          type: 'number',
          description: 'Desired entry price',
        },
        stopLoss: {
          type: 'number',
          description: 'Stop loss price',
        },
        target: {
          type: 'number',
          description: 'Take profit target price (optional)',
        },
        accountSize: {
          type: 'number',
          description: 'Total account size in USD (default: 50000)',
        },
        riskPercent: {
          type: 'number',
          description: 'Risk per trade as percentage (default: 1)',
        },
        leverage: {
          type: 'number',
          description: 'Leverage multiplier (default: 10)',
        },
      },
      required: ['asset', 'entryPrice', 'stopLoss'],
    },
  },
];

// ============================================
// TOOL IMPLEMENTATIONS
// ============================================

export async function executeTool(
  toolName: string,
  toolInput: any
): Promise<{ result: any; error?: string }> {
  try {
    switch (toolName) {
      case 'fetch_drift_data':
        return await fetchDriftData(toolInput);

      case 'calculate_confluence':
        return await calculateConfluence(toolInput);

      case 'calculate_position_size':
        return await calculatePositionSize(toolInput);

      default:
        return {
          result: null,
          error: `Unknown tool: ${toolName}`,
        };
    }
  } catch (error) {
    console.error(`❌ Tool execution error (${toolName}):`, error);
    return {
      result: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// TOOL FUNCTIONS
// ============================================

/**
 * Fetch real-time market data from Drift Protocol
 */
async function fetchDriftData(input: {
  asset: 'SOL-PERP' | 'BTC-PERP';
}): Promise<{ result: any }> {
  const { asset } = input;

  console.log(`🔧 Fetching Drift data for ${asset}...`);

  const data = await driftService.getMarketData(asset);

  return {
    result: {
      asset: data.asset,
      price: data.price,
      priceChange24h: data.price_change_24h_pct,
      volume24h: data.volume_24h,
      openInterest: data.open_interest,
      fundingRate: data.funding_rate,
      fundingRateAnnualized: data.funding_rate_annualized,
      nextFundingTime: data.next_funding_time,
      timestamp: data.last_update,
    },
  };
}

/**
 * Calculate confluence score for a setup
 */
async function calculateConfluence(input: {
  asset: 'SOL-PERP' | 'BTC-PERP';
  interval?: '1h' | '4h' | '1d';
}): Promise<{ result: any }> {
  const { asset, interval = '4h' } = input;

  console.log(`🔧 Calculating confluence for ${asset} (${interval})...`);

  // Fetch market data
  const marketData = await driftService.getMarketData(asset);

  // Fetch candles for technical analysis
  const candles = await driftService.getCandles(asset, interval, 100);

  // Calculate confluence
  const confluence = strategyEngine.calculateConfluence({
    asset,
    marketData,
    candles,
  });

  return {
    result: {
      score: confluence.score,
      conviction: confluence.score >= 5 ? 'HIGH' : confluence.score >= 4 ? 'MEDIUM' : 'LOW',
      factors: {
        rsi_oversold_bought: confluence.factors.rsi_oversold_bought,
        support_resistance: confluence.factors.support_resistance,
        oi_divergence: confluence.factors.oi_divergence,
        fvg_present: confluence.factors.fvg_present,
        order_block: confluence.factors.order_block,
        funding_extreme: confluence.factors.funding_extreme,
      },
      details: {
        rsi: confluence.details.rsi,
        supportLevels: confluence.details.support_levels,
        resistanceLevels: confluence.details.resistance_levels,
        fvgZones: confluence.details.fvg_zones,
        orderBlocks: confluence.details.order_blocks,
        fundingRate: confluence.details.funding_rate,
      },
      currentPrice: marketData.price,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Calculate position size based on risk management
 */
async function calculatePositionSize(input: {
  asset: 'SOL-PERP' | 'BTC-PERP';
  entryPrice: number;
  stopLoss: number;
  target?: number;
  accountSize?: number;
  riskPercent?: number;
  leverage?: number;
}): Promise<{ result: any }> {
  const {
    asset,
    entryPrice,
    stopLoss,
    target,
    accountSize = 50000,
    riskPercent = 1,
    leverage = 10,
  } = input;

  console.log(`🔧 Calculating position size for ${asset}...`);

  const position = strategyEngine.calculatePosition({
    entry_price: entryPrice,
    stop_loss: stopLoss,
    account_size: accountSize,
    risk_pct: riskPercent,
    leverage,
  });

  // Calculate R:R if target provided
  let rrRatio = null;
  if (target) {
    const risk = Math.abs(entryPrice - stopLoss);
    const reward = Math.abs(target - entryPrice);
    rrRatio = reward / risk;
  }

  // Direction for clarity
  const direction = entryPrice > stopLoss ? 'long' : 'short';

  return {
    result: {
      asset,
      direction,
      positionSize: position.position_size,
      positionSizeUsd: position.notional_value,
      marginRequired: position.margin_required,
      entryPrice,
      stopLoss,
      target: target || null,
      riskAmount: position.risk_amount_usd,
      rrRatio: rrRatio ? parseFloat(rrRatio.toFixed(2)) : null,
      leverage,
      liquidationPrice: position.liquidation_price,
      liquidationDistance: parseFloat(position.liquidation_distance_pct.toFixed(2)),
      isSafe: position.is_safe,
      warnings: [
        ...position.warnings,
        ...(rrRatio && rrRatio < 1.5 ? ['R:R ratio below 1.5:1 (not recommended)'] : []),
      ],
    },
  };
}
