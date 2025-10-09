import { NextResponse } from 'next/server'
import createClient from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function DELETE(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Temporary until types include `project_pins`
  const { error } = await (supabase as unknown as SupabaseClient)
    .from('project_pins')
    .delete()
    .eq('user_id', user.id)
    .eq('project_id', projectId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}


