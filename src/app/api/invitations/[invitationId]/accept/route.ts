import { NextResponse } from "next/server";
import { z } from "zod";
import createServerClient from "@/lib/supabase/server";
import { SupabaseClient } from '@supabase/supabase-js';
import { PostgrestError } from '@supabase/supabase-js';

const paramsSchema = z.object({
	invitationId: z.string().uuid("Invalid invitation ID"),
});

export async function POST(req: Request, { params }: { params: Promise<{ invitationId: string }> }) {
	const supabase = await createServerClient();
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();
	if (authError || !user) {
		return NextResponse.json({ error: "Authentication required" }, { status: 401 });
	}

	const { invitationId } = await params;
	const validation = paramsSchema.safeParse({ invitationId });
	if (!validation.success) {
		return NextResponse.json({ error: "Invalid invitation ID" }, { status: 400 });
	}

	const url = new URL(req.url);
	const token = url.searchParams.get("token");

	// Two flows:
	// 1. Email flow: requires token (external link)
	// 2. In-app flow: authenticated user accepting their own invitation (no token needed)
	
	if (token) {
		// Email-based flow with token
		const { data, error } = await (supabase as SupabaseClient)
			.rpc("accept_invitation", { invitation_id: validation.data.invitationId, raw_token: token });

		if (error) {
			console.error("accept_invitation RPC error:", error);
			const msg = (error as PostgrestError)?.message || "Failed to accept invitation";
			let status = 400;
			const lower = msg.toLowerCase();
			if (lower.includes("not authenticated")) status = 401;
			else if (lower.includes("email mismatch")) status = 403;
			else if (lower.includes("not found") || lower.includes("expired")) status = 410;
			return NextResponse.json({ error: msg }, { status });
		}

		return NextResponse.json({ success: true, project_id: data?.project_id ?? data?.projectId ?? data }, { status: 200 });
	}

	// In-app flow: authenticated user accepting directly
	// Verify the invitation belongs to the user's email
	const { data: invitation, error: fetchError } = await (supabase as SupabaseClient)
		.from("project_invitations")
		.select("id, project_id, email, expires_at, accepted_at")
		.eq("id", validation.data.invitationId)
		.single();

	if (fetchError || !invitation) {
		return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
	}

	if (invitation.email !== user.email) {
		return NextResponse.json({ error: "This invitation is not for you" }, { status: 403 });
	}

	if (invitation.accepted_at) {
		return NextResponse.json({ error: "Invitation already accepted" }, { status: 400 });
	}

	if (new Date(invitation.expires_at) < new Date()) {
		return NextResponse.json({ error: "Invitation has expired" }, { status: 410 });
	}

	// Accept the invitation by updating it
	const { error: updateError } = await (supabase as SupabaseClient)
		.from("project_invitations")
		.update({
			accepted_at: new Date().toISOString(),
			accepted_by: user.id,
		})
		.eq("id", invitation.id);

	if (updateError) {
		console.error("Error accepting invitation:", updateError);
		return NextResponse.json({ error: "Failed to accept invitation" }, { status: 500 });
	}

	// Add user as project member
	const { error: memberError } = await (supabase as SupabaseClient)
		.from("project_members")
		.insert({
			project_id: invitation.project_id,
			user_id: user.id,
			role: "collaborator", // or use invitation.role if available
		});

	if (memberError) {
		console.error("Error adding member:", memberError);
		// Don't fail the request if member add fails (might already exist)
	}

	// Success - return project_id for navigation
	return NextResponse.json({ success: true, project_id: invitation.project_id }, { status: 200 });
}
