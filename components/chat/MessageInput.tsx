/**
 * MessageInput Component
 *
 * Chat message input field with Send button and character counter.
 *
 * Features:
 * - Multi-line Textarea support
 * - Enter to send, Shift+Enter for newline
 * - Character limit (500 chars)
 * - Loading state (disable during Claude response)
 * - Suggestion chips (optional quick prompts)
 */

'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MessageInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  maxLength?: number;
  suggestions?: string[];
  disabled?: boolean;
}

export function MessageInput({
  onSend,
  isLoading = false,
  placeholder = 'Ask about SOL-PERP or BTC-PERP setups...',
  maxLength = 500,
  suggestions = [],
  disabled = false,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charCount = message.length;
  const isOverLimit = charCount > maxLength;
  const canSend = message.trim().length > 0 && !isOverLimit && !isLoading && !disabled;

  const handleSend = () => {
    if (!canSend) return;

    onSend(message.trim());
    setMessage('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter to send, Shift+Enter for newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
    textareaRef.current?.focus();
  };

  return (
    <div className="border-t bg-background">
      {/* Suggestion Chips */}
      {suggestions.length > 0 && message.length === 0 && (
        <div className="px-4 pt-3 pb-2">
          <p className="text-xs text-muted-foreground mb-2">Suggestions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={isLoading || disabled}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-full border border-border',
                  'hover:bg-accent hover:text-accent-foreground',
                  'transition-colors duration-200',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Field */}
      <div className="p-4">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isLoading || disabled}
              className={cn(
                'min-h-[60px] max-h-[200px] resize-none',
                isOverLimit && 'border-red-500 focus-visible:ring-red-500'
              )}
              maxLength={maxLength + 50} // Allow typing over limit but show warning
            />
            <div className="flex items-center justify-between mt-1">
              <p className={cn(
                'text-xs',
                isOverLimit ? 'text-red-500' : 'text-muted-foreground'
              )}>
                {charCount}/{maxLength}
                {isOverLimit && ' (over limit)'}
              </p>
              {!disabled && (
                <p className="text-xs text-muted-foreground">
                  Press Enter to send, Shift+Enter for new line
                </p>
              )}
            </div>
          </div>

          <Button
            onClick={handleSend}
            disabled={!canSend}
            size="icon"
            className="h-[60px] w-[60px] shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Default suggestion prompts for empty input state
 */
export const DEFAULT_SUGGESTIONS = [
  "SOL at current price, is this a setup?",
  "Show me BTC-PERP confluence factors",
  "What invalidates this setup?",
  "Suggest entry/stop/target levels",
];
