import { NextResponse } from 'next/server'
import createClient from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { ids } = await req.json().catch(() => ({ ids: [] as string[] }))
  if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({}, { status: 200 })

  // Fetch project updated_at
  const { data: projects, error: projErr } = await supabase
    .from('projects')
    .select('id, updated_at')
    .in('id', ids)
  if (projErr) return NextResponse.json({ error: projErr.message }, { status: 500 })

  // Fetch latest activity per project via activity_changes / project_versions
  const { data: changes } = await supabase
    .from('activity_changes')
    .select('version_id, created_at')
    .order('created_at', { ascending: false })
    .limit(1000)

  const { data: versions } = await supabase
    .from('project_versions')
    .select('id, project_id, created_at')

  const vById = new Map((versions ?? []).map(v => [v.id, v]))

  const map: Record<string, string> = {}
  for (const p of projects ?? []) {
    map[p.id] = p.updated_at
  }
  for (const ch of changes ?? []) {
    const v = vById.get(ch.version_id)
    if (v) {
      const ts = new Date(ch.created_at).toISOString()
      if (!map[v.project_id] || new Date(map[v.project_id]).getTime() < new Date(ts).getTime()) {
        map[v.project_id] = ts
      }
    }
  }

  return NextResponse.json(map)
}


