/**
 * /api/threads/[id] - Single Thread API
 *
 * GET endpoint for fetching a specific thread with all its messages.
 *
 * Response:
 * {
 *   thread: { id, topic, asset, createdAt, updatedAt },
 *   messages: [
 *     { id, role, content, timestamp, tokensUsed, toolsUsed }
 *   ]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { conversationsRepository } from '@/lib/db/repositories/conversations.repository';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const threadId = parseInt(id, 10);

    if (isNaN(threadId)) {
      return NextResponse.json(
        { error: 'Invalid thread ID' },
        { status: 400 }
      );
    }

    // Fetch thread with messages
    const result = await conversationsRepository.getThreadWithMessages(threadId);

    if (!result) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Thread fetch API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to fetch thread',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
