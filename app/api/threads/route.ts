/**
 * /api/threads - Conversation Threads API
 *
 * GET endpoint for fetching conversation threads (for thread selector).
 *
 * Query Parameters:
 * - limit: number (optional, default: 10)
 *
 * Response:
 * {
 *   threads: [
 *     {
 *       id: 1,
 *       topic: "SOL at $138, is this a setup?",
 *       asset: "SOL-PERP",
 *       messageCount: 5,
 *       createdAt: "2025-01-27T10:00:00Z",
 *       updatedAt: "2025-01-27T10:05:00Z"
 *     }
 *   ]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { conversationsRepository } from '@/lib/db/repositories/conversations.repository';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Validate limit
    if (limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 50' },
        { status: 400 }
      );
    }

    // Fetch threads (repo method should exist or we create it)
    const threads = await conversationsRepository.getRecentThreads(limit);

    return NextResponse.json({
      threads,
      count: threads.length,
    });
  } catch (error) {
    console.error('❌ Threads API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to fetch threads',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
