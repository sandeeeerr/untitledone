/**
 * Mention Parsing Utilities
 * 
 * Utilities for parsing @mentions from comment text and validating
 * mentioned users against project members.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

/**
 * Parses @mention patterns from text and returns array of usernames
 * 
 * @param text - The text to parse for mentions (e.g., comment content)
 * @returns Array of unique usernames mentioned (without @ symbol)
 * 
 * @example
 * parseMentions("Hey @john, can you review this? cc @sarah")
 * // Returns: ["john", "sarah"]
 */
export function parseMentions(text: string): string[] {
  // Regex pattern: matches @ followed by username chars (alphanumeric, dash, underscore)
  // (?:^|\s) ensures @ is at start or preceded by whitespace (non-capturing)
  const mentionRegex = /(?:^|\s)@([a-zA-Z0-9_-]+)/g;
  
  const matches = [...text.matchAll(mentionRegex)];
  const usernames = matches.map((match) => match[1]);
  
  // Return unique usernames only (deduplicate)
  return [...new Set(usernames)];
}

/**
 * Validates mentioned usernames against project members
 * 
 * @param usernames - Array of usernames to validate
 * @param projectId - Project ID to check membership against
 * @param supabase - Supabase client instance
 * @returns Array of valid user objects with id and username
 * 
 * @example
 * const mentions = await validateMentions(["john", "sarah"], projectId, supabase)
 * // Returns: [{ id: "uuid-1", username: "john" }, { id: "uuid-2", username: "sarah" }]
 */
export async function validateMentions(
  usernames: string[],
  projectId: string,
  supabase: SupabaseClient<Database>
): Promise<Array<{ id: string; username: string }>> {
  if (usernames.length === 0) {
    return [];
  }

  // First, get the project owner
  const { data: project } = await supabase
    .from("projects")
    .select("owner_id")
    .eq("id", projectId)
    .single();

  if (!project) {
    return [];
  }

  // Get all project member IDs (excluding owner, we'll add them separately)
  const { data: members } = await supabase
    .from("project_members")
    .select("user_id")
    .eq("project_id", projectId);

  // Collect all user IDs: owner + members
  const userIds = new Set<string>([project.owner_id]);
  if (members) {
    members.forEach((member) => userIds.add(member.user_id));
  }

  // Query profiles for users who are project members AND match the usernames
  const { data: validUsers } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", Array.from(userIds))
    .in("username", usernames);

  return validUsers || [];
}

/**
 * Creates notification records for mentioned users
 * 
 * @param commentId - ID of the comment containing mentions
 * @param mentionedUserIds - Array of user IDs who were mentioned
 * @param authorId - ID of the comment author (will be excluded from notifications)
 * @param projectId - ID of the project
 * @param supabase - Supabase client instance (should be service role for RLS bypass)
 * @returns Array of created notification IDs
 * 
 * @example
 * await createMentionNotifications(commentId, ["uuid-1", "uuid-2"], authorId, projectId, supabase)
 */
export async function createMentionNotifications(
  commentId: string,
  mentionedUserIds: string[],
  authorId: string,
  projectId: string,
  supabase: SupabaseClient<Database>
): Promise<string[]> {
  if (mentionedUserIds.length === 0) {
    return [];
  }

  // Filter out author's own ID (no self-mention notifications)
  const filteredUserIds = mentionedUserIds.filter((id) => id !== authorId);

  if (filteredUserIds.length === 0) {
    return [];
  }

  // First, insert mention records into comment_mentions
  const mentionInserts = filteredUserIds.map((userId) => ({
    comment_id: commentId,
    mentioned_user_id: userId,
  }));

  const { error: mentionError } = await supabase
    .from("comment_mentions")
    .insert(mentionInserts);

  if (mentionError) {
    console.error("Failed to create mention records:", mentionError);
    // Continue with notifications even if mentions fail
  }

  // Create notification records (1:1 with mentions)
  const notificationInserts = filteredUserIds.map((userId) => ({
    user_id: userId,
    type: "mention" as const,
    comment_id: commentId,
    project_id: projectId,
    is_read: false,
  }));

  const { data: notifications, error: notificationError } = await supabase
    .from("notifications")
    .insert(notificationInserts)
    .select("id");

  if (notificationError) {
    console.error("Failed to create notifications:", notificationError);
    return [];
  }

  return notifications?.map((n) => n.id) || [];
}

/**
 * Extracts new mentions from edited comment text
 * Compares current mentions with previous mentions to find newly added ones
 * 
 * @param currentText - Current comment text (after edit)
 * @param previousText - Previous comment text (before edit)
 * @returns Array of newly added usernames
 * 
 * @example
 * getNewMentions("Hey @john and @sarah", "Hey @john")
 * // Returns: ["sarah"]
 */
export function getNewMentions(currentText: string, previousText: string): string[] {
  const currentMentions = new Set(parseMentions(currentText));
  const previousMentions = new Set(parseMentions(previousText));

  // Find mentions that are in current but not in previous
  const newMentions = [...currentMentions].filter(
    (username) => !previousMentions.has(username)
  );

  return newMentions;
}

