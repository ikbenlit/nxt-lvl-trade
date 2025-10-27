/**
 * ConversationsSidebar Component
 *
 * Left sidebar with list of conversation threads (Claude/ChatGPT style).
 * Features:
 * - Vertical list of conversations
 * - "New chat" button at top
 * - Active thread highlighting
 * - Collapsible on mobile
 */

'use client';

import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, MessageSquare, PanelLeftClose, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

// ============================================
// TYPES
// ============================================

interface Thread {
  id: number;
  topic: string | null;
  asset: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ConversationsSidebarProps {
  currentThreadId: number | null;
  onThreadChange: (threadId: number | null) => void;
  onNewThread: () => void;
}

// ============================================
// FETCHER
// ============================================

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch threads');
  return res.json();
};

// ============================================
// COMPONENT
// ============================================

export function ConversationsSidebar({
  currentThreadId,
  onThreadChange,
  onNewThread,
}: ConversationsSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { data, error, isLoading } = useSWR<{ threads: Thread[] }>(
    '/api/threads?limit=50',
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30s
      revalidateOnFocus: true,
    }
  );

  const threads = data?.threads || [];

  // Collapsed state (show only icons)
  if (isCollapsed) {
    return (
      <div className="w-16 border-r bg-muted/30 flex flex-col items-center py-4 gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          title="Expand sidebar"
        >
          <PanelLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="default"
          size="icon"
          onClick={onNewThread}
          title="New conversation"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  // Full sidebar
  return (
    <div className="w-64 border-r bg-muted/30 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Conversations</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsCollapsed(true)}
            title="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="default"
          size="sm"
          className="w-full justify-start"
          onClick={onNewThread}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Thread List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* Loading State */}
          {isLoading && (
            <>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full mb-1" />
              ))}
            </>
          )}

          {/* Error State */}
          {error && (
            <div className="px-3 py-6 text-center text-sm text-destructive">
              Failed to load conversations
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && threads.length === 0 && (
            <div className="px-3 py-8 text-center">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No conversations yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Start a new chat to begin
              </p>
            </div>
          )}

          {/* Thread Items */}
          {!isLoading && !error && threads.map((thread) => {
            const isActive = thread.id === currentThreadId;
            const displayText = thread.topic?.slice(0, 40) || 'New conversation';
            const suffix = thread.topic && thread.topic.length > 40 ? '...' : '';
            const asset = thread.asset ? thread.asset.replace('-PERP', '') : '';
            const date = new Date(thread.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });

            return (
              <button
                key={thread.id}
                onClick={() => onThreadChange(thread.id)}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-lg transition-colors',
                  'hover:bg-accent/50',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive && 'bg-accent font-medium'
                )}
              >
                <div className="flex items-start gap-2">
                  <MessageSquare className={cn(
                    'h-4 w-4 mt-0.5 flex-shrink-0',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm truncate',
                      isActive ? 'font-medium' : 'font-normal'
                    )}>
                      {displayText}{suffix}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {asset && (
                        <span className="text-xs text-muted-foreground font-mono">
                          {asset}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {date}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer (optional - for future features like settings) */}
      <div className="p-2 border-t">
        <p className="text-xs text-center text-muted-foreground">
          {threads.length} conversation{threads.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
