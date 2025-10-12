/**
 * Mention Highlighting Utilities
 *
 * Utilities for highlighting @mentions in text with React components
 * Supports both display text and real-time input highlighting
 */

import React from 'react';

/**
 * Highlights @mentions in text and returns React elements
 * Only highlights mentions that are in the validUsernames set (if provided)
 *
 * @param text - The text to parse and highlight
 * @param className - Optional className for mention spans
 * @param validUsernames - Optional set of valid usernames to highlight (case-insensitive)
 * @returns Array of React nodes with highlighted mentions
 *
 * @example
 * <p>{highlightMentions("Hey @john, can you review?", undefined, new Set(["john"]))}</p>
 * // Renders: Hey <span class="mention">@john</span>, can you review?
 */
export function highlightMentions(
  text: string,
  className?: string,
  validUsernames?: Set<string>
): React.ReactNode[] {
  // Regex pattern: matches @ followed by username chars
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    const username = match[1];
    const isValid = !validUsernames || validUsernames.has(username.toLowerCase());

    // Add text before mention
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Add highlighted mention (only if valid)
    if (isValid) {
      parts.push(
        <span
          key={`mention-${match.index}`}
          className={className || 'font-semibold text-blue-600 dark:text-blue-400'}
        >
          {match[0]}
        </span>
      );
    } else {
      // Add as plain text if not valid
      parts.push(match[0]);
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

/**
 * Hook for managing input highlighting state
 * Returns a ref and handler for highlighting mentions in textarea/input
 *
 * Note: This is a simplified version. For full rich text editing with
 * real-time highlighting in the input, consider using a library like
 * draft.js, slate.js, or lexical. For now, we'll highlight in the
 * display layer only.
 */
export function useMentionHighlighting() {
  const [hasHighlights, setHasHighlights] = React.useState(false);

  const checkForMentions = React.useCallback((text: string) => {
    const hasMention = /@[a-zA-Z0-9_-]+/.test(text);
    setHasHighlights(hasMention);
    return hasMention;
  }, []);

  return {
    hasHighlights,
    checkForMentions,
  };
}

/**
 * Component for displaying text with highlighted mentions
 * Use this for displaying saved comments
 * Only highlights mentions of users that are in validUsernames
 */
export interface HighlightedTextProps {
  text: string;
  className?: string;
  mentionClassName?: string;
  /** Set of valid usernames to highlight (case-insensitive). If undefined, all mentions are highlighted. */
  validUsernames?: Set<string>;
}

export function HighlightedText({
  text,
  className,
  mentionClassName,
  validUsernames,
}: HighlightedTextProps) {
  const content = React.useMemo(
    () => highlightMentions(text, mentionClassName, validUsernames),
    [text, mentionClassName, validUsernames]
  );

  return <span className={className}>{content}</span>;
}
