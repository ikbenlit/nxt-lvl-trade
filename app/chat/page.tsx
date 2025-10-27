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
import { ConversationsSidebar } from '@/components/chat/ConversationsSidebar';
import { ConfluenceDisplay } from '@/components/shared/ConfluenceDisplay';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw } from 'lucide-react';
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
    <div className="flex h-screen">
      {/* Conversations Sidebar (Left) - Claude/ChatGPT style */}
      <ConversationsSidebar
        currentThreadId={threadId}
        onThreadChange={handleThreadChange}
        onNewThread={handleNewThread}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with usage stats */}
        {usage && (
          <div className="border-b px-6 py-3 bg-muted/30">
            <div className="text-xs text-muted-foreground">
              <span>Tokens: {usage.inputTokens + usage.outputTokens}</span>
              <span className="ml-4">Cost: ${usage.cost}</span>
            </div>
          </div>
        )}

        {/* Chat Area + Context Sidebar Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] overflow-hidden">
          {/* Chat Area (Center) */}
          <div className="flex flex-col border-r">
            <MessageList
              messages={messages}
              isLoading={isLoading && messages.length === 0}
            />

            <MessageInput
              onSend={handleSendMessage}
              isLoading={isLoading}
              suggestions={messages.length === 0 ? DEFAULT_SUGGESTIONS : []}
            />
          </div>

          {/* Context Sidebar (Right) - hidden on mobile */}
          <div className="hidden lg:block bg-muted/30 overflow-auto">
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Market Context</h3>
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
                    SOL
                  </Button>
                  <Button
                    variant={currentAsset === 'BTC-PERP' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleAssetChange('BTC-PERP')}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    BTC
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
