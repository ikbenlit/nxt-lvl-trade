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
import { ConfluenceDisplay, ConfluenceFactors } from '@/components/shared/ConfluenceDisplay';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useChat } from '@/lib/hooks/useChat';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ChatPage() {
  // Asset state
  const [currentAsset, setCurrentAsset] = useState<'SOL-PERP' | 'BTC-PERP'>('SOL-PERP');

  // Chat hook (real Claude API)
  const { messages, isLoading, threadId, usage, sendMessage } = useChat({
    asset: currentAsset,
    onError: (error) => {
      toast.error('Chat Error', {
        description: error.message,
      });
    },
  });

  // Mock confluence data (will be fetched from real API in Fase 2.3)
  const [confluenceData] = useState<{
    score: number;
    factors: ConfluenceFactors;
    price: number;
    priceChange24h: number;
  }>({
    score: 5,
    factors: {
      rsi_oversold_bought: true,
      support_resistance: true,
      oi_divergence: true,
      fvg_present: true,
      order_block: true,
      funding_extreme: false,
    },
    price: 138.20,
    priceChange24h: -3.2,
  });

  // Send message handler
  const handleSendMessage = async (content: string) => {
    await sendMessage(content);
  };

  // Refresh market data (placeholder)
  const handleRefreshData = () => {
    toast.info('Refresh', {
      description: 'Market data refresh will be implemented in Fase 2.3',
    });
  };

  // Change asset
  const handleAssetChange = (asset: 'SOL-PERP' | 'BTC-PERP') => {
    setCurrentAsset(asset);
    toast.info('Asset Changed', {
      description: `Switched to ${asset}. Future messages will use this context.`,
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

      {/* Thread ID indicator (for debugging) */}
      {threadId && (
        <div className="mb-2 text-xs text-muted-foreground text-center">
          Thread ID: {threadId}
        </div>
      )}

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

            {/* Price Info (mock - will be real in Fase 2.3) */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Price</p>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                    ${confluenceData.price.toFixed(2)}
                  </span>
                  <Badge
                    variant={confluenceData.priceChange24h >= 0 ? 'default' : 'destructive'}
                  >
                    {confluenceData.priceChange24h >= 0 ? '+' : ''}
                    {confluenceData.priceChange24h.toFixed(2)}%
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Mock data (Fase 2.3: real API)</p>
              </div>
            </div>

            {/* Confluence Display (mock - will be real in Fase 2.3) */}
            <div>
              <ConfluenceDisplay
                score={confluenceData.score}
                factors={confluenceData.factors}
                showDetails={true}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Mock data (Fase 2.3: real-time)
              </p>
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
