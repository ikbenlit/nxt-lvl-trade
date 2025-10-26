/**
 * Claude Service Unit Tests
 *
 * Tests for ClaudeService skeleton (Fase 1.6):
 * - Message validation
 * - Cost calculation
 * - Error handling
 * - System prompt generation
 *
 * NOTE: Actual API calls are not tested here (require API key).
 * Integration tests with real API will be in Fase 2.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ClaudeService } from '../claude.service';
import type Anthropic from '@anthropic-ai/sdk';

describe('ClaudeService', () => {
  let service: ClaudeService;

  beforeEach(() => {
    service = new ClaudeService();
  });

  // ============================================
  // MESSAGE VALIDATION TESTS
  // ============================================

  describe('validateMessages', () => {
    it('should reject empty messages array', () => {
      const result = service.validateMessages([]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });

    it('should reject if first message is not from user', () => {
      const messages: Anthropic.MessageParam[] = [
        { role: 'assistant', content: 'Hello!' },
      ];

      const result = service.validateMessages(messages);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('First message must be from user');
    });

    it('should reject consecutive messages from same role', () => {
      const messages: Anthropic.MessageParam[] = [
        { role: 'user', content: 'Hello' },
        { role: 'user', content: 'Are you there?' }, // Invalid: two user messages
      ];

      const result = service.validateMessages(messages);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must alternate');
    });

    it('should accept valid alternating messages', () => {
      const messages: Anthropic.MessageParam[] = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How are you?' },
      ];

      const result = service.validateMessages(messages);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept single user message', () => {
      const messages: Anthropic.MessageParam[] = [
        { role: 'user', content: 'Hello' },
      ];

      const result = service.validateMessages(messages);
      expect(result.valid).toBe(true);
    });

    it('should accept user-assistant-user pattern', () => {
      const messages: Anthropic.MessageParam[] = [
        { role: 'user', content: 'What is SOL price?' },
        { role: 'assistant', content: 'Let me check...' },
        { role: 'user', content: 'Thanks!' },
        { role: 'assistant', content: 'You\'re welcome!' },
      ];

      const result = service.validateMessages(messages);
      expect(result.valid).toBe(true);
    });
  });

  // ============================================
  // COST CALCULATION TESTS
  // ============================================

  describe('calculateCost', () => {
    it('should calculate cost correctly for input tokens', () => {
      const usage = {
        input_tokens: 1000,
        output_tokens: 0,
      };

      const cost = service.calculateCost(usage);

      // 1000 tokens = 0.001M tokens
      // 0.001M * $3 = $0.003
      expect(cost.input_cost).toBeCloseTo(0.003, 6);
      expect(cost.output_cost).toBe(0);
      expect(cost.total_cost).toBeCloseTo(0.003, 6);
    });

    it('should calculate cost correctly for output tokens', () => {
      const usage = {
        input_tokens: 0,
        output_tokens: 1000,
      };

      const cost = service.calculateCost(usage);

      // 1000 tokens = 0.001M tokens
      // 0.001M * $15 = $0.015
      expect(cost.input_cost).toBe(0);
      expect(cost.output_cost).toBe(0.015);
      expect(cost.total_cost).toBe(0.015);
    });

    it('should calculate total cost correctly', () => {
      const usage = {
        input_tokens: 2000,
        output_tokens: 500,
      };

      const cost = service.calculateCost(usage);

      // Input: 2000 * ($3 / 1M) = $0.006
      // Output: 500 * ($15 / 1M) = $0.0075
      // Total: $0.0135
      expect(cost.input_cost).toBe(0.006);
      expect(cost.output_cost).toBe(0.0075);
      expect(cost.total_cost).toBe(0.0135);
    });

    it('should handle large token counts', () => {
      const usage = {
        input_tokens: 100000, // 100k tokens
        output_tokens: 50000, // 50k tokens
      };

      const cost = service.calculateCost(usage);

      // Input: 100k * ($3 / 1M) = $0.30
      // Output: 50k * ($15 / 1M) = $0.75
      // Total: $1.05
      expect(cost.input_cost).toBeCloseTo(0.3, 2);
      expect(cost.output_cost).toBeCloseTo(0.75, 2);
      expect(cost.total_cost).toBeCloseTo(1.05, 2);
    });

    it('should handle zero tokens', () => {
      const usage = {
        input_tokens: 0,
        output_tokens: 0,
      };

      const cost = service.calculateCost(usage);

      expect(cost.input_cost).toBe(0);
      expect(cost.output_cost).toBe(0);
      expect(cost.total_cost).toBe(0);
    });

    it('should calculate realistic conversation cost', () => {
      // Typical conversation: ~1500 input, ~800 output
      const usage = {
        input_tokens: 1500,
        output_tokens: 800,
      };

      const cost = service.calculateCost(usage);

      // Input: 1500 * ($3 / 1M) = $0.0045
      // Output: 800 * ($15 / 1M) = $0.012
      // Total: $0.0165 (~1.7 cents)
      expect(cost.total_cost).toBeCloseTo(0.0165, 4);
    });
  });

  // ============================================
  // SYSTEM PROMPT TESTS
  // ============================================

  describe('getSystemPrompt', () => {
    it('should generate system prompt without asset context', () => {
      // @ts-expect-error - accessing private method for testing
      const prompt = service.getSystemPrompt();

      expect(prompt).toContain('trading assistant');
      expect(prompt).toContain('Drift Protocol');
      expect(prompt).toContain('SOL-PERP');
      expect(prompt).toContain('BTC-PERP');
      expect(prompt).toContain('1% risk');
      expect(prompt).not.toContain('Current context');
    });

    it('should include asset context when provided', () => {
      // @ts-expect-error - accessing private method for testing
      const prompt = service.getSystemPrompt('SOL-PERP');

      expect(prompt).toContain('Current context: User is asking about SOL-PERP');
    });

    it('should include all key principles', () => {
      // @ts-expect-error - accessing private method for testing
      const prompt = service.getSystemPrompt();

      expect(prompt).toContain('Objectivity');
      expect(prompt).toContain('Risk Management');
      expect(prompt).toContain('Confluence-Based');
      expect(prompt).toContain('Transparency');
      expect(prompt).toContain('Learning-Oriented');
    });

    it('should include trading context details', () => {
      // @ts-expect-error - accessing private method for testing
      const prompt = service.getSystemPrompt();

      expect(prompt).toContain('3-5 quality setups per week');
      expect(prompt).toContain('minimum 1.5:1');
      expect(prompt).toContain('4+ confluence factors');
    });

    it('should mention lack of tools in skeleton version', () => {
      // @ts-expect-error - accessing private method for testing
      const prompt = service.getSystemPrompt();

      expect(prompt).toContain("don't have access to real-time market data");
    });
  });

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================

  describe('handleError', () => {
    it('should handle rate limit error (429)', () => {
      // Mock Anthropic.APIError
      class MockAPIError extends Error {
        status: number;
        constructor(message: string, status: number) {
          super(message);
          this.name = 'APIError';
          this.status = status;
          // Make instanceof work
          Object.setPrototypeOf(this, MockAPIError.prototype);
        }
      }

      const apiError = new MockAPIError('Rate limit exceeded', 429);

      // @ts-expect-error - accessing private method for testing
      const error = service.handleError(apiError);

      expect(error.message).toContain('rate limit');
      expect(error.message).toContain('wait a moment');
    });

    it('should handle authentication error (401)', () => {
      class MockAPIError extends Error {
        status: number;
        constructor(message: string, status: number) {
          super(message);
          this.name = 'APIError';
          this.status = status;
          Object.setPrototypeOf(this, MockAPIError.prototype);
        }
      }

      const apiError = new MockAPIError('Invalid API key', 401);

      // @ts-expect-error - accessing private method for testing
      const error = service.handleError(apiError);

      expect(error.message).toContain('Invalid Claude API key');
      expect(error.message).toContain('ANTHROPIC_API_KEY');
    });

    it('should handle overloaded error (529)', () => {
      class MockAPIError extends Error {
        status: number;
        constructor(message: string, status: number) {
          super(message);
          this.name = 'APIError';
          this.status = status;
          Object.setPrototypeOf(this, MockAPIError.prototype);
        }
      }

      const apiError = new MockAPIError('Overloaded', 529);

      // @ts-expect-error - accessing private method for testing
      const error = service.handleError(apiError);

      expect(error.message).toContain('temporarily overloaded');
    });

    it('should handle generic API error', () => {
      class MockAPIError extends Error {
        status: number;
        constructor(message: string, status: number) {
          super(message);
          this.name = 'APIError';
          this.status = status;
          Object.setPrototypeOf(this, MockAPIError.prototype);
        }
      }

      const apiError = new MockAPIError('Internal server error', 500);

      // @ts-expect-error - accessing private method for testing
      const error = service.handleError(apiError);

      expect(error.message).toContain('Claude API error');
      expect(error.message).toContain('500');
    });

    it('should handle regular Error instance', () => {
      const regularError = new Error('Network timeout');

      // @ts-expect-error - accessing private method for testing
      const error = service.handleError(regularError);

      expect(error.message).toBe('Network timeout');
    });

    it('should handle unknown error types', () => {
      const unknownError = 'some string error';

      // @ts-expect-error - accessing private method for testing
      const error = service.handleError(unknownError);

      expect(error.message).toContain('Unknown error');
    });
  });

  // ============================================
  // CONFIGURATION TESTS
  // ============================================

  describe('configuration', () => {
    it('should create service even without API key', () => {
      // Service should be instantiable even without API key
      // It will warn, but not throw
      const service = new ClaudeService();

      expect(service).toBeDefined();
      expect(service.validateMessages).toBeDefined();
      expect(service.calculateCost).toBeDefined();
    });
  });
});
