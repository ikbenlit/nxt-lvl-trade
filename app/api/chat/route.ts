/**
 * /api/chat - Chat API Route
 *
 * POST endpoint for conversational AI with Claude.
 * Supports Server-Sent Events (SSE) streaming for real-time responses.
 *
 * Features:
 * - Streaming responses via SSE
 * - Message persistence to database
 * - Thread management (create/resume conversations)
 * - Error handling with graceful degradation
 * - Usage tracking (tokens, cost)
 *
 * Request Body:
 * {
 *   "message": "SOL at $138, is this a setup?",
 *   "threadId": null,  // or existing thread ID to continue conversation
 *   "asset": "SOL-PERP" // optional context
 * }
 *
 * Response: SSE stream with events:
 * - "message" → text chunks
 * - "done" → final message with usage stats
 * - "error" → error details
 */

import { NextRequest } from 'next/server';
import { claudeService } from '@/lib/services/claude.service';
import { conversationsRepository } from '@/lib/db/repositories/conversations.repository';

// ============================================
// REQUEST TYPES
// ============================================

interface ChatRequest {
  message: string;
  threadId?: number | null;
  asset?: 'SOL-PERP' | 'BTC-PERP';
}

// ============================================
// POST HANDLER
// ============================================

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body: ChatRequest = await req.json();
    const { message, threadId, asset } = body;

    // Validate input
    if (!message || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Message cannot be empty' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (message.length > 500) {
      return new Response(
        JSON.stringify({ error: 'Message exceeds 500 character limit' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get or create thread
    let currentThreadId = threadId;
    if (!currentThreadId) {
      // Create new thread
      const topic = message.slice(0, 50) + (message.length > 50 ? '...' : '');
      const newThread = await conversationsRepository.createThread({
        topic,
        asset: asset || null,
      });
      currentThreadId = newThread.id;
    }

    // Get conversation history
    const history = await conversationsRepository.getMessagesByThread(currentThreadId);

    // Build Claude messages array (must alternate user/assistant)
    const claudeMessages = history.map((msg: any) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // Add new user message
    claudeMessages.push({
      role: 'user' as const,
      content: message,
    });

    // Validate message format
    const validation = claudeService.validateMessages(claudeMessages);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Save user message to DB
    await conversationsRepository.addMessage({
      threadId: currentThreadId,
      role: 'user',
      content: message,
    });

    // Create SSE stream
    const encoder = new TextEncoder();
    let fullResponse = '';
    let inputTokens = 0;
    let outputTokens = 0;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Call Claude with streaming
          const response = await claudeService.chat({
            messages: claudeMessages,
            asset,
            stream: true,
            onStream: (chunk: string) => {
              // Send SSE event
              fullResponse += chunk;
              const event = `data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`;
              controller.enqueue(encoder.encode(event));
            },
          });

          inputTokens = response.usage.input_tokens;
          outputTokens = response.usage.output_tokens;

          // Save assistant message to DB
          await conversationsRepository.addMessage({
            threadId: currentThreadId!,
            role: 'assistant',
            content: fullResponse,
            model: response.model,
            tokensUsed: inputTokens + outputTokens,
          });

          // Calculate cost
          const cost = claudeService.calculateCost(response.usage);

          // Send "done" event with metadata
          const doneEvent = `data: ${JSON.stringify({
            type: 'done',
            threadId: currentThreadId,
            usage: {
              inputTokens,
              outputTokens,
              totalTokens: inputTokens + outputTokens,
            },
            cost: {
              input: cost.input_cost.toFixed(4),
              output: cost.output_cost.toFixed(4),
              total: cost.total_cost.toFixed(4),
            },
            model: response.model,
          })}\n\n`;
          controller.enqueue(encoder.encode(doneEvent));

          // Close stream
          controller.close();
        } catch (error) {
          console.error('❌ Chat API error:', error);

          // Send error event
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const errorEvent = `data: ${JSON.stringify({
            type: 'error',
            error: errorMessage,
          })}\n\n`;
          controller.enqueue(encoder.encode(errorEvent));

          // Close stream
          controller.close();
        }
      },
    });

    // Return SSE response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('❌ Chat API error:', error);

    // Return JSON error for non-streaming failures
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ============================================
// GET HANDLER (Health Check)
// ============================================

export async function GET() {
  return new Response(
    JSON.stringify({
      status: 'ok',
      endpoint: '/api/chat',
      methods: ['POST'],
      description: 'Chat with Claude AI (streaming)',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
