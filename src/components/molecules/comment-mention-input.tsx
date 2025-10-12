'use client';

import * as React from 'react';
import { useMentionAutocomplete } from '@/hooks/use-mention-autocomplete';
import { cn } from '@/lib/utils';
import { Mention, MentionContent, MentionInput, MentionItem } from '@/components/ui/mention';

interface CommentMentionInputProps {
  projectId: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  disabled?: boolean;
}

/**
 * Comment input with @mention support using DiceUI Mention component
 *
 * Features:
 * - Auto-complete dropdown with project members
 * - Instant suggestions on @ character
 * - Visual highlighting of mentioned users
 * - Clean integration with existing components
 */
export function CommentMentionInput({
  projectId,
  value,
  onChange,
  placeholder,
  className,
  rows = 2,
  disabled,
}: CommentMentionInputProps) {
  // Use ref to maintain focus
  const mentionRef = React.useRef<HTMLDivElement>(null);
  
  // Fetch project members for autocomplete - instant results
  const { suggestions, isLoading } = useMentionAutocomplete({
    projectId,
    enabled: true,
    debounceMs: 0, // Instant results
  });

  // Convert value to array of mentions for the Mention component
  const mentionsArray = React.useMemo(() => {
    const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
    const matches = Array.from(value.matchAll(mentionRegex));
    return matches.map(match => match[1]);
  }, [value]);

  // Get valid usernames for highlighting
  const validUsernames = React.useMemo(() => {
    return new Set(suggestions.map(user => user.username.toLowerCase()));
  }, [suggestions]);

  // Filter mentions to only include valid project members
  const validMentions = React.useMemo(() => {
    return mentionsArray.filter(mention => 
      validUsernames.has(mention.toLowerCase())
    );
  }, [mentionsArray, validUsernames]);

  // Handle value change from DiceUI Mention component
  const handleValueChange = React.useCallback((newValue: string) => {
    onChange(newValue);
  }, [onChange]);

  // Handle mention selection
  const handleMentionSelect = React.useCallback((_selectedMentions: string[]) => {
    // The DiceUI component handles this automatically
  }, []);

  // Force re-render only when value is completely cleared (not on every change)
  const [resetKey, setResetKey] = React.useState(0);
  
  React.useEffect(() => {
    if (value === "") {
      setResetKey(prev => prev + 1);
    }
  }, [value]);

  return (
    <div className="flex-1">
      <Mention
        key={resetKey} // Stable key that only changes when needed
        ref={mentionRef}
        trigger="@"
        inputValue={value}
        onInputValueChange={handleValueChange}
        value={validMentions}
        onValueChange={handleMentionSelect}
        disabled={disabled}
        className="w-full"
      >
        <MentionInput
          placeholder={placeholder}
          className={cn('min-h-[60px] resize-none text-sm', className)}
          asChild
        >
          <textarea 
            rows={rows}
            autoComplete="off"
            spellCheck="false"
          />
        </MentionInput>
        <MentionContent>
          {isLoading ? (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">Loading...</div>
          ) : suggestions.length === 0 ? (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">No members found</div>
          ) : (
            suggestions.map(user => (
              <MentionItem
                key={user.id}
                value={user.username}
                className="flex-col items-start gap-0.5"
              >
                <span className="text-sm font-medium">{user.username}</span>
              </MentionItem>
            ))
          )}
        </MentionContent>
      </Mention>
    </div>
  );
}
