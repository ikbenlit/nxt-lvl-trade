/**
 * MessageList Component
 *
 * Scrollable container for chat messages.
 * Automatically scrolls to bottom when new messages arrive.
 *
 * Features:
 * - Auto-scroll to latest message
 * - Scroll to top to load more (future: pagination)
 * - Loading skeleton for initial load
 * - Empty state when no messages
 */

'use client';

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble, MessageBubbleProps } from './MessageBubble';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  toolUse?: {
    name: string;
    status: 'running' | 'completed' | 'error';
  };
  confluenceData?: MessageBubbleProps['confluenceData'];
  actions?: MessageBubbleProps['actions'];
  error?: string;
}

export interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  onRetry?: (messageId: string) => void;
  className?: string;
}

export function MessageList({
  messages,
  isLoading = false,
  onRetry,
  className,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, messages.length]);

  // Empty state
  if (!isLoading && messages.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <EmptyState />
      </div>
    );
  }

  return (
    <ScrollArea className={cn('flex-1 px-6 py-4', className)} ref={scrollRef}>
      {/* Loading skeleton */}
      {isLoading && messages.length === 0 && (
        <div className="space-y-4">
          <MessageSkeleton />
          <MessageSkeleton isUser />
          <MessageSkeleton />
        </div>
      )}

      {/* Messages */}
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          role={message.role}
          content={message.content}
          timestamp={message.timestamp}
          isStreaming={message.isStreaming}
          toolUse={message.toolUse}
          confluenceData={message.confluenceData}
          actions={message.actions}
          error={message.error}
          onRetry={onRetry ? () => onRetry(message.id) : undefined}
        />
      ))}

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </ScrollArea>
  );
}

/**
 * Empty state when no messages
 */
function EmptyState() {
  return (
    <div className="text-center max-w-md mx-auto">
      <div className="text-6xl mb-4">💬</div>
      <h3 className="text-lg font-semibold mb-2">Start a Conversation</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Ask Claude about trading setups, confluence factors, or get help analyzing SOL-PERP and BTC-PERP markets.
      </p>
      <div className="space-y-2 text-xs text-muted-foreground text-left">
        <p className="flex items-start gap-2">
          <span className="text-blue-600 dark:text-blue-400 shrink-0">💡</span>
          <span>Try: "SOL at $138, is this a setup?"</span>
        </p>
        <p className="flex items-start gap-2">
          <span className="text-blue-600 dark:text-blue-400 shrink-0">💡</span>
          <span>Try: "Show me BTC-PERP confluence factors"</span>
        </p>
        <p className="flex items-start gap-2">
          <span className="text-blue-600 dark:text-blue-400 shrink-0">💡</span>
          <span>Try: "Suggest entry/stop/target levels for SOL"</span>
        </p>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for message bubbles
 */
function MessageSkeleton({ isUser = false }: { isUser?: boolean }) {
  return (
    <div className={cn('flex mb-4', isUser ? 'justify-end' : 'justify-start')}>
      <div className="max-w-[80%] space-y-2">
        <Skeleton className={cn('h-20 rounded-2xl', isUser ? 'w-64' : 'w-80')} />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}
