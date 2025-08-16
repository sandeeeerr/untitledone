import { NextResponse } from "next/server";
import createServerClient from "@/lib/supabase/server";

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

export async function GET() {
	const supabase = await createServerClient();
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();

	if (authError) return NextResponse.json({ error: authError.message }, { status: 401 });
	if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	// Haal projecten op die de gebruiker bezit of waar ze member van zijn
	const { data, error } = await (supabase as any)
		.from("projects")
		.select(`
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
		`)
		.or(`owner_id.eq.${user.id},is_private.eq.false`)
		.order("updated_at", { ascending: false });

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json(data || [], { status: 200 });
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

	const insertPayload: Record<string, any> = {
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

	const { data, error } = await (supabase as any)
		.from("projects")
		.insert(insertPayload)
		.select("id, name, genre, is_private, downloads_enabled, created_at")
		.single();

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}

	return NextResponse.json(data, { status: 201 });
} 