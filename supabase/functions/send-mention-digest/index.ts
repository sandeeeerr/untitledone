// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Send Mention Digest Edge Function
 * 
 * Scheduled to run daily at 9 AM UTC via Supabase cron
 * Sends a digest email to users who:
 * - Have email_mentions_enabled = true
 * - Have email_frequency = 'daily'
 * - Have unread mention notifications
 * 
 * Schedule in config.toml:
 * [functions.send-mention-digest]
 * verify_jwt = false
 */

interface NotificationWithContext {
  id: string;
  user_id: string;
  comment_id: string;
  project_id: string;
  created_at: string;
  project_comments: {
    comment: string;
    file_id: string | null;
    version_id: string | null;
    timestamp_ms: number | null;
    user_id: string;
  } | null;
  projects: {
    name: string;
  } | null;
}

Deno.serve(async (_req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
    const siteUrl = Deno.env.get("NEXT_PUBLIC_SITE_URL") || "http://localhost:3000";

    if (!supabaseUrl || !supabaseServiceRoleKey || !resendApiKey) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Step 1: Get users who want daily digest emails
    const { data: preferences, error: prefsError } = await supabase
      .from("notification_preferences")
      .select("user_id")
      .eq("email_mentions_enabled", true)
      .eq("email_frequency", "daily");

    if (prefsError) {
      console.error("Failed to fetch preferences:", prefsError);
      throw prefsError;
    }

    if (!preferences || preferences.length === 0) {
      return new Response(
        JSON.stringify({ message: "No users with daily digest enabled", sent: 0 }),
        { headers: { "Content-Type": "application/json" }, status: 200 }
      );
    }

    const userIds = preferences.map((p) => p.user_id);

    // Step 2: Get unread mention notifications for these users
    const { data: notifications, error: notifsError } = await supabase
      .from("notifications")
      .select(`
        id,
        user_id,
        comment_id,
        project_id,
        created_at,
        project_comments!notifications_comment_id_fkey (
          comment,
          file_id,
          version_id,
          timestamp_ms,
          user_id
        ),
        projects!notifications_project_id_fkey (
          name
        )
      `)
      .in("user_id", userIds)
      .eq("type", "mention")
      .eq("is_read", false);

    if (notifsError) {
      console.error("Failed to fetch notifications:", notifsError);
      throw notifsError;
    }

    if (!notifications || notifications.length === 0) {
      return new Response(
        JSON.stringify({ message: "No unread mentions to send", sent: 0 }),
        { headers: { "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Step 3: Group notifications by user
    const notificationsByUser = new Map<string, NotificationWithContext[]>();
    for (const notif of notifications as NotificationWithContext[]) {
      if (!notificationsByUser.has(notif.user_id)) {
        notificationsByUser.set(notif.user_id, []);
      }
      notificationsByUser.get(notif.user_id)!.push(notif);
    }

    // Step 4: Fetch profiles and auth data for all users
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, display_name")
      .in("id", Array.from(notificationsByUser.keys()));

    const { data: authData } = await supabase.auth.admin.listUsers();
    const emailsByUserId = new Map<string, string>();
    authData.users.forEach((user) => {
      if (user.email) {
        emailsByUserId.set(user.id, user.email);
      }
    });

    // Step 5: Fetch all commenters for all notifications
    const commenterIds = notifications
      .map((n: NotificationWithContext) => n.project_comments?.user_id)
      .filter((id): id is string => !!id);
    const uniqueCommenterIds = [...new Set(commenterIds)];

    const { data: commenters } = await supabase
      .from("profiles")
      .select("id, username, display_name")
      .in("id", uniqueCommenterIds);

    const commentersMap = new Map(
      (commenters || []).map((c) => [c.id, c.display_name || c.username || "Someone"])
    );

    // Step 6: Send digest email to each user
    let emailsSent = 0;

    for (const [userId, userNotifications] of notificationsByUser.entries()) {
      const userProfile = profiles?.find((p) => p.id === userId);
      const userEmail = emailsByUserId.get(userId);

      if (!userEmail || !userProfile) {
        console.warn(`Missing email or profile for user ${userId}`);
        continue;
      }

      const userName = userProfile.display_name || userProfile.username || "there";

      // Build mentions array for digest
      const mentionsForDigest = userNotifications.map((notif) => ({
        projectName: notif.projects?.name || "Unknown Project",
        commentExcerpt: notif.project_comments?.comment || "",
        linkUrl: `${siteUrl}/projects/${notif.project_id}?comment=${notif.comment_id}&highlight=true`,
        commenterName: commentersMap.get(notif.project_comments?.user_id || "") || "Someone",
        context: buildContext(notif),
      }));

      // Send digest email via simple HTML template
      try {
        await sendDigestEmail(userEmail, userName, mentionsForDigest, resendApiKey);
        emailsSent++;
      } catch (emailError) {
        console.error(`Failed to send digest to ${userEmail}:`, emailError);
      }
    }

    return new Response(
      JSON.stringify({ message: `Sent ${emailsSent} digest emails`, sent: emailsSent }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error in send-mention-digest:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
});

/**
 * Build context label for a notification
 */
function buildContext(notification: NotificationWithContext): string | undefined {
  const parts: string[] = [];
  
  if (notification.project_comments?.file_id) {
    parts.push("File comment");
  }
  if (notification.project_comments?.version_id) {
    parts.push("Version comment");
  }
  if (notification.project_comments?.timestamp_ms) {
    const seconds = Math.floor(notification.project_comments.timestamp_ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    parts.push(`at ${minutes}:${secs.toString().padStart(2, "0")}`);
  }
  
  return parts.length > 0 ? parts.join(" ") : undefined;
}

/**
 * Send digest email via Resend
 */
async function sendDigestEmail(
  to: string,
  userName: string,
  mentions: Array<{
    projectName: string;
    commentExcerpt: string;
    linkUrl: string;
    commenterName: string;
    context?: string;
  }>,
  resendApiKey: string
): Promise<void> {
  const mentionsList = mentions.map((mention) => `
    <div style="margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb;">
      <p style="margin: 0 0 8px; color: #1a1a1a; font-size: 15px;">
        <strong>${mention.commenterName}</strong> mentioned you in <strong>${mention.projectName}</strong>
      </p>
      ${mention.context ? `<p style="margin: 0 0 8px; color: #666; font-size: 13px;"><em>${mention.context}</em></p>` : ""}
      <blockquote style="margin: 0 0 12px; padding: 12px 16px; background: #f4f4f5; border-left: 4px solid #3b82f6; border-radius: 4px;">
        <p style="margin: 0; color: #1a1a1a; font-size: 14px; font-style: italic;">
          "${mention.commentExcerpt.slice(0, 160)}"
        </p>
      </blockquote>
      <a href="${mention.linkUrl}" style="color: #3b82f6; text-decoration: underline; font-size: 14px;">
        View Comment →
      </a>
    </div>
  `).join("");

  const baseUrl = mentions[0]?.linkUrl ? mentions[0].linkUrl.split("/projects")[0] : "";
  
  const digestHtml = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"></head>
      <body style="background-color: #f6f9fc; font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Ubuntu,sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px;">
          <h1 style="color: #1a1a1a; font-size: 24px; margin: 0 0 24px;">Daily Mention Digest</h1>
          <p style="color: #333; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
            Hi <strong>${userName}</strong>,
          </p>
          <p style="color: #333; font-size: 16px; line-height: 24px; margin: 0 0 32px;">
            You have <strong>${mentions.length}</strong> new mention${mentions.length === 1 ? "" : "s"} from the last day:
          </p>
          ${mentionsList}
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
          <p style="color: #666; font-size: 12px; line-height: 18px; margin: 0;">
            You received this email because you have daily digest enabled.
            <a href="${baseUrl}/settings/notifications" style="color: #3b82f6; text-decoration: underline;">
              Manage your notification preferences
            </a>
          </p>
        </div>
      </body>
    </html>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "UntitledOne <notifications@untitledone.com>",
      to: [to],
      subject: `Daily Mention Digest - ${mentions.length} new mention${mentions.length === 1 ? "" : "s"}`,
      html: digestHtml,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Resend API error:", errorData);
    throw new Error("Failed to send email");
  }
}

