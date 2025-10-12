/**
 * Share Link Utilities
 * 
 * Utilities for generating and validating temporary project share links
 */

import { randomUUID } from "crypto";

/**
 * Generate a secure random token for share links
 * Uses crypto.randomUUID() for cryptographic randomness
 * 
 * @returns Secure random UUID token
 * 
 * @example
 * const token = generateSecureToken();
 * // Returns: "550e8400-e29b-41d4-a716-446655440000"
 */
export function generateSecureToken(): string {
  return randomUUID();
}

/**
 * Calculate expiration timestamp
 * 
 * @param hours - Number of hours until expiration (default: 1)
 * @returns Date object representing expiration time
 * 
 * @example
 * const expiresAt = calculateExpiry(1);
 * // Returns: Date 1 hour from now
 */
export function calculateExpiry(hours: number = 1): Date {
  const now = new Date();
  const expiryMs = now.getTime() + (hours * 60 * 60 * 1000);
  return new Date(expiryMs);
}

/**
 * Check if a share link is expired
 * 
 * @param expiresAt - Expiration timestamp (ISO string or Date)
 * @returns True if link is expired, false otherwise
 * 
 * @example
 * const isExpired = isLinkExpired("2025-10-12T10:00:00Z");
 */
export function isLinkExpired(expiresAt: string | Date): boolean {
  const expiryTime = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  return expiryTime.getTime() < Date.now();
}

/**
 * Format time remaining until expiration
 * 
 * @param expiresAt - Expiration timestamp (ISO string or Date)
 * @returns Formatted string (e.g., "45 minutes", "Expired")
 * 
 * @example
 * const remaining = formatTimeRemaining("2025-10-12T10:00:00Z");
 * // Returns: "45 minutes" or "Expired"
 */
export function formatTimeRemaining(expiresAt: string | Date): string {
  const expiryTime = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  const now = Date.now();
  const remainingMs = expiryTime.getTime() - now;

  if (remainingMs <= 0) {
    return "Expired";
  }

  const minutes = Math.floor(remainingMs / (60 * 1000));
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }

  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

/**
 * Determine share link status
 * 
 * @param link - Share link object with expires_at, used_by, and revoked fields
 * @returns Status string: "active", "expired", "used", or "revoked"
 */
export function getLinkStatus(link: {
  expires_at: string;
  used_by: string | null;
  revoked: boolean;
}): "active" | "expired" | "used" | "revoked" {
  if (link.revoked) {
    return "revoked";
  }
  
  if (link.used_by) {
    return "used";
  }
  
  if (isLinkExpired(link.expires_at)) {
    return "expired";
  }
  
  return "active";
}

