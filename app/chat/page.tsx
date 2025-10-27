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
 * - Multi-turn conversation
 * - Streaming Claude responses
 * - Tool execution (fetch_drift_data, calculate_confluence, etc.)
 * - Real-time confluence display
 * - Message persistence (saved to DB)
 */

'use client';

import { useState } from 'react';
import { MessageList, Message } from '@/components/chat/MessageList';
import { MessageInput, DEFAULT_SUGGESTIONS } from '@/components/chat/MessageInput';
import { ConfluenceDisplay, ConfluenceFactors } from '@/components/shared/ConfluenceDisplay';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function ChatPage() {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAsset, setCurrentAsset] = useState<'SOL-PERP' | 'BTC-PERP'>('SOL-PERP');

  // Mock confluence data (will be replaced with real data from API)
  const [confluenceData, setConfluenceData] = useState<{
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
    if (!content.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // TODO: Replace with real API call to /api/chat
      // For now, simulate Claude response
      await simulateClaudeResponse(content);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate Claude response (placeholder for real API)
  const simulateClaudeResponse = async (userMessage: string) => {
    // Simulate tool use
    const toolMessage: Message = {
      id: `tool-${Date.now()}`,
      role: 'assistant',
      content: 'Analyzing SOL-PERP...',
      timestamp: new Date(),
      toolUse: {
        name: 'fetch_drift_data',
        status: 'running',
      },
    };

    setMessages((prev) => [...prev, toolMessage]);

    // Wait 1s to simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Update tool status
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === toolMessage.id
          ? { ...msg, toolUse: { name: 'fetch_drift_data', status: 'completed' } }
          : msg
      )
    );

    // Simulate streaming response
    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: `Let me analyze SOL-PERP at the current price of $${confluenceData.price}...

**Confluence Score: ${confluenceData.score}/6** ⭐⭐⭐⭐⭐

This is a **HIGH conviction setup**. Here's the breakdown:

✅ **RSI Oversold**: 14-period RSI is at 34 (below 35 threshold)
✅ **Support Nearby**: Price is 0.5% from key support at $137.50
✅ **OI Divergence**: Price down ${Math.abs(confluenceData.priceChange24h)}% but OI up 8.2% — classic capitulation signal
✅ **Fair Value Gap**: Unfilled FVG zone at $137-138 from yesterday's move
✅ **Order Block**: Strong rejection candle from $136.50 (4h timeframe)
❌ **Funding Not Extreme**: Current funding is -0.015%, not at extreme levels yet

**Verdict:** POTENTIAL SETUP, but I'd recommend waiting for US session (13:00 UTC) for volume confirmation.

**Suggested Levels:**
• Entry: $138.50 (on FVG retest)
• Stop: $136.50 (-1.4%)
• Target 1: $145 (+4.7%)
• R:R: 3.4:1 ✅`,
      timestamp: new Date(),
      isStreaming: false,
      confluenceData: {
        score: confluenceData.score,
        factors: confluenceData.factors,
      },
      actions: [
        {
          label: 'Calculate Position',
          onClick: () => console.log('Navigate to calculator'),
          variant: 'outline',
        },
        {
          label: 'Set Alert',
          onClick: () => console.log('Set price alert'),
          variant: 'ghost',
        },
      ],
    };

    setMessages((prev) => [...prev, assistantMessage]);
  };

  // Retry failed message
  const handleRetry = (messageId: string) => {
    console.log('Retry message:', messageId);
    // TODO: Implement retry logic
  };

  // Refresh market data
  const handleRefreshData = () => {
    console.log('Refresh market data');
    // TODO: Fetch fresh data from Drift API
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      {/* Back button */}
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 h-[calc(100vh-200px)]">
        {/* Chat Area */}
        <Card className="flex flex-col overflow-hidden">
          <MessageList
            messages={messages}
            isLoading={isLoading && messages.length === 0}
            onRetry={handleRetry}
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
                  onClick={() => setCurrentAsset('SOL-PERP')}
                  className="flex-1"
                >
                  SOL-PERP
                </Button>
                <Button
                  variant={currentAsset === 'BTC-PERP' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentAsset('BTC-PERP')}
                  className="flex-1"
                >
                  BTC-PERP
                </Button>
              </div>
            </div>

            {/* Price Info */}
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
                <p className="text-xs text-muted-foreground">Last update: 10s ago</p>
              </div>
            </div>

            {/* Confluence Display */}
            <div>
              <ConfluenceDisplay
                score={confluenceData.score}
                factors={confluenceData.factors}
                showDetails={true}
              />
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
