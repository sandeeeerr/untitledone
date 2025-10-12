"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MentionSuggestion {
  id: string;
  username: string;
}

interface MentionAutocompleteProps {
  /** Array of suggestions to display */
  suggestions: MentionSuggestion[];
  /** Loading state */
  isLoading?: boolean;
  /** Callback when a suggestion is selected */
  onSelect: (suggestion: MentionSuggestion) => void;
  /** Callback when autocomplete should close */
  onClose: () => void;
  /** Position coordinates for the dropdown */
  position?: { top: number; left: number };
  /** Currently selected index (for keyboard navigation) */
  selectedIndex?: number;
  /** Callback when selected index changes */
  onSelectedIndexChange?: (index: number) => void;
}

/**
 * Mention Autocomplete Dropdown
 * 
 * Displays a dropdown list of user suggestions for @mentions
 * Supports keyboard navigation (Arrow keys, Enter, Escape)
 * and mouse interaction (hover, click)
 * 
 * @example
 * <MentionAutocomplete
 *   suggestions={suggestions}
 *   isLoading={isLoading}
 *   onSelect={(user) => insertMention(user.username)}
 *   onClose={() => setShowAutocomplete(false)}
 *   position={{ top: 100, left: 50 }}
 * />
 */
export function MentionAutocomplete({
  suggestions,
  isLoading = false,
  onSelect,
  onClose,
  position,
  selectedIndex = 0,
  onSelectedIndexChange,
}: MentionAutocompleteProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [localSelectedIndex, setLocalSelectedIndex] = useState(selectedIndex);

  // Sync local state with prop
  useEffect(() => {
    setLocalSelectedIndex(selectedIndex);
  }, [selectedIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (suggestions.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          const nextIndex = (localSelectedIndex + 1) % suggestions.length;
          setLocalSelectedIndex(nextIndex);
          onSelectedIndexChange?.(nextIndex);
          break;
        case "ArrowUp":
          e.preventDefault();
          const prevIndex = localSelectedIndex === 0 ? suggestions.length - 1 : localSelectedIndex - 1;
          setLocalSelectedIndex(prevIndex);
          onSelectedIndexChange?.(prevIndex);
          break;
        case "Enter":
          e.preventDefault();
          if (suggestions[localSelectedIndex]) {
            onSelect(suggestions[localSelectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [suggestions, localSelectedIndex, onSelect, onClose, onSelectedIndexChange]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = dropdownRef.current?.querySelector(`[data-index="${localSelectedIndex}"]`);
    selectedElement?.scrollIntoView({ block: "nearest" });
  }, [localSelectedIndex]);

  if (!isLoading && suggestions.length === 0) {
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      className={cn(
        "absolute z-50 w-64 rounded-md border border-border bg-popover shadow-lg",
        "max-h-60 overflow-y-auto"
      )}
      style={position ? { top: `${position.top}px`, left: `${position.left}px` } : undefined}
    >
      {isLoading ? (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ul className="py-1">
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              data-index={index}
              className={cn(
                "cursor-pointer px-4 py-2 text-sm transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                index === localSelectedIndex && "bg-accent text-accent-foreground"
              )}
              onMouseEnter={() => {
                setLocalSelectedIndex(index);
                onSelectedIndexChange?.(index);
              }}
              onClick={() => onSelect(suggestion)}
            >
              <span className="font-medium">@{suggestion.username}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

