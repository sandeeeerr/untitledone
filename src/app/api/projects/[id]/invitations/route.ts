import { NextResponse } from "next/server";
import { z } from "zod";
import createServerClient from "@/lib/supabase/server";
import { env } from "@/lib/env";
import crypto from "node:crypto";
import { SupabaseClient } from "@supabase/supabase-js";
export const runtime = "nodejs";

const paramsSchema = z.object({
	id: z.string().uuid("Invalid project ID format"),
});

const inviteBodySchema = z.object({
	email: z.string().email(),
	role: z.string().min(1),
	expiresInHours: z.number().int().positive().max(24 * 14).optional(),
});

function getBaseUrl(req: Request) {
	// Prefer explicit config for production
	const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || process.env.VERCEL_URL;
	if (envUrl) {
		if (envUrl.startsWith("http")) return envUrl;
		return `https://${envUrl}`;
	}
	// Try forwarded headers from proxies/CDNs
	const xfProto = req.headers.get("x-forwarded-proto");
	const xfHost = req.headers.get("x-forwarded-host");
	if (xfHost) {
		return `${xfProto || "https"}://${xfHost}`;
	}
	// Fallback to request URL
	try {
		const url = new URL(req.url);
		return `${url.protocol}//${url.host}`;
	} catch {
		return "http://localhost:3000";
	}
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	const supabase = await createServerClient();
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();
	if (authError || !user) {
		return NextResponse.json({ error: "Authentication required" }, { status: 401 });
	}

	const { id } = await params;
	const validation = paramsSchema.safeParse({ id });
	if (!validation.success) {
		return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
	}

	// Pending invitations for the project (accepted_at is null). RLS restricts visibility.
	const { data, error } = await (supabase as SupabaseClient)
		.from("project_invitations")
		.select("id, project_id, email, role, invited_by, expires_at, created_at, accepted_at")
		.eq("project_id", validation.data.id)
		.is("accepted_at", null)
		.order("created_at", { ascending: false });

	if (error) {
		return NextResponse.json({ error: "Failed to load invitations" }, { status: 500 });
	}

	return NextResponse.json(data ?? [], { status: 200 });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
	const supabase = await createServerClient();
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();
	if (authError || !user) {
		return NextResponse.json({ error: "Authentication required" }, { status: 401 });
	}

	const { id } = await params;
	const paramValidation = paramsSchema.safeParse({ id });
	if (!paramValidation.success) {
		return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
	}

	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	const parsed = inviteBodySchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
	}

	// Owner check (explicit) before creating an invitation
	const { data: project, error: projectError } = await (supabase as SupabaseClient)
		.from("projects")
		.select("id, owner_id, name")
		.eq("id", paramValidation.data.id)
		.single();
	if (projectError || !project) {
		return NextResponse.json({ error: "Project not found" }, { status: 404 });
	}
	if (project.owner_id !== user.id) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	const { email, role } = parsed.data;
	const expiresInHours = parsed.data.expiresInHours ?? 48;
	const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();

	// Generate token and hash
	const rawToken = crypto.randomBytes(32).toString("hex");
	const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

	// Create invitation
	const { data: created, error: insertError } = await (supabase as SupabaseClient)
		.from("project_invitations")
		.insert({
			project_id: project.id,
			email,
			role,
			invited_by: user.id,
			token_hash: tokenHash,
			expires_at: expiresAt,
		})
		.select("id, project_id")
		.single();

	if (insertError || !created) {
		const msg = insertError?.message || "Failed to create invitation";
		const status = msg.toLowerCase().includes("duplicate") ? 409 : 500;
		return NextResponse.json({ error: msg }, { status });
	}

	// Build link and send email (Resend if configured; fallback to log)
	let baseUrl = getBaseUrl(req);
	if (baseUrl.includes('localhost') && process.env.APP_URL) {
		baseUrl = process.env.APP_URL!.startsWith('http') ? String(process.env.APP_URL) : `https://${process.env.APP_URL}`;
	}
	const inviteUrl = `${baseUrl}/invitations/${created.id}?token=${encodeURIComponent(rawToken)}`;

	const { RESEND_API_KEY, MAIL_FROM } = env();
	if (RESEND_API_KEY && MAIL_FROM) {
		try {
			const subject = `Invitation to collaborate on "${project.name ?? 'your project'}"`;
			const text = `You have been invited to collaborate on "${project.name ?? 'a project'}" on UntitledOne.\n\nOpen this link to accept (expires in ${expiresInHours} hours):\n${inviteUrl}\n`;
			const html = `
			  <div style="font-family: Inter, -apple-system, Segoe UI, Roboto, Arial, sans-serif; line-height: 1.6; color: #111827;">
			    <h1 style="font-size: 20px; margin: 0 0 16px;">Invitation to collaborate</h1>
			    <p style="margin: 0 0 8px;">
			      You've been invited to collaborate on <strong>${(project.name ?? 'a project')}</strong> on UntitledOne.
			    </p>
			    <p style="margin: 0 0 16px;">This link expires in ${expiresInHours} hours.</p>
			    <p style="margin: 24px 0 0;">
			      <a href="${inviteUrl}" style="display: inline-block; background: #111827; color: #ffffff; padding: 10px 14px; border-radius: 6px; text-decoration: none;" target="_blank" rel="noreferrer">Accept invitation</a>
			    </p>
			    <p style="margin-top: 24px; font-size: 12px; color: #6b7280;">If the button doesn't work, copy and paste this link in your browser:<br /><em>${inviteUrl}</em></p>
			  </div>`;
			const resp = await fetch("https://api.resend.com/emails", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${RESEND_API_KEY}`,
				},
				body: JSON.stringify({
					from: MAIL_FROM,
					to: [email],
					subject,
					html,
					text,
				}),
			});
		if (!resp.ok) {
			const errText = await resp.text().catch(() => "");
			console.warn(`[invite] Resend responded ${resp.status}: ${errText}`);
			// Development fallback: log invite URL (removed in production by Next.js compiler)
			console.log(`[invite] Fallback link to ${email}: ${inviteUrl}`);
		}
	} catch (e) {
		console.warn("[invite] Email send failed, falling back to log:", e);
		// Development fallback: log invite URL (removed in production by Next.js compiler)
		console.log(`[invite] Send to ${email}: ${inviteUrl}`);
	}
} else {
	// Development fallback: log invite URL when email service not configured (removed in production by Next.js compiler)
	console.log(`[invite] (no RESEND_API_KEY/MAIL_FROM) Send to ${email}: ${inviteUrl}`);
	}

	return NextResponse.json({ id: created.id, project_id: created.project_id }, { status: 201 });
}
