import { NextResponse } from "next/server";
import { z } from "zod";
import createServerClient from "@/lib/supabase/server";

// Zod schema voor params validatie
const paramsSchema = z.object({
  id: z.string().uuid("Invalid project ID format"),
});

// Type voor de geselecteerde project data (alleen publieke velden)
type ProjectResponse = {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  genre: string | null;
  is_private: boolean;
  downloads_enabled: boolean;
  daw_info: Record<string, any>;
  plugins_used: Array<{ name: string; version?: string }>;
  status: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient();
    
    // Authenticatie check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Params validatie
    const { id } = await params;
    const validation = paramsSchema.safeParse({ id });
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    // Project ophalen met RLS policies (geen handmatige toegangscontrole)
    // Gebruik type assertion voor nu tot we de types hebben geregenereerd
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
        daw_info,
        plugins_used,
        status,
        created_at,
        updated_at,
        likes_count
      `)
      .eq("id", validation.data.id)
      .single();

    if (error) {
      // Gebruik RLS policies voor toegangscontrole - geen handmatige checks
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        );
      }
      
      // Log error voor debugging (in productie zou je dit naar een logging service sturen)
      console.error("Project fetch error:", error);
      
      return NextResponse.json(
        { error: "Failed to fetch project" },
        { status: 500 }
      );
    }

    // Strip gevoelige data - owner_id wordt niet geretourneerd
    const projectData: ProjectResponse = {
      id: data.id,
      name: data.name,
      description: data.description,
      tags: data.tags,
      genre: data.genre,
      is_private: data.is_private,
      downloads_enabled: data.downloads_enabled,
      daw_info: data.daw_info,
      plugins_used: data.plugins_used,
      status: data.status,
      created_at: data.created_at,
      updated_at: data.updated_at,
      likes_count: data.likes_count,
    };

    return NextResponse.json(projectData, { status: 200 });

  } catch (error) {
    // Catch alle onverwachte errors
    console.error("Unexpected error in project route:", error);
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 

// Helper functions (duplicated from collection route to avoid cross-imports)
function parseTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string" && item.trim().length > 0);
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
    return value
      .filter((item) => item && typeof item === "object" && "name" in item && typeof (item as any).name === "string")
      .map((item: any) => ({ name: item.name, version: typeof item.version === "string" ? item.version : undefined }));
  }
  if (typeof value === "string") {
    const items = value
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    return items.map((item) => {
      const atParts = item.split("@");
      if (atParts.length === 2) return { name: atParts[0].trim(), version: atParts[1].trim() };
      const colonParts = item.split(":");
      if (colonParts.length === 2) return { name: colonParts[0].trim(), version: colonParts[1].trim() };
      const vMatch = item.match(/^(.*)\s+v(\S+)$/i);
      if (vMatch) return { name: vMatch[1].trim(), version: vMatch[2].trim() };
      return { name: item };
    });
  }
  return [];
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const input = body as Partial<{
      name: string;
      description: string;
      tags: string | string[];
      genre: string;
      is_private: boolean;
      downloads_enabled: boolean;
      daw_name: string;
      daw_version: string;
      plugins: string | Array<{ name: string; version?: string }>;
    }>;

    const updatePayload: Record<string, any> = {};
    if (typeof input.name === "string" && input.name.trim().length > 0) updatePayload.name = input.name.trim();
    if (typeof input.description === "string") updatePayload.description = input.description.trim() || null;
    if (typeof input.genre === "string") updatePayload.genre = input.genre.trim() || null;
    if (typeof input.is_private === "boolean") updatePayload.is_private = input.is_private;
    if (typeof input.downloads_enabled === "boolean") updatePayload.downloads_enabled = input.downloads_enabled;
    if (typeof input.tags !== "undefined") updatePayload.tags = parseTags(input.tags);

    const dawInfo: Record<string, any> = {};
    if (typeof input.daw_name === "string" && input.daw_name.trim()) dawInfo.name = input.daw_name.trim();
    if (typeof input.daw_version === "string" && input.daw_version.trim()) dawInfo.version = input.daw_version.trim();
    if (Object.keys(dawInfo).length) updatePayload.daw_info = dawInfo; else if ("daw_name" in input || "daw_version" in input) updatePayload.daw_info = {};

    if (typeof input.plugins !== "undefined") updatePayload.plugins_used = parsePlugins(input.plugins);

    if (!Object.keys(updatePayload).length) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await (supabase as any)
      .from("projects")
      .update(updatePayload)
      .eq("id", validation.data.id)
      .select(`
        id,
        name,
        description,
        tags,
        genre,
        is_private,
        downloads_enabled,
        daw_info,
        plugins_used,
        status,
        created_at,
        updated_at,
        likes_count
      `)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
    }

    const projectData: ProjectResponse = {
      id: data.id,
      name: data.name,
      description: data.description,
      tags: data.tags,
      genre: data.genre,
      is_private: data.is_private,
      downloads_enabled: data.downloads_enabled,
      daw_info: data.daw_info,
      plugins_used: data.plugins_used,
      status: data.status,
      created_at: data.created_at,
      updated_at: data.updated_at,
      likes_count: data.likes_count,
    };

    return NextResponse.json(projectData, { status: 200 });
  } catch (error) {
    console.error("Unexpected error in project update route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}