/**
 * useChat Hook - Client-side chat with SSE streaming
 *
 * Handles:
 * - Sending messages to /api/chat
 * - Receiving SSE stream events
 * - Managing message state
 * - Error handling
 * - Loading states
 */

'use client';

import { useState, useCallback, useRef } from 'react';

// ============================================
// TYPES
// ============================================

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  error?: string;
}

interface UseChatOptions {
  threadId?: number | null;
  asset?: 'SOL-PERP' | 'BTC-PERP';
  onError?: (error: Error) => void;
}

interface SSEEvent {
  type: 'chunk' | 'done' | 'error';
  content?: string;
  error?: string;
  threadId?: number;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  cost?: {
    input: string;
    output: string;
    total: string;
  };
  model?: string;
}

// ============================================
// HOOK
// ============================================

export function useChat(options: UseChatOptions = {}) {
  const { threadId: initialThreadId, asset, onError } = options;

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<number | null>(initialThreadId || null);
  const [usage, setUsage] = useState<{ inputTokens: number; outputTokens: number; cost: string } | null>(null);

  // Abort controller for cancelling streams
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Send a message to Claude via /api/chat
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      // Abort any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      // Add user message immediately
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // Prepare assistant message
      const assistantMessageId = `assistant-${Date.now()}`;
      let assistantContent = '';

      try {
        // Make SSE request
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: content.trim(),
            threadId,
            asset,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to send message');
        }

        // Read SSE stream
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No response body');
        }

        // Add streaming assistant message
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isStreaming: true,
          },
        ]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Decode chunk
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6); // Remove "data: " prefix
              if (!jsonStr.trim()) continue;

              try {
                const event: SSEEvent = JSON.parse(jsonStr);

                if (event.type === 'chunk') {
                  // Append chunk to content
                  assistantContent += event.content || '';

                  // Update message with new content
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: assistantContent, isStreaming: true }
                        : msg
                    )
                  );
                } else if (event.type === 'done') {
                  // Finalize message
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, isStreaming: false }
                        : msg
                    )
                  );

                  // Update thread ID if new
                  if (event.threadId && !threadId) {
                    setThreadId(event.threadId);
                  }

                  // Track usage
                  if (event.usage && event.cost) {
                    setUsage({
                      inputTokens: event.usage.inputTokens,
                      outputTokens: event.usage.outputTokens,
                      cost: event.cost.total,
                    });
                  }
                } else if (event.type === 'error') {
                  // Handle error
                  throw new Error(event.error || 'Unknown error');
                }
              } catch (parseError) {
                console.error('Failed to parse SSE event:', parseError);
              }
            }
          }
        }
      } catch (error) {
        console.error('Chat error:', error);

        // Add error to assistant message if streaming started
        if (assistantContent.length > 0) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    isStreaming: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                  }
                : msg
            )
          );
        } else {
          // Add new error message
          const errorMessage: Message = {
            id: assistantMessageId,
            role: 'assistant',
            content: 'Sorry, I encountered an error. Please try again.',
            timestamp: new Date(),
            error: error instanceof Error ? error.message : 'Unknown error',
          };
          setMessages((prev) => [...prev, errorMessage]);
        }

        // Call error callback
        if (onError && error instanceof Error) {
          onError(error);
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [threadId, asset, onError]
  );

  /**
   * Cancel ongoing request
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear chat history (client-side only, doesn't delete from DB)
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    threadId,
    usage,
    sendMessage,
    cancel,
    clearMessages,
  };
}
