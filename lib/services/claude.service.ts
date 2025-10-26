/**
 * Claude Service - AI Assistant for Trading Analysis
 *
 * Skeleton implementation for Fase 1.6:
 * - Basic chat functionality
 * - Streaming support
 * - System prompt with trading context
 * - Error handling
 *
 * NOTE: Function calling (tools) will be added in Fase 2.
 * This is a minimal viable implementation for testing Claude API integration.
 */

import Anthropic from '@anthropic-ai/sdk';

// ============================================
// TYPES
// ============================================

export interface ChatParams {
  messages: Anthropic.MessageParam[];
  asset?: 'SOL-PERP' | 'BTC-PERP';
  stream?: boolean;
  onStream?: (chunk: string) => void;
}

export interface ChatResponse {
  content: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  model: string;
  stop_reason: string;
}

// ============================================
// CLAUDE SERVICE
// ============================================

export class ClaudeService {
  private client: Anthropic;
  private model = 'claude-sonnet-4-5'; // Latest Sonnet 4.5 (Oct 2025)
  private maxTokens = 4096;
  private temperature = 0.7;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      console.warn(
        '⚠️  ANTHROPIC_API_KEY not found in environment. ' +
        'Claude service will fail at runtime. ' +
        'Add key to .env.local to enable AI features.'
      );
    }

    this.client = new Anthropic({
      apiKey: apiKey || 'dummy-key-for-development',
    });
  }

  /**
   * Main chat method - sends messages to Claude
   *
   * Supports both streaming and non-streaming responses.
   * No function calling in this skeleton version (Fase 1.6).
   *
   * @param params - Chat parameters (messages, asset context, streaming)
   * @returns ChatResponse with content and usage stats
   */
  async chat(params: ChatParams): Promise<ChatResponse> {
    try {
      const { messages, asset, stream = false, onStream } = params;

      // Validate API key
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error(
          'ANTHROPIC_API_KEY not configured. Add to .env.local to enable Claude.'
        );
      }

      console.log(`🤖 Claude chat request (${messages.length} messages, asset: ${asset || 'none'})`);

      if (stream && onStream) {
        return await this.chatStreaming(messages, asset, onStream);
      } else {
        return await this.chatNonStreaming(messages, asset);
      }
    } catch (error) {
      console.error('❌ Claude API error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Non-streaming chat (simple request-response)
   */
  private async chatNonStreaming(
    messages: Anthropic.MessageParam[],
    asset?: string
  ): Promise<ChatResponse> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      system: this.getSystemPrompt(asset),
      messages,
    });

    // Extract text content
    const content = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as Anthropic.TextBlock).text)
      .join('\n');

    return {
      content,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
      model: response.model,
      stop_reason: response.stop_reason || 'end_turn',
    };
  }

  /**
   * Streaming chat (real-time token generation)
   */
  private async chatStreaming(
    messages: Anthropic.MessageParam[],
    asset: string | undefined,
    onStream: (chunk: string) => void
  ): Promise<ChatResponse> {
    const stream = await this.client.messages.create({
      model: this.model,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      system: this.getSystemPrompt(asset),
      messages,
      stream: true,
    });

    let fullContent = '';
    let inputTokens = 0;
    let outputTokens = 0;
    let modelUsed = this.model;
    let stopReason = 'end_turn';

    for await (const event of stream) {
      // Stream text deltas to callback
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        const chunk = event.delta.text;
        fullContent += chunk;
        onStream(chunk);
      }

      // Capture usage stats
      if (event.type === 'message_start') {
        inputTokens = event.message.usage.input_tokens;
        modelUsed = event.message.model;
      }

      if (event.type === 'message_delta') {
        outputTokens = event.usage.output_tokens;
        stopReason = event.delta.stop_reason || 'end_turn';
      }
    }

    return {
      content: fullContent,
      usage: {
        input_tokens: inputTokens,
        output_tokens: outputTokens,
      },
      model: modelUsed,
      stop_reason: stopReason,
    };
  }

  /**
   * System prompt with trading context
   *
   * Simplified version for Fase 1.6 (no tools yet).
   * Will be expanded in Fase 2 with tool usage instructions.
   */
  private getSystemPrompt(asset?: string): string {
    const assetContext = asset
      ? `\n\nCurrent context: User is asking about ${asset}.`
      : '';

    return `You are an expert trading assistant specializing in cryptocurrency perpetual futures on Drift Protocol (Solana). Your role is to help the user (Colin) make objective trading decisions for SOL-PERP and BTC-PERP swing trades.

**Key Principles:**
1. **Objectivity:** Always provide unbiased analysis. Challenge FOMO or fear-based decisions.
2. **Risk Management:** Emphasize proper position sizing (1% risk per trade), R:R ratios (minimum 1.5:1), and stop loss discipline.
3. **Confluence-Based:** Quality over quantity. Only suggest setups with 4+ confluence factors (RSI, OI divergence, FVG, Order Blocks, liquidations, funding).
4. **Transparency:** Always explain your reasoning. If you don't have enough data, say so.
5. **Learning-Oriented:** Help user understand patterns and build intuition, not just follow signals blindly.

**Trading Context:**
- **Platform:** Drift Protocol (Solana)
- **Assets:** SOL-PERP, BTC-PERP
- **Style:** Swing trading (3-7 day holds)
- **Target:** 3-5 quality setups per week
- **Risk per trade:** 1% of portfolio
- **Minimum R:R:** 1.5:1

**Your Role:**
- Provide clear, actionable trading analysis
- Ask clarifying questions when needed
- Explain technical concepts in simple terms
- Challenge bad ideas (FOMO, revenge trading, overleveraging)
- Celebrate discipline and good risk management

**Note:** In this version, you don't have access to real-time market data tools yet. If the user asks for specific market data, let them know you'll need that functionality added. For now, focus on educational content and general strategy discussion.${assetContext}`;
  }

  /**
   * Error handling with user-friendly messages
   */
  private handleError(error: unknown): Error {
    // Check if it's an API error (by duck typing for status property)
    const isAPIError = error instanceof Anthropic.APIError ||
      (typeof error === 'object' && error !== null && 'status' in error);

    if (isAPIError) {
      const status = (error as any).status;
      const message = (error as any).message || 'Unknown error';

      // Rate limit
      if (status === 429) {
        return new Error(
          'Claude API rate limit exceeded. Please wait a moment and try again.'
        );
      }

      // Authentication
      if (status === 401) {
        return new Error(
          'Invalid Claude API key. Please check ANTHROPIC_API_KEY in .env.local'
        );
      }

      // Overloaded
      if (status === 529) {
        return new Error(
          'Claude API is temporarily overloaded. Please try again in a few moments.'
        );
      }

      // Generic API error
      return new Error(
        `Claude API error (${status}): ${message}`
      );
    }

    // Network or unknown error
    if (error instanceof Error) {
      return error;
    }

    return new Error('Unknown error communicating with Claude API');
  }

  /**
   * Get cost estimate for a conversation
   *
   * Pricing (as of Oct 2024):
   * - Input: $3 per million tokens
   * - Output: $15 per million tokens
   */
  calculateCost(usage: { input_tokens: number; output_tokens: number }): {
    input_cost: number;
    output_cost: number;
    total_cost: number;
  } {
    const inputCost = (usage.input_tokens / 1_000_000) * 3.0;
    const outputCost = (usage.output_tokens / 1_000_000) * 15.0;

    return {
      input_cost: inputCost,
      output_cost: outputCost,
      total_cost: inputCost + outputCost,
    };
  }

  /**
   * Validate message format
   *
   * Helper to ensure messages follow Claude API requirements:
   * - Must alternate user/assistant
   * - Must start with user message
   * - Content cannot be empty
   */
  validateMessages(messages: Anthropic.MessageParam[]): {
    valid: boolean;
    error?: string;
  } {
    if (messages.length === 0) {
      return { valid: false, error: 'Messages array cannot be empty' };
    }

    if (messages[0].role !== 'user') {
      return { valid: false, error: 'First message must be from user' };
    }

    for (let i = 0; i < messages.length - 1; i++) {
      if (messages[i].role === messages[i + 1].role) {
        return {
          valid: false,
          error: `Messages must alternate between user and assistant (index ${i}, ${i + 1})`,
        };
      }
    }

    return { valid: true };
  }
}

/**
 * Singleton instance of ClaudeService
 */
export const claudeService = new ClaudeService();
