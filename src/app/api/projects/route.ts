import { NextResponse } from "next/server";
import createServerClient from "@/lib/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";

// Helper functions to handle both arrays and CSV strings
function parseTags(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.filter(item => typeof item === 'string' && item.trim().length > 0);
	}
	if (typeof value === "string") {
		return value
			.split(",")
			.map((s) => s.trim())
			.filter((s) => s.length > 0);
	}
	return [];
}

function parsePlugins(value: unknown): Array<{ name: string; version?: string }> {
	if (Array.isArray(value)) {
		return value.filter(item => 
			item && typeof item === 'object' && 'name' in item && typeof item.name === 'string'
		).map(item => ({
			name: item.name,
			version: 'version' in item && typeof item.version === 'string' ? item.version : undefined
		}));
	}
	if (typeof value === "string") {
		const items = value
			.split(",")
			.map((s) => s.trim())
			.filter((s) => s.length > 0);
		return items.map((item) => {
			// Support formats: "Name@1.2", "Name:1.2", "Name v1.2", or just "Name"
			const atParts = item.split("@");
			if (atParts.length === 2) {
				return { name: atParts[0].trim(), version: atParts[1].trim() };
			}
			const colonParts = item.split(":");
			if (colonParts.length === 2) {
				return { name: colonParts[0].trim(), version: colonParts[1].trim() };
			}
			const vMatch = item.match(/^(.*)\s+v(\S+)$/i);
			if (vMatch) {
				return { name: vMatch[1].trim(), version: vMatch[2].trim() };
			}
			return { name: item };
		});
	}
	return [];
}

export async function GET(req: Request) {
	const supabase = await createServerClient();

	// Public listing by owner username doesn't require auth
	const url = new URL(req.url);
	const ownerUsername = url.searchParams.get('owner_username');

	let authedUser: { id: string } | null = null;
	if (!ownerUsername) {
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError) return NextResponse.json({ error: authError.message }, { status: 401 });
		if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		authedUser = { id: user.id };
	}

	// Haal projecten op die de gebruiker bezit of waar ze member van zijn
	const baseSelect = `
		id,
		name,
		description,
		tags,
		genre,
		is_private,
		downloads_enabled,
		status,
		created_at,
		updated_at,
		owner_id
	`;

	let data: unknown;
	let error: { message: string } | null = null;

	let query = (supabase as SupabaseClient)
		.from("projects")
		.select(baseSelect)
		.order("updated_at", { ascending: false });

	if (ownerUsername) {
		// Filter by owner username; include private if the viewer is the owner
		const { data: profile } = await supabase
			.from('profiles')
			.select('id, username')
			.eq('username', ownerUsername)
			.single();
		if (!profile) {
			return NextResponse.json([], { status: 200 });
		}

		const { data: auth } = await supabase.auth.getUser();
		const isOwnerViewing = Boolean(auth?.user && auth.user.id === profile.id);

		query = query.eq('owner_id', profile.id);
		if (!isOwnerViewing) {
			query = query.eq('is_private', false);
		}
	} else {
		// Return projects owned by the current user OR where the user is a member
		const [{ data: owned, error: ownedErr }, { data: memberData, error: memberErr }] = await Promise.all([
			(supabase as SupabaseClient)
				.from("projects")
				.select(baseSelect)
				.eq('owner_id', authedUser!.id)
				.order('updated_at', { ascending: false }),
			(supabase as SupabaseClient)
				.from("projects")
				.select(baseSelect + `, project_members!inner(user_id)`) // inner join to filter by membership
				.eq('project_members.user_id', authedUser!.id)
				.order('updated_at', { ascending: false }),
		]);

		if (ownedErr) {
			return NextResponse.json({ error: ownedErr.message }, { status: 500 });
		}
		if (memberErr) {
			return NextResponse.json({ error: memberErr.message }, { status: 500 });
		}

		// Merge unique by id
		type ProjectData = { id: string; name: string; description: string | null; tags: string[] | null; genre: string | null; is_private: boolean; downloads_enabled: boolean; status: string; created_at: string; updated_at: string; owner_id: string };
		const byId = new Map<string, ProjectData>();
		for (const p of owned || []) byId.set(p.id, p);
		for (const p of memberData || []) {
			if (p && typeof p === 'object' && 'id' in p) {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { project_members, ...projectData } = p as ProjectData & { project_members: unknown };
				byId.set(projectData.id, projectData);
			}
		}

		data = Array.from(byId.values());
		error = null;
		// fall through to enrichment
	}

	if (typeof data === 'undefined') {
		const res = await query;
		data = res.data;
		error = res.error;
	}

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	// Enrich with owner profile and default counts
	const projects = (data || []) as Array<{
		id: string;
		name: string;
		description: string | null;
		tags: string[] | null;
		genre: string | null;
		is_private: boolean;
		downloads_enabled: boolean;
		status: string;
		created_at: string;
		updated_at: string;
		owner_id: string;
	}>;

	const ownerIds = Array.from(new Set(projects.map((p) => p.owner_id)));
	const profilesById = new Map<string, { id: string; display_name: string | null; username: string | null; avatar_url: string | null }>();
	if (ownerIds.length > 0) {
		const { data: profilesData } = await supabase
			.from("profiles")
			.select("id, display_name, username, avatar_url")
			.in("id", ownerIds);
		for (const pr of profilesData || []) {
			profilesById.set(pr.id, {
				id: pr.id,
				display_name: pr.display_name ?? null,
				username: pr.username ?? null,
				avatar_url: pr.avatar_url ?? null,
			});
		}
	}

	// Get member counts for all projects
	const memberCounts = new Map<string, number>();
	const fileCounts = new Map<string, number>();
	
	if (projects.length > 0) {
		const projectIds = projects.map(p => p.id);
		
		// Get member counts (including owner)
		const { data: memberCountData } = await supabase
			.from('project_members')
			.select('project_id')
			.in('project_id', projectIds);
			
		// Count members per project (+ 1 for owner)
		for (const member of memberCountData || []) {
			const current = memberCounts.get(member.project_id) || 0;
			memberCounts.set(member.project_id, current + 1);
		}
		
		// Add owner to count for each project (owner is not in project_members table)
		for (const project of projects) {
			const currentCount = memberCounts.get(project.id) || 0;
			memberCounts.set(project.id, currentCount + 1); // +1 for owner
		}
		
		// Get file counts
		const { data: fileCountData } = await supabase
			.from('project_files')
			.select('project_id')
			.in('project_id', projectIds);
			
		// Count files per project
		for (const file of fileCountData || []) {
			const current = fileCounts.get(file.project_id) || 0;
			fileCounts.set(file.project_id, current + 1);
		}
	}

	const enriched = projects.map((p) => {
		const profile = profilesById.get(p.owner_id);
		return {
			...p,
			// client expects arrays
			tags: Array.isArray(p.tags) ? (p.tags as string[]) : [],
			// real counts from database
			file_count: fileCounts.get(p.id) || 0,
			collaborators_count: memberCounts.get(p.id) || 1, // at least owner
			likes_count: 0, // TODO: implement likes system
			creator: profile
				? {
					id: profile.id,
					name: (profile.display_name || profile.username || "") as string,
					avatar: profile.avatar_url || undefined,
				}
				: undefined,
		};
	});

	return NextResponse.json(enriched, { status: 200 });
}

export async function POST(req: Request) {
	const supabase = await createServerClient();
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();

	if (authError) return NextResponse.json({ error: authError.message }, { status: 401 });
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
	}

	const input = body as Partial<{
		name: string;
		description: string;
		tags: string | string[]; // Accept both CSV and arrays
		genre: string;
		is_private: boolean;
		downloads_enabled: boolean;
		daw_name: string;
		daw_version: string;
		plugins: string | Array<{ name: string; version?: string }>; // Accept both CSV and arrays
	}>;

	const errors: string[] = [];
	if (!input.name || typeof input.name !== "string" || input.name.trim().length === 0) {
		errors.push("name is required");
	}
	if (typeof input.description !== "undefined" && typeof input.description !== "string") {
		errors.push("description must be a string");
	}
	if (typeof input.genre !== "undefined" && typeof input.genre !== "string") {
		errors.push("genre must be a string");
	}
	if (typeof input.is_private !== "undefined" && typeof input.is_private !== "boolean") {
		errors.push("is_private must be a boolean");
	}
	if (typeof input.downloads_enabled !== "undefined" && typeof input.downloads_enabled !== "boolean") {
		errors.push("downloads_enabled must be a boolean");
	}
	if (typeof input.daw_name !== "undefined" && typeof input.daw_name !== "string") {
		errors.push("daw_name must be a string");
	}
	if (typeof input.daw_version !== "undefined" && typeof input.daw_version !== "string") {
		errors.push("daw_version must be a string");
	}

	if (errors.length) {
		return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
	}

	const name = (input.name as string).trim();
	const tagsArray = parseTags(input.tags);
	const dawInfo = {
		...(input.daw_name ? { name: input.daw_name } : {}),
		...(input.daw_version ? { version: input.daw_version } : {}),
	};
	const pluginsArray = parsePlugins(input.plugins);

	type InsertPayload = {
		name: string;
		description: string | null;
		tags: string[];
		genre: string | null;
		owner_id: string;
		is_private: boolean;
		downloads_enabled: boolean;
		daw_info: Record<string, string> | {};
		plugins_used: Array<{ name: string; version?: string }>;
		status: string;
	};

	const insertPayload: InsertPayload = {
		name,
		description: input.description?.trim() ?? null,
		tags: tagsArray,
		genre: input.genre?.trim() ?? null,
		owner_id: user.id,
		is_private: Boolean(input.is_private ?? false),
		downloads_enabled: Boolean(input.downloads_enabled ?? true),
		daw_info: Object.keys(dawInfo).length ? dawInfo : {},
		plugins_used: pluginsArray,
		status: "active",
	};

	const { data, error } = await (supabase as SupabaseClient)
		.from("projects")
		.insert(insertPayload)
		.select("id, name, genre, is_private, downloads_enabled, created_at")
		.single();

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json(data, { status: 201 });
} 