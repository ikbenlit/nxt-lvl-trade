/**
 * ThreadSelector Component
 *
 * Dropdown to select/resume previous conversation threads.
 * Fetches recent threads via SWR and allows user to switch between them.
 */

'use client';

import useSWR from 'swr';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare } from 'lucide-react';

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

interface ThreadSelectorProps {
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

export function ThreadSelector({
  currentThreadId,
  onThreadChange,
  onNewThread,
}: ThreadSelectorProps) {
  const { data, error, isLoading } = useSWR<{ threads: Thread[] }>(
    '/api/threads?limit=20',
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30s
      revalidateOnFocus: true,
    }
  );

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (error) {
    return (
      <div className="text-sm text-destructive">
        Failed to load threads
      </div>
    );
  }

  const threads = data?.threads || [];

  return (
    <div className="flex items-center gap-2">
      {/* New Thread Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onNewThread}
        className="flex-shrink-0"
        title="Start new conversation"
      >
        <Plus className="h-4 w-4" />
      </Button>

      {/* Thread Selector */}
      <Select
        value={currentThreadId?.toString() || 'new'}
        onValueChange={(value) => {
          if (value === 'new') {
            onNewThread();
          } else {
            onThreadChange(parseInt(value, 10));
          }
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select conversation..." />
        </SelectTrigger>
        <SelectContent>
          {/* New Conversation Option */}
          <SelectItem value="new">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>New Conversation</span>
            </div>
          </SelectItem>

          {/* Existing Threads */}
          {threads.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Recent Conversations
              </div>
              {threads.map((thread) => {
                const displayText = thread.topic?.slice(0, 50) || 'Untitled conversation';
                const suffix = thread.topic && thread.topic.length > 50 ? '...' : '';
                const asset = thread.asset ? ` (${thread.asset})` : '';
                const date = new Date(thread.createdAt).toLocaleDateString();

                return (
                  <SelectItem key={thread.id} value={thread.id.toString()}>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">
                          {displayText}{suffix}{asset}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {date}
                      </span>
                    </div>
                  </SelectItem>
                );
              })}
            </>
          )}

          {/* No Threads Message */}
          {threads.length === 0 && (
            <div className="px-2 py-3 text-center text-sm text-muted-foreground">
              No conversations yet
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
