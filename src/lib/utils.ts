import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Deterministic HSL color from a string (e.g., user id/username)
export function colorFromString(input: string): string {
  const str = String(input || "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const abs = Math.abs(hash);
  const hue = abs % 360; // 0-359
  const saturation = 60; // keep within brand-friendly range
  const lightness = 55; // readable on both themes
  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}
