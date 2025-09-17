export type ProjectPin = {
  project_id: string;
  created_at: string;
}

export async function listPins(): Promise<ProjectPin[]> {
  const res = await fetch('/api/pins', { method: 'GET' });
  if (!res.ok) throw new Error('Failed to load pins');
  return (await res.json()) as ProjectPin[];
}

export async function pinProject(projectId: string): Promise<void> {
  const res = await fetch('/api/pins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId }),
  });
  if (!res.ok) throw new Error('Failed to pin project');
}

export async function unpinProject(projectId: string): Promise<void> {
  const res = await fetch(`/api/pins/${projectId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to unpin project');
}


