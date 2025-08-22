/**
 * Shared API utilities for consistent error handling and response parsing
 */

/**
 * Safely parse error from API response
 */
export async function safeParseError(res: Response): Promise<string | undefined> {
  try {
    const body = await res.json();
    return (body as { error?: string })?.error;
  } catch {
    return undefined;
  }
}

/**
 * Generic API error handler with fallback message
 */
export async function handleApiError(res: Response, fallbackMessage: string): Promise<never> {
  const errorMessage = await safeParseError(res) ?? fallbackMessage;
  throw new Error(errorMessage);
}

/**
 * Standard fetch options for JSON API calls
 */
export const jsonHeaders = {
  "Content-Type": "application/json",
} as const;

/**
 * Create standardized fetch options for API calls
 */
export function createFetchOptions(method: string, body?: unknown): RequestInit {
  const options: RequestInit = {
    method,
    headers: jsonHeaders,
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  return options;
}
