/**
 * /api/chat - Chat API Route with Function Calling
 *
 * POST endpoint for conversational AI with Claude + tool execution.
 * Supports Server-Sent Events (SSE) streaming for real-time responses.
 *
 * Features:
 * - Streaming responses via SSE
 * - Claude function calling (3 tools: fetch_drift_data, calculate_confluence, calculate_position_size)
 * - Message persistence to database
 * - Thread management (create/resume conversations)
 * - Tool execution status updates
 * - Error handling with graceful degradation
 *
 * Request Body:
 * {
 *   "message": "SOL at $138, is this a setup?",
 *   "threadId": null,  // or existing thread ID to continue conversation
 *   "asset": "SOL-PERP" // optional context
 * }
 *
 * Response: SSE stream with events:
 * - "tool_use" → tool execution started (name, status)
 * - "tool_result" → tool execution completed
 * - "chunk" → text chunks
 * - "done" → final message with usage stats
 * - "error" → error details
 */

import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { claudeService } from '@/lib/services/claude.service';
import { conversationsRepository } from '@/lib/db/repositories/conversations.repository';
import { tools, executeTool } from '@/lib/tools';

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
    const claudeMessages: Anthropic.MessageParam[] = history.map((msg: any) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // Add new user message
    claudeMessages.push({
      role: 'user' as const,
      content: message,
    });

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
    const toolsExecuted: any[] = [];

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Initialize Anthropic client
          const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY || '',
          });

          // Function calling loop
          let continueLoop = true;
          let currentMessages = [...claudeMessages];

          while (continueLoop) {
            // Call Claude with tools
            const response = await anthropic.messages.create({
              model: 'claude-sonnet-4-5',
              max_tokens: 4096,
              temperature: 0.7,
              system: getSystemPrompt(asset),
              messages: currentMessages,
              tools,
            });

            inputTokens += response.usage.input_tokens;
            outputTokens += response.usage.output_tokens;

            // Process response content
            for (const block of response.content) {
              if (block.type === 'text') {
                // Stream text to client
                fullResponse += block.text;
                const event = `data: ${JSON.stringify({ type: 'chunk', content: block.text })}\n\n`;
                controller.enqueue(encoder.encode(event));
              } else if (block.type === 'tool_use') {
                // Tool execution
                const toolName = block.name;
                const toolInput = block.input;

                console.log(`🔧 Executing tool: ${toolName}`, toolInput);

                // Send tool_use event to client
                const toolUseEvent = `data: ${JSON.stringify({
                  type: 'tool_use',
                  toolName,
                  status: 'running',
                })}\n\n`;
                controller.enqueue(encoder.encode(toolUseEvent));

                // Execute tool
                const { result, error } = await executeTool(toolName, toolInput);

                // Track tool execution
                toolsExecuted.push({
                  name: toolName,
                  input: toolInput,
                  output: result || error,
                });

                // Send tool_result event to client
                const toolResultEvent = `data: ${JSON.stringify({
                  type: 'tool_result',
                  toolName,
                  status: error ? 'error' : 'completed',
                  result: error ? null : result,
                  error,
                })}\n\n`;
                controller.enqueue(encoder.encode(toolResultEvent));

                // Add tool result to conversation
                currentMessages.push({
                  role: 'assistant',
                  content: response.content,
                });

                currentMessages.push({
                  role: 'user',
                  content: [
                    {
                      type: 'tool_result',
                      tool_use_id: block.id,
                      content: error ? `Error: ${error}` : JSON.stringify(result),
                    },
                  ],
                });
              }
            }

            // Check if we should continue the loop
            if (response.stop_reason === 'end_turn') {
              continueLoop = false;
            } else if (response.stop_reason === 'tool_use') {
              // Continue loop to get Claude's response after tool execution
              continueLoop = true;
            } else {
              continueLoop = false;
            }
          }

          // Save assistant message to DB
          await conversationsRepository.addMessage({
            threadId: currentThreadId!,
            role: 'assistant',
            content: fullResponse,
            model: 'claude-sonnet-4-5',
            tokensUsed: inputTokens + outputTokens,
            toolsUsed: toolsExecuted.length > 0 ? toolsExecuted : undefined,
          });

          // Calculate cost
          const cost = claudeService.calculateCost({ input_tokens: inputTokens, output_tokens: outputTokens });

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
            model: 'claude-sonnet-4-5',
            toolsUsed: toolsExecuted.map(t => t.name),
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
// HELPER FUNCTIONS
// ============================================

function getSystemPrompt(asset?: string): string {
  const assetContext = asset
    ? `\n\nCurrent context: User is asking about ${asset}.`
    : '';

  return `You are an expert trading assistant specializing in cryptocurrency perpetual futures on Drift Protocol (Solana). Your role is to help the user (Colin) make objective trading decisions for SOL-PERP and BTC-PERP swing trades.

**Key Principles:**
1. **Objectivity:** Always provide unbiased analysis. Challenge FOMO or fear-based decisions.
2. **Risk Management:** Emphasize proper position sizing (1% risk per trade), R:R ratios (minimum 1.5:1), and stop loss discipline.
3. **Confluence-Based:** Quality over quantity. Only suggest setups with 4+ confluence factors.
4. **Transparency:** Always explain your reasoning. Use tools to fetch real data.
5. **Learning-Oriented:** Help user understand patterns, not just follow signals.

**Trading Context:**
- **Platform:** Drift Protocol (Solana)
- **Assets:** SOL-PERP, BTC-PERP
- **Style:** Swing trading (3-7 day holds)
- **Risk per trade:** 1% of portfolio
- **Minimum R:R:** 1.5:1

**Available Tools:**
- **fetch_drift_data**: Get current price, funding, OI, volume for an asset
- **calculate_confluence**: Analyze setup quality (0-6 score) with RSI, S/R, FVG, OB, OI divergence, funding
- **calculate_position_size**: Calculate position sizing with 1% risk rule, R:R, liquidation price

**Your Role:**
- Use tools to fetch real-time data before giving advice
- Provide clear, actionable trading analysis
- Challenge bad ideas (FOMO, overleveraging)
- Celebrate discipline and good risk management${assetContext}`;
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
      description: 'Chat with Claude AI (streaming + function calling)',
      tools: tools.map(t => t.name),
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
