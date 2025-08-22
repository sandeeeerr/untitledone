import { NextResponse } from "next/server";
import { z } from "zod";
import { SupabaseClient } from "@supabase/supabase-js";
import createServerClient from "@/lib/supabase/server";

const paramsSchema = z.object({ id: z.string().uuid("Invalid project ID format") });

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const validation = paramsSchema.safeParse({ id });
    if (!validation.success) {
        return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    // Fetch project owner to include in team members
    const { data: projectRow } = await (supabase as SupabaseClient)
        .from("projects")
        .select("id, owner_id, created_at")
        .eq("id", validation.data.id)
        .single();

    const { data, error } = await (supabase as SupabaseClient)
        .from("project_members")
        .select("project_id, user_id, role, added_by, created_at")
        .eq("project_id", validation.data.id)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("project_members select error:", error);
        const code = (error as { code?: string })?.code;
        if (code === "42501") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        if (code === "PGRST116") {
            return NextResponse.json([], { status: 200 });
        }
        return NextResponse.json({ error: (error as { message?: string })?.message || "Failed to load members" }, { status: 500 });
    }

    const members = (data || []) as Array<{ project_id: string; user_id: string; role: string; added_by: string | null; created_at: string }>;

    // Include owner as a team member (role: owner) if not already present
    let combined = members;
    if (projectRow?.owner_id && !members.some(m => m.user_id === projectRow.owner_id)) {
        combined = [
            {
                project_id: validation.data.id,
                user_id: projectRow.owner_id,
                role: "owner",
                added_by: null,
                created_at: projectRow.created_at as string,
            },
            ...members,
        ];
    }

    const userIds = Array.from(new Set(combined.map(m => m.user_id)));
    const profilesById = new Map<string, { id: string; display_name: string | null; username: string | null; avatar_url: string | null }>();
    if (userIds.length > 0) {
        const { data: profilesData } = await (supabase as SupabaseClient)
            .from("profiles")
            .select("id, display_name, username, avatar_url")
            .in("id", userIds);
        for (const pr of profilesData || []) {
            profilesById.set(pr.id, {
                id: pr.id,
                display_name: pr.display_name ?? null,
                username: pr.username ?? null,
                avatar_url: pr.avatar_url ?? null,
            });
        }
    }

    const enriched = combined.map(m => ({
        ...m,
        profile: profilesById.get(m.user_id) ?? null,
    }));

    return NextResponse.json(enriched, { status: 200 });
}


