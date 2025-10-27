/**
 * /api/trades - Trade CRUD API
 *
 * POST   - Create new trade
 * GET    - Get all trades (with filters)
 */

import { NextRequest, NextResponse } from 'next/server';
import { tradesRepository } from '@/lib/db/repositories';
import { type NewTrade } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/trades
 * Create a new trade
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.asset || !['SOL-PERP', 'BTC-PERP'].includes(body.asset)) {
      return NextResponse.json(
        { error: 'Invalid asset. Must be SOL-PERP or BTC-PERP' },
        { status: 400 }
      );
    }

    if (!body.direction || !['long', 'short'].includes(body.direction)) {
      return NextResponse.json(
        { error: 'Invalid direction. Must be long or short' },
        { status: 400 }
      );
    }

    if (!body.entryPrice || typeof body.entryPrice !== 'number' || body.entryPrice <= 0) {
      return NextResponse.json(
        { error: 'Invalid entryPrice. Must be a positive number' },
        { status: 400 }
      );
    }

    if (!body.stopLoss || typeof body.stopLoss !== 'number' || body.stopLoss <= 0) {
      return NextResponse.json(
        { error: 'Invalid stopLoss. Must be a positive number' },
        { status: 400 }
      );
    }

    if (!body.entrySize || typeof body.entrySize !== 'number' || body.entrySize <= 0) {
      return NextResponse.json(
        { error: 'Invalid entrySize. Must be a positive number' },
        { status: 400 }
      );
    }

    // Validate long/short direction vs stop loss
    if (body.direction === 'long' && body.stopLoss >= body.entryPrice) {
      return NextResponse.json(
        { error: 'For long trades, stop loss must be below entry price' },
        { status: 400 }
      );
    }

    if (body.direction === 'short' && body.stopLoss <= body.entryPrice) {
      return NextResponse.json(
        { error: 'For short trades, stop loss must be above entry price' },
        { status: 400 }
      );
    }

    // Build trade object
    const newTrade: NewTrade = {
      asset: body.asset,
      direction: body.direction,
      entryPrice: body.entryPrice,
      entryTimestamp: new Date(),
      entrySize: body.entrySize,
      leverage: body.leverage || 10,
      stopLoss: body.stopLoss,
      target1: body.target1 || null,
      target2: body.target2 || null,
      target3: body.target3 || null,
      confluenceScore: body.confluenceScore || null,
      confluenceFactors: body.confluenceFactors || null,
      userReasoning: body.userReasoning || null,
      emotionalNotes: body.emotionalNotes || null,
      claudeSetupAnalysis: body.claudeSetupAnalysis || null,
      claudeConfidence: body.claudeConfidence || null,
      marketContext: body.marketContext || null,
      status: 'open',
    };

    // Save to database
    const trade = await tradesRepository.create(newTrade);

    return NextResponse.json(
      {
        success: true,
        trade,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating trade:', error);
    return NextResponse.json(
      { error: 'Failed to create trade' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/trades
 * Get all trades with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const asset = searchParams.get('asset') as 'SOL-PERP' | 'BTC-PERP' | null;
    const status = searchParams.get('status') as 'open' | 'closed' | 'cancelled' | null;
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!)
      : undefined;
    const offset = searchParams.get('offset')
      ? parseInt(searchParams.get('offset')!)
      : undefined;

    const trades = await tradesRepository.getAll({
      asset: asset || undefined,
      status: status || undefined,
      limit,
      offset,
      orderBy: 'entryTimestamp',
      orderDirection: 'desc',
    });

    return NextResponse.json({ trades });
  } catch (error) {
    console.error('Error fetching trades:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trades' },
      { status: 500 }
    );
  }
}
