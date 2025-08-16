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