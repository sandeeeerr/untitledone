import { NextResponse } from 'next/server'
import createClient from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await (supabase as unknown as SupabaseClient)
    .from('project_pins')
    .select('project_id, created_at')
    .order('created_at', { ascending: false })
    .limit(3)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const body = await req.json()
  const projectId = String(body?.projectId || '')
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await (supabase as unknown as SupabaseClient).from('project_pins').insert({ user_id: user.id, project_id: projectId })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}


