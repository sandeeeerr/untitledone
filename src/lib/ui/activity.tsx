import React from "react";
import { Clock, MessageSquare, Plus, FileAudio, Music, File, Folder, Archive, Trash2 } from "lucide-react";

export type ProjectActivityChangeType = "addition" | "feedback" | "update" | "deletion";

/**
 * Get icon for activity change type
 */
export function getChangeIcon(type: ProjectActivityChangeType): React.ReactElement {
  switch (type) {
    case "addition":
      return <Plus className="h-3 w-3 text-green-600" />;
    case "feedback":
      return <MessageSquare className="h-3 w-3 text-blue-600" />;
    case "update":
      return <Clock className="h-3 w-3 text-orange-600" />;
    case "deletion":
      return <Trash2 className="h-3 w-3 text-red-600" />;
    default:
      return <Clock className="h-3 w-3 text-muted-foreground" />;
  }
}

/**
 * Get prefix symbol for activity change type
 */
export function getChangePrefix(type: ProjectActivityChangeType): string {
  switch (type) {
    case "addition":
      return "+";
    case "feedback":
      return "";
    case "update":
      return "~";
    case "deletion":
      return "-";
    default:
      return "";
  }
}

/**
 * Get appropriate icon for file type
 */
export function getFileIcon(filename?: string): React.ReactElement | null {
  if (!filename) return null;
  
  const extension = filename.split(".").pop()?.toLowerCase();
  
  switch (extension) {
    // Audio files
    case "wav":
    case "mp3":
    case "flac":
    case "aac":
    case "ogg":
    case "m4a":
      return <FileAudio className="h-3 w-3 text-green-600" />;
    
    // MIDI files
    case "mid":
    case "midi":
      return <Music className="h-3 w-3 text-purple-600" />;
    
    // DAW Project files
    case "als": // Ableton Live
    case "alp": // Ableton Live Pack
    case "flp": // FL Studio
    case "logicx": // Logic Pro X
    case "aproj": // Audition Project
    case "ptx": // Pro Tools
    case "cpr": // Cubase
    case "reason": // Reason
      return <Folder className="h-3 w-3 text-blue-600" />;
    
    // Archive files
    case "zip":
    case "rar":
    case "7z":
    case "tar":
    case "gz":
      return <Archive className="h-3 w-3 text-orange-600" />;
    
    // Generic fallback
    default:
      return <File className="h-3 w-3 text-gray-600" />;
  }
}

/**
 * Safely format date with fallback
 */
export function formatDateSafe(value: string, locale?: string): string {
  try {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return new Intl.DateTimeFormat(locale, { 
        day: "numeric", 
        month: "short",
        year: "numeric" 
      }).format(date);
    }
  } catch {
    // Fall through to fallback
  }
  // Fallback to raw string if it's not a valid ISO date
  return value;
}

/**
 * Get group label for activity dates with locale support
 */
export function getGroupLabel(value: string, locale?: string): string {
  try {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.round((today.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
      
      if (diffDays === 0) return rtf.format(0, 'day'); // "today"
      if (diffDays === 1) return rtf.format(-1, 'day'); // "yesterday"
      
      // For older dates, show formatted date
      return new Intl.DateTimeFormat(locale, { 
        day: "numeric", 
        month: "short", 
        year: "numeric" 
      }).format(date);
    }
  } catch {
    // Fall through to fallback
  }
  return value;
}

/**
 * Format time ago using Intl.RelativeTimeFormat
 */
export function formatTimeAgo(value: string, locale?: string): string {
  try {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      const now = new Date();
      const diffInMs = date.getTime() - now.getTime();
      const diffInMinutes = Math.round(diffInMs / (1000 * 60));
      const diffInHours = Math.round(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));

      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

      if (Math.abs(diffInMinutes) < 1) {
        return rtf.format(0, 'second');
      } else if (Math.abs(diffInMinutes) < 60) {
        return rtf.format(diffInMinutes, 'minute');
      } else if (Math.abs(diffInHours) < 24) {
        return rtf.format(diffInHours, 'hour');
      } else if (Math.abs(diffInDays) < 7) {
        return rtf.format(diffInDays, 'day');
      } else {
        // For longer periods, show time format
        return new Intl.DateTimeFormat(locale, {
          hour: 'numeric',
          minute: '2-digit',
        }).format(date);
      }
    }
  } catch {
    // Fall through to fallback
  }
  return value;
}

/**
 * Truncate text with ellipsis and title attribute support
 */
export function truncateText(text: string, maxLength: number = 40): { truncated: string; isTruncated: boolean } {
  if (text.length <= maxLength) {
    return { truncated: text, isTruncated: false };
  }
  return { truncated: `${text.slice(0, maxLength)}...`, isTruncated: true };
}

/**
 * Safe date parsing with fallback for sorting
 */
export function safeDateParse(dateString: string): number {
  try {
    const timestamp = new Date(dateString).getTime();
    return isNaN(timestamp) ? 0 : timestamp;
  } catch {
    return 0;
  }
}

/**
 * Stable version sorting with locale-aware comparison
 */
export function compareVersions(a: string, b: string, locale?: string): number {
  return a.localeCompare(b, locale, { numeric: true, sensitivity: 'base' });
}
