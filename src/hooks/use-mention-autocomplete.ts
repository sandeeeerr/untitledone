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
  /** Debounce delay in milliseconds (default: 300ms) */
  debounceMs?: number;
  /** Enable/disable the query */
  enabled?: boolean;
}

/**
 * Hook for fetching mention autocomplete suggestions
 * Automatically debounces queries and caches results
 * 
 * @example
 * const { query, setQuery, suggestions, isLoading } = useMentionAutocomplete({
 *   projectId: "uuid",
 *   debounceMs: 300
 * });
 */
export function useMentionAutocomplete({
  projectId,
  debounceMs = 300,
  enabled = true,
}: UseMentionAutocompleteOptions) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Debounce query
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, debounceMs]);

  // Fetch suggestions using TanStack Query
  const {
    data: suggestions = [],
    isLoading,
    error,
  } = useQuery<MentionSuggestion[]>({
    queryKey: ["mention-autocomplete", projectId, debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length === 0) {
        return [];
      }

      const response = await fetch(
        `/api/projects/${projectId}/members/autocomplete?q=${encodeURIComponent(debouncedQuery)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch suggestions");
      }

      return response.json();
    },
    enabled: enabled && debouncedQuery.length > 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  return {
    query,
    setQuery,
    suggestions,
    isLoading,
    error,
  };
}

