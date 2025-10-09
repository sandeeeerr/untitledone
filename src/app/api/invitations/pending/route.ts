import { NextResponse } from "next/server";
import createServerClient from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * GET /api/invitations/pending
 * Returns all pending project invitations for the current user
 */
export async function GET() {
	const supabase = await createServerClient();
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();

	if (authError || !user || !user.email) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		// Get pending invitations for current user's email
		const { data, error } = await (supabase as SupabaseClient)
			.from("project_invitations")
			.select(
				`
        id,
        project_id,
        role,
        created_at,
        expires_at,
        invited_by,
        projects!inner (
          id,
          name,
          description,
          genre,
          is_private,
          owner_id,
          profiles!projects_owner_id_fkey (
            id,
            display_name,
            username,
            avatar_url
          )
        )
      `,
			)
			.eq("email", user.email)
			.is("accepted_at", null)
			.gt("expires_at", new Date().toISOString())
			.order("created_at", { ascending: false });

		if (error) {
			console.error("Error fetching pending invitations:", error);
			return NextResponse.json(
				{ error: "Failed to load invitations" },
				{ status: 500 },
			);
		}

		return NextResponse.json(data ?? []);
	} catch (error) {
		console.error("Unexpected error fetching pending invitations:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

