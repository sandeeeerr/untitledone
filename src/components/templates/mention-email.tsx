import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface MentionEmailProps {
  /** User's display name or username */
  userName: string;
  /** Name of the project where the mention occurred */
  projectName: string;
  /** Comment text excerpt (max 160 chars) */
  commentExcerpt: string;
  /** Full URL to view the comment (deep link) */
  linkUrl: string;
  /** Name of the commenter who mentioned the user */
  commenterName: string;
  /** Optional context info (e.g., "File: drums.wav at 1:23" or "Version: v1.0") */
  context?: string;
}

/**
 * Mention Email Template
 * 
 * Email template for @mention notifications
 * Sent when a user is mentioned in a project comment
 * 
 * Used for both instant and daily digest emails
 */
export function MentionEmail({
  userName,
  projectName,
  commentExcerpt,
  linkUrl,
  commenterName,
  context,
}: MentionEmailProps) {
  const previewText = `${commenterName} mentioned you in ${projectName}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Heading style={h1}>You were mentioned</Heading>
          
          <Text style={text}>
            Hi <strong>{userName}</strong>,
          </Text>
          
          <Text style={text}>
            <strong>{commenterName}</strong> mentioned you in <strong>{projectName}</strong>:
          </Text>

          {/* Comment excerpt */}
          <Section style={commentBox}>
            <Text style={comment}>
              "{commentExcerpt}"
            </Text>
          </Section>

          {/* Context (file, version, timestamp) */}
          {context && (
            <Text style={contextText}>
              <em>{context}</em>
            </Text>
          )}

          {/* CTA Button */}
          <Section style={buttonContainer}>
            <Button style={button} href={linkUrl}>
              View Comment
            </Button>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Text style={footer}>
            You received this email because you have mention notifications enabled.{" "}
            <Link href={`${linkUrl.split("/projects")[0]}/settings/notifications`} style={link}>
              Manage your notification preferences
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Default props for preview
MentionEmail.PreviewProps = {
  userName: "John Doe",
  projectName: "Summer Vibes EP",
  commentExcerpt: "Hey @john, can you review the mixing on the kick drum? I think it needs more punch around 2:30.",
  linkUrl: "https://untitledone.com/projects/abc123?comment=xyz789&file=def456&t=150",
  commenterName: "Sarah Chen",
  context: "File: drums.wav at 2:30",
} as MentionEmailProps;

export default MentionEmail;

// Styles (inline for email compatibility)
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0 40px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
  padding: "0 40px",
};

const commentBox = {
  backgroundColor: "#f4f4f5",
  borderLeft: "4px solid #3b82f6",
  borderRadius: "4px",
  margin: "24px 40px",
  padding: "16px 20px",
};

const comment = {
  color: "#1a1a1a",
  fontSize: "15px",
  lineHeight: "22px",
  fontStyle: "italic",
  margin: "0",
};

const contextText = {
  color: "#666",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "8px 0 24px",
  padding: "0 40px",
};

const buttonContainer = {
  padding: "0 40px",
  margin: "32px 0",
};

const button = {
  backgroundColor: "#3b82f6",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 24px",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "32px 40px",
};

const footer = {
  color: "#666",
  fontSize: "12px",
  lineHeight: "18px",
  padding: "0 40px",
  margin: "16px 0",
};

const link = {
  color: "#3b82f6",
  textDecoration: "underline",
};

