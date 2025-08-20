import { NextResponse } from "next/server";
import { z } from "zod";
import createServerClient from "@/lib/supabase/server";

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
	if (!token) {
		return NextResponse.json({ error: "Missing token" }, { status: 400 });
	}

	// Call RPC to accept invitation
	const { data, error } = await (supabase as any)
		.rpc("accept_invitation", { invitation_id: validation.data.invitationId, raw_token: token });

	if (error) {
		console.error("accept_invitation RPC error:", error);
		const msg = (error as any)?.message || "Failed to accept invitation";
		let status = 400;
		const lower = msg.toLowerCase();
		if (lower.includes("not authenticated")) status = 401;
		else if (lower.includes("email mismatch")) status = 403;
		else if (lower.includes("not found") || lower.includes("expired")) status = 410;
		return NextResponse.json({ error: msg }, { status });
	}

	// Expect RPC to return project_id for redirect
	return NextResponse.json({ success: true, project_id: data?.project_id ?? data?.projectId ?? data }, { status: 200 });
}


