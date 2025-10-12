/**
 * Custom hook for mention autocomplete with debouncing
 * Uses TanStack Query to fetch and cache member suggestions
 */

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";

export interface MentionSuggestion {
  id: string;
  username: string;
}

interface UseMentionAutocompleteOptions {
  projectId: string;
  /** Debounce delay in milliseconds (default: 0ms for instant results) */
  debounceMs?: number;
  /** Enable/disable the query */
  enabled?: boolean;
}

/**
 * Hook for fetching mention autocomplete suggestions
 * Shows all members when query is empty, filters as user types
 * Instant results with optional debouncing
 *
 * @example
 * const { query, setQuery, suggestions, isLoading } = useMentionAutocomplete({
 *   projectId: "uuid",
 *   debounceMs: 0  // Instant results
 * });
 */
export function useMentionAutocomplete({
  projectId,
  debounceMs = 0,
  enabled = true,
}: UseMentionAutocompleteOptions) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Debounce query (instant if debounceMs is 0)
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (debounceMs === 0) {
      setDebouncedQuery(query);
    } else {
      timeoutRef.current = setTimeout(() => {
        setDebouncedQuery(query);
      }, debounceMs);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, debounceMs]);

  // Fetch suggestions using TanStack Query with optimized settings
  const {
    data: suggestions = [],
    isLoading,
    error,
  } = useQuery<MentionSuggestion[]>({
    queryKey: ["mention-autocomplete", projectId, debouncedQuery],
    queryFn: async () => {
      // Build URL with optional query parameter
      const queryParam = debouncedQuery ? `?q=${encodeURIComponent(debouncedQuery)}` : "";
      const response = await fetch(
        `/api/projects/${projectId}/members/autocomplete${queryParam}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch suggestions");
      }

      return response.json();
    },
    enabled: enabled && Boolean(projectId), // Ensure projectId exists
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 1,
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
  });

  return {
    query,
    setQuery,
    suggestions,
    isLoading,
    error,
  };
}

