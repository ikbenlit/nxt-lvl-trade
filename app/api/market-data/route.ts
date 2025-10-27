/**
 * /api/market-data - Market Data API Route
 *
 * GET endpoint for real-time market data (price, confluence, OI, funding).
 * Used by Context Sidebar for live updates.
 *
 * Query Parameters:
 * - asset: 'SOL-PERP' | 'BTC-PERP' (required)
 * - interval: '1h' | '4h' | '1d' (optional, default: '4h')
 *
 * Response:
 * {
 *   asset: 'SOL-PERP',
 *   price: 138.20,
 *   priceChange24h: -3.2,
 *   volume24h: 1234567,
 *   openInterest: 123456,
 *   fundingRate: -0.0023,
 *   confluence: {
 *     score: 5,
 *     conviction: 'HIGH',
 *     factors: { rsi_oversold_bought: true, ... }
 *   },
 *   timestamp: '2025-01-27T10:30:00Z'
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { driftService } from '@/lib/services/drift.service';
import { strategyEngine } from '@/lib/services/strategy-engine.service';

export const dynamic = 'force-dynamic'; // Disable caching (always fetch fresh)

export async function GET(req: NextRequest) {
  try {
    // Parse query params
    const { searchParams } = req.nextUrl;
    const asset = searchParams.get('asset') as 'SOL-PERP' | 'BTC-PERP' | null;
    const interval = (searchParams.get('interval') as '1h' | '4h' | '1d') || '4h';

    // Validate asset
    if (!asset || !['SOL-PERP', 'BTC-PERP'].includes(asset)) {
      return NextResponse.json(
        { error: 'Invalid or missing asset parameter. Must be SOL-PERP or BTC-PERP.' },
        { status: 400 }
      );
    }

    // Fetch market data from Drift
    const marketData = await driftService.getMarketData(asset);

    // Fetch candles for confluence calculation
    const candles = await driftService.getCandles(asset, interval, 100);

    // Calculate confluence
    const confluence = strategyEngine.calculateConfluence({
      asset,
      marketData,
      candles,
    });

    // Build response
    const response = {
      asset: marketData.asset,
      price: marketData.price,
      priceChange24h: marketData.price_change_24h_pct,
      volume24h: marketData.volume_24h,
      openInterest: marketData.open_interest,
      openInterestUsd: marketData.open_interest * marketData.price,
      fundingRate: marketData.funding_rate,
      fundingRateAnnualized: marketData.funding_rate_annualized,
      nextFundingTime: marketData.next_funding_time,
      confluence: {
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
      },
      timestamp: new Date().toISOString(),
      interval,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, max-age=0', // Don't cache (data changes rapidly)
      },
    });
  } catch (error) {
    console.error('❌ Market data API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to fetch market data',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
