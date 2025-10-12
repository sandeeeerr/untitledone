/**
 * Email Sending Utilities
 * 
 * Server-side functions for sending emails via Resend API
 * Uses React Email templates for consistent formatting
 */

import { render } from "@react-email/render";
import { MentionEmail } from "@/components/templates/mention-email";
import { env } from "@/lib/env";

/**
 * Send a mention notification email
 * 
 * @param to - Recipient email address
 * @param userName - Recipient's display name or username
 * @param projectName - Name of the project where the mention occurred
 * @param commentExcerpt - Comment text excerpt (max 160 chars)
 * @param linkUrl - Deep link to the comment
 * @param commenterName - Name of the person who mentioned the user
 * @param context - Optional context (e.g., "File: drums.wav at 1:23")
 * @returns Promise that resolves when email is sent
 * 
 * @example
 * await sendMentionEmail(
 *   "user@example.com",
 *   "John Doe",
 *   "Summer Vibes EP",
 *   "Hey @john, can you review this?",
 *   "https://app.com/projects/123?comment=456",
 *   "Sarah Chen",
 *   "File: drums.wav"
 * );
 */
export async function sendMentionEmail(
  to: string,
  userName: string,
  projectName: string,
  commentExcerpt: string,
  linkUrl: string,
  commenterName: string,
  context?: string
): Promise<void> {
  const envVars = env();
  
  if (!envVars.RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    throw new Error("Email service not configured");
  }

  // Render the email template to HTML
  const emailHtml = await render(
    MentionEmail({
      userName,
      projectName,
      commentExcerpt: commentExcerpt.slice(0, 160), // Ensure max 160 chars
      linkUrl,
      commenterName,
      context,
    })
  );

  // Send email via Resend API
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${envVars.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "UntitledOne <notifications@untitledone.com>", // TODO: Update with your verified domain
      to: [to],
      subject: `${commenterName} mentioned you in ${projectName}`,
      html: emailHtml,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Failed to send email via Resend:", errorData);
    throw new Error("Failed to send email");
  }

  const data = await response.json();
  console.log("Email sent successfully:", data.id);
}

/**
 * Send a daily digest of mentions
 * 
 * @param to - Recipient email address
 * @param userName - Recipient's display name or username
 * @param mentions - Array of mention objects with project, comment, and commenter info
 * @returns Promise that resolves when email is sent
 */
export async function sendMentionDigest(
  to: string,
  userName: string,
  mentions: Array<{
    projectName: string;
    commentExcerpt: string;
    linkUrl: string;
    commenterName: string;
    context?: string;
  }>
): Promise<void> {
  const envVars = env();
  
  if (!envVars.RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured");
    throw new Error("Email service not configured");
  }

  if (mentions.length === 0) {
    return; // Nothing to send
  }

  // Build HTML for digest (simple list of mentions)
  const mentionsList = mentions.map((mention, index) => `
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
            <a href="${linkUrl.split("/projects")[0]}/settings/notifications" style="color: #3b82f6; text-decoration: underline;">
              Manage your notification preferences
            </a>
          </p>
        </div>
      </body>
    </html>
  `;

  // Send email via Resend API
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${envVars.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "UntitledOne <notifications@untitledone.com>", // TODO: Update with your verified domain
      to: [to],
      subject: `Daily Mention Digest - ${mentions.length} new mention${mentions.length === 1 ? "" : "s"}`,
      html: digestHtml,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Failed to send digest email via Resend:", errorData);
    throw new Error("Failed to send digest email");
  }

  const data = await response.json();
  console.log("Digest email sent successfully:", data.id);
}

/**
 * Helper to extract base URL from a full URL
 */
function getBaseUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}`;
  } catch {
    return url;
  }
}

