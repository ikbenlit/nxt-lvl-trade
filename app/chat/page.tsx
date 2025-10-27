/**
 * Chat Page - Conversational Setup Analysis
 *
 * Main interface for chatting with Claude about trading setups.
 *
 * Layout:
 * - Left: Message history + input (main area)
 * - Right: Context sidebar (collapsible on mobile)
 *
 * Features:
 * - Multi-turn conversation with real Claude API
 * - SSE streaming responses
 * - Message persistence (saved to DB)
 * - Real-time confluence display (mock for now, will be real in Fase 2.3)
 */

'use client';

import { MessageList } from '@/components/chat/MessageList';
import { MessageInput, DEFAULT_SUGGESTIONS } from '@/components/chat/MessageInput';
import { ThreadSelector } from '@/components/chat/ThreadSelector';
import { ConfluenceDisplay } from '@/components/shared/ConfluenceDisplay';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useChat } from '@/lib/hooks/useChat';
import { useMarketData, formatPriceChange } from '@/lib/hooks/useMarketData';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ChatPage() {
  // Asset state
  const [currentAsset, setCurrentAsset] = useState<'SOL-PERP' | 'BTC-PERP'>('SOL-PERP');

  // Chat hook (real Claude API + thread resume)
  const { messages, isLoading, threadId, usage, sendMessage, loadThread, startNewThread } = useChat({
    asset: currentAsset,
    onError: (error) => {
      toast.error('Chat Error', {
        description: error.message,
      });
    },
  });

  // Real-time market data hook (Fase 2.4: REAL DATA)
  const {
    data: marketData,
    isLoading: isLoadingMarketData,
    error: marketDataError,
    refresh: refreshMarketData,
  } = useMarketData(currentAsset, {
    refreshInterval: 30000, // Auto-refresh every 30s
    interval: '4h', // Use 4h timeframe for confluence
  });

  // Send message handler
  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
  };

  // Refresh market data (real)
  const handleRefreshData = async () => {
    try {
      await refreshMarketData();
      toast.success('Refreshed', {
        description: `${currentAsset} market data updated`,
      });
    } catch (error) {
      toast.error('Refresh Failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Change asset
  const handleAssetChange = (asset: 'SOL-PERP' | 'BTC-PERP') => {
    setCurrentAsset(asset);
    toast.info('Asset Changed', {
      description: `Switched to ${asset}. Future messages will use this context.`,
    });
  };

  // Thread management handlers
  const handleThreadChange = async (newThreadId: number | null) => {
    if (newThreadId === null) {
      startNewThread();
      toast.info('New Conversation', {
        description: 'Started a new conversation',
      });
    } else if (newThreadId !== threadId) {
      try {
        await loadThread(newThreadId);
        toast.success('Conversation Loaded', {
          description: `Loaded thread ${newThreadId}`,
        });
      } catch (error) {
        toast.error('Load Failed', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  };

  const handleNewThread = () => {
    startNewThread();
    toast.info('New Conversation', {
      description: 'Started a new conversation',
    });
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
        </Button>

        {/* Usage Stats (if available) */}
        {usage && (
          <div className="text-xs text-muted-foreground">
            <span>Tokens: {usage.inputTokens + usage.outputTokens}</span>
            <span className="ml-2">Cost: ${usage.cost}</span>
          </div>
        )}
      </div>

      {/* Thread Selector (Fase 2.5) */}
      <div className="mb-4">
        <ThreadSelector
          currentThreadId={threadId}
          onThreadChange={handleThreadChange}
          onNewThread={handleNewThread}
        />
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 h-[calc(100vh-200px)]">
        {/* Chat Area */}
        <Card className="flex flex-col overflow-hidden">
          <MessageList
            messages={messages}
            isLoading={isLoading && messages.length === 0}
          />

          <MessageInput
            onSend={handleSendMessage}
            isLoading={isLoading}
            suggestions={messages.length === 0 ? DEFAULT_SUGGESTIONS : []}
          />
        </Card>

        {/* Context Sidebar (hidden on mobile) */}
        <Card className="p-6 hidden lg:block overflow-auto">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Context</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshData}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {/* Current Asset */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Asset</p>
              <div className="flex gap-2">
                <Button
                  variant={currentAsset === 'SOL-PERP' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleAssetChange('SOL-PERP')}
                  className="flex-1"
                  disabled={isLoading}
                >
                  SOL-PERP
                </Button>
                <Button
                  variant={currentAsset === 'BTC-PERP' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleAssetChange('BTC-PERP')}
                  className="flex-1"
                  disabled={isLoading}
                >
                  BTC-PERP
                </Button>
              </div>
            </div>

            {/* Price Info (REAL DATA - Fase 2.4) */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Price</p>
              {isLoadingMarketData && !marketData ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : marketDataError ? (
                <p className="text-sm text-destructive">
                  Failed to load: {marketDataError.message}
                </p>
              ) : marketData ? (
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      ${marketData.price.toFixed(2)}
                    </span>
                    <Badge
                      variant={marketData.priceChange24h >= 0 ? 'default' : 'destructive'}
                    >
                      {formatPriceChange(marketData.priceChange24h)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Vol: ${(marketData.volume24h / 1_000_000).toFixed(1)}M
                  </p>
                  <p className="text-xs text-muted-foreground">
                    OI: ${(marketData.openInterestUsd / 1_000_000).toFixed(1)}M
                  </p>
                </div>
              ) : null}
            </div>

            {/* Confluence Display (REAL DATA - Fase 2.4) */}
            <div>
              {isLoadingMarketData && !marketData ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : marketDataError ? (
                <p className="text-sm text-destructive">
                  Failed to load confluence data
                </p>
              ) : marketData ? (
                <>
                  <ConfluenceDisplay
                    score={marketData.confluence.score}
                    factors={marketData.confluence.factors}
                    showDetails={true}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    RSI: {marketData.confluence.details.rsi?.toFixed(1) || 'N/A'} |
                    Auto-refresh: 30s
                  </p>
                </>
              ) : null}
            </div>

            {/* Quick Actions */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Quick Actions</p>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link href="/calculator">
                    Calculate Position
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link href="/log">
                    View Trade Log
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
