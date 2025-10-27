/**
 * MessageBubble Component
 *
 * Renders a chat message bubble for user or assistant messages.
 * Includes support for streaming states, tool execution badges, and action buttons.
 *
 * Variants:
 * - User messages: Right-aligned, blue background
 * - Assistant messages: Left-aligned, muted background
 *
 * States:
 * - Normal: Fully rendered message
 * - Streaming: Blinking cursor animation
 * - Tool use: Badge showing "Fetching data..."
 * - Error: Red border with retry option
 */

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { ReactNode } from 'react';

export interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  isStreaming?: boolean;
  toolUse?: {
    name: string;
    status: 'running' | 'completed' | 'error';
  };
  confluenceData?: {
    score: number;
    factors: {
      rsi_oversold_bought: boolean;
      support_resistance: boolean;
      oi_divergence: boolean;
      fvg_present: boolean;
      order_block: boolean;
      funding_extreme: boolean;
    };
  };
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
  }>;
  error?: string;
  onRetry?: () => void;
}

export function MessageBubble({
  role,
  content,
  timestamp,
  isStreaming = false,
  toolUse,
  confluenceData,
  actions,
  error,
  onRetry,
}: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div
      className={cn(
        'flex mb-4',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3',
          error && 'border-2 border-red-500',
          isUser
            ? 'bg-blue-600 text-white rounded-tr-none'
            : 'bg-muted rounded-tl-none'
        )}
      >
        {/* Tool Use Badge */}
        {toolUse && (
          <div className="mb-2">
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                toolUse.status === 'running' && 'bg-blue-50 dark:bg-blue-950',
                toolUse.status === 'error' && 'bg-red-50 dark:bg-red-950'
              )}
            >
              {toolUse.status === 'running' && (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              )}
              {toolUse.status === 'running' && `${toolUse.name}...`}
              {toolUse.status === 'completed' && `${toolUse.name} ✓`}
              {toolUse.status === 'error' && `${toolUse.name} failed`}
            </Badge>
          </div>
        )}

        {/* Message Content */}
        <p className="text-sm whitespace-pre-wrap">
          {content}
          {isStreaming && (
            <span className="animate-pulse ml-1">|</span>
          )}
        </p>

        {/* Confluence Display (Claude messages only) */}
        {confluenceData && !isUser && (
          <div className="mt-3 p-3 rounded-lg bg-background/50">
            <ConfluenceCompact {...confluenceData} />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-2 text-xs text-red-600 dark:text-red-400">
            ⚠️ {error}
          </div>
        )}

        {/* Action Buttons */}
        {actions && actions.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {actions.map((action, index) => (
              <Button
                key={index}
                size="sm"
                variant={action.variant || 'outline'}
                onClick={action.onClick}
                className={cn(
                  isUser && 'bg-white/20 hover:bg-white/30 text-white border-white/50'
                )}
              >
                {action.label}
              </Button>
            ))}
            {onRetry && error && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                className={cn(
                  isUser && 'bg-white/20 hover:bg-white/30 text-white border-white/50'
                )}
              >
                Retry
              </Button>
            )}
          </div>
        )}

        {/* Timestamp */}
        <p className={cn(
          'text-xs mt-2',
          isUser ? 'opacity-70' : 'text-muted-foreground'
        )}>
          {timestamp ? formatRelativeTime(timestamp) : 'Just now'}
        </p>
      </div>
    </div>
  );
}

/**
 * Compact Confluence Display (for message bubbles)
 */
function ConfluenceCompact({
  score,
  factors,
}: {
  score: number;
  factors: {
    rsi_oversold_bought: boolean;
    support_resistance: boolean;
    oi_divergence: boolean;
    fvg_present: boolean;
    order_block: boolean;
    funding_extreme: boolean;
  };
}) {
  const getColor = (score: number) => {
    if (score >= 5) return 'text-green-600 dark:text-green-400';
    if (score >= 4) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const stars = '⭐'.repeat(score);

  return (
    <div className="space-y-2">
      {/* Score Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold">Confluence</span>
        <div className="flex items-center gap-2">
          <span className={cn('text-sm font-bold', getColor(score))}>
            {score}/6
          </span>
          <span className="text-sm">{stars}</span>
        </div>
      </div>

      {/* Factor Checklist */}
      <div className="space-y-0.5 text-xs">
        <FactorItem checked={factors.rsi_oversold_bought} label="RSI oversold/overbought" />
        <FactorItem checked={factors.support_resistance} label="Near S/R" />
        <FactorItem checked={factors.oi_divergence} label="OI divergence" />
        <FactorItem checked={factors.fvg_present} label="Fair Value Gap" />
        <FactorItem checked={factors.order_block} label="Order Block" />
        <FactorItem checked={factors.funding_extreme} label="Extreme funding" />
      </div>
    </div>
  );
}

function FactorItem({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={checked ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}>
        {checked ? '✅' : '❌'}
      </span>
      <span className={checked ? '' : 'text-muted-foreground line-through opacity-60'}>
        {label}
      </span>
    </div>
  );
}

/**
 * Format timestamp as relative time (e.g., "Just now", "2 min ago", "1h ago")
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return 'Yesterday';
  return `${diffDay}d ago`;
}
