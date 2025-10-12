'use client';

import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface MentionRange {
  start: number;
  end: number;
  username: string;
}

interface MentionTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onMentionTrigger?: (cursorPosition: number) => void;
  className?: string;
}

/**
 * Enhanced Textarea with smart @mention deletion
 *
 * Features:
 * - Smart backspace: deletes entire @mention at once when cursor is at end
 * - Detects @mentions for intelligent editing
 * - Normal textarea behavior otherwise
 */
export const MentionTextarea = forwardRef<HTMLTextAreaElement, MentionTextareaProps>(
  ({ value, onChange, onMentionTrigger, className, ...props }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [mentions, setMentions] = useState<MentionRange[]>([]);

    // Expose textarea ref to parent
    useImperativeHandle(ref, () => textareaRef.current!);

    // Parse mentions from text
    useEffect(() => {
      const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
      const newMentions: MentionRange[] = [];
      let match;

      while ((match = mentionRegex.exec(value)) !== null) {
        newMentions.push({
          start: match.index,
          end: match.index + match[0].length,
          username: match[1],
        });
      }

      setMentions(newMentions);
    }, [value]);

    // Handle smart backspace for mentions
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Backspace' && textareaRef.current) {
        const cursorPos = textareaRef.current.selectionStart;
        const selectionEnd = textareaRef.current.selectionEnd;

        // Only do smart deletion if there's no selection (cursor, not range)
        if (cursorPos === selectionEnd) {
          // Check if cursor is right after a mention (or within last char of mention)
          const mentionAtCursor = mentions.find(
            m => cursorPos === m.end || (cursorPos > m.start && cursorPos <= m.end)
          );

          if (mentionAtCursor) {
            // Prevent default backspace
            e.preventDefault();

            // Delete entire mention
            const newValue =
              value.slice(0, mentionAtCursor.start) + value.slice(mentionAtCursor.end);

            // Create synthetic event
            const syntheticEvent = {
              target: { value: newValue },
              currentTarget: { value: newValue },
            } as React.ChangeEvent<HTMLTextAreaElement>;

            onChange(syntheticEvent);

            // Set cursor position after deletion
            setTimeout(() => {
              if (textareaRef.current) {
                textareaRef.current.setSelectionRange(mentionAtCursor.start, mentionAtCursor.start);
              }
            }, 0);
          }
        }
      }

      // Detect @ trigger for autocomplete
      if (e.key === '@' && onMentionTrigger && textareaRef.current) {
        setTimeout(() => {
          if (textareaRef.current) {
            onMentionTrigger(textareaRef.current.selectionStart);
          }
        }, 0);
      }

      // Pass through to parent
      props.onKeyDown?.(e);
    };

    return (
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        className={cn(className)}
        {...props}
      />
    );
  }
);

MentionTextarea.displayName = 'MentionTextarea';
