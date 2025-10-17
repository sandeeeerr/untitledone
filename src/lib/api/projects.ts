export type CreateProjectInput = {
	name: string;
	description?: string;
	tags?: string[]; // Now directly as array
	genre?: string;
	is_private: boolean;
	downloads_enabled: boolean;
	daw_name?: string;
	daw_version?: string;
	plugins?: Array<{ name: string; version?: string }>; // Now directly as array
};

export type CreatedProject = {
	id: string;
	name: string;
	genre: string | null;
	is_private: boolean;
	downloads_enabled: boolean;
	created_at: string;
};

export type Project = {
	id: string;
	name: string;
	description: string | null;
	tags: string[];
	genre: string | null;
	is_private: boolean;
	downloads_enabled: boolean;
	daw_info: Record<string, string>;
	plugins_used: Array<{ name: string; version?: string }>;
	status: string | null;
	created_at: string;
	updated_at: string;
	owner_id: string;
	likes_count: number;
	file_count?: number;
	collaborators_count?: number;
	creator?: {
		id: string;
		name: string;
		avatar?: string;
	};
};

export async function getProjects(): Promise<Project[]> {
	const res = await fetch("/api/projects", {
		method: "GET",
		headers: { "Content-Type": "application/json" },
	});

	if (!res.ok) {
		let message = "Failed to fetch projects";
		try {
			const body = await res.json();
			if (body?.error) message = body.error as string;
		} catch {}
		throw new Error(message);
	}

	return (await res.json()) as Project[];
}

export async function getProject(id: string): Promise<Project> {
	const res = await fetch(`/api/projects/${id}`, {
		method: "GET",
		headers: { "Content-Type": "application/json" },
	});

	if (!res.ok) {
		let message = "Failed to fetch project";
		try {
			const body = await res.json();
			if (body?.error) message = body.error as string;
		} catch {}
		throw new Error(message);
	}

	return (await res.json()) as Project;
}

export async function createProject(payload: CreateProjectInput): Promise<CreatedProject> {
	const res = await fetch("/api/projects", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});

	if (!res.ok) {
		let message = "Failed to create project";
		try {
			const body = await res.json();
			if (body?.error) message = body.error as string;
		} catch {}
		throw new Error(message);
	}

	return (await res.json()) as CreatedProject;
} 

export type UpdateProjectInput = Partial<CreateProjectInput> & {
	name?: string;
};

export async function updateProject(id: string, payload: UpdateProjectInput): Promise<Project> {
	const res = await fetch(`/api/projects/${id}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});

	if (!res.ok) {
		let message = "Failed to update project";
		try {
			const body = await res.json();
			if (body?.error) message = body.error as string;
		} catch {}
		throw new Error(message);
	}

	return (await res.json()) as Project;
}

export async function deleteProject(id: string): Promise<void> {
	const res = await fetch(`/api/projects/${id}`, {
		method: "DELETE",
	});

	if (!res.ok) {
		let message = "Failed to delete project";
		try {
			const body = await res.json();
			if (body?.error) message = body.error as string;
		} catch {}
		throw new Error(message);
	}
}

// Invitations
export type ProjectInvitationInsert = {
	email: string;
	role: string;
	expiresInHours?: number;
};

export type ProjectInvitation = {
	id: string;
	project_id: string;
	email: string;
	role: string;
	invited_by: string;
	expires_at: string;
	accepted_at: string | null;
	created_at: string;
};

export async function listProjectInvitations(projectId: string): Promise<ProjectInvitation[]> {
	const res = await fetch(`/api/projects/${projectId}/invitations`, { method: "GET" });
	if (!res.ok) {
		let message = "Failed to load invitations";
		try {
			const body = await res.json();
			if (body?.error) message = body.error as string;
		} catch {}
		throw new Error(message);
	}
	return (await res.json()) as ProjectInvitation[];
}

export async function createProjectInvitation(projectId: string, payload: ProjectInvitationInsert): Promise<{ id: string; project_id: string }> {
	const res = await fetch(`/api/projects/${projectId}/invitations`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});
	if (!res.ok) {
		let message = "Failed to create invitation";
		try {
			const body = await res.json();
			if (body?.error) message = body.error as string;
		} catch {}
		throw new Error(message);
	}
	return (await res.json()) as { id: string; project_id: string };
}

export async function acceptInvitation(invitationId: string, token: string): Promise<{ project_id: string }> {
	const res = await fetch(`/api/invitations/${invitationId}/accept?token=${encodeURIComponent(token)}`, {
		method: "POST",
	});
	if (!res.ok) {
		let message = "Failed to accept invitation";
		try {
			const body = await res.json();
			if (body?.error) message = body.error as string;
		} catch {}
		throw new Error(message);
	}
	const body = await res.json();
	return { project_id: body.project_id };
}

// Members
export type ProjectMember = {
	project_id: string;
	user_id: string;
	role: string;
	added_by: string | null;
	created_at: string;
	profile?: { id: string; display_name: string | null; username: string | null; avatar_url: string | null } | null;
};

export async function listProjectMembers(projectId: string): Promise<ProjectMember[]> {
	const res = await fetch(`/api/projects/${projectId}/members`, { method: "GET" });
	if (!res.ok) {
		let message = "Failed to load members";
		try {
			const body = await res.json();
			if (body?.error) message = body.error as string;
		} catch {}
		throw new Error(message);
	}
	return (await res.json()) as ProjectMember[];
}

export async function leaveProject(projectId: string): Promise<{ success: boolean; project_id: string }> {
	const res = await fetch(`/api/projects/${projectId}/leave`, { method: "POST" });
	if (!res.ok) {
		let message = "Failed to leave project";
		try {
			const body = await res.json();
			if (body?.error) message = body.error as string;
		} catch {}
		throw new Error(message);
	}
	return (await res.json()) as { success: boolean; project_id: string };
}

// Files
export type ProjectFile = {
	id: string;
	filename: string;
	fileSize: number;
	fileType: string;
	versionName: string | null;
	uploadedAt: string;
	uploadedBy: {
		name: string;
		avatar: string | null;
	};
	description: string | null;
	storageProvider: 'local' | 'dropbox' | 'google_drive';
};

export type ProjectFileDetail = {
	id: string;
	filename: string;
	filePath: string;
	fileSize: number;
	fileType: string;
	uploadedAt: string;
	uploadedBy: {
		id: string;
		name: string;
		username: string | null;
		avatar: string | null;
	};
	description: string | null;
	version: {
		id: string;
		name: string;
		description: string;
	} | null;
	project: {
		id: string;
		name: string;
	};
};

export type UploadFileInput = {
	file: File;
	description?: string;
	versionId?: string;
	storageProvider?: 'local' | 'dropbox' | 'google_drive';
};

export async function uploadProjectFile(projectId: string, payload: UploadFileInput): Promise<{ id: string; filename: string; uploaded_at: string }> {
	// For large files (>4.5MB) with local storage, upload directly to Supabase Storage
	// to bypass Vercel's 4.5MB request limit
	const isLargeFile = payload.file.size > 4.5 * 1024 * 1024; // 4.5MB
	const isLocalStorage = (payload.storageProvider || 'local') === 'local';
	
	if (isLargeFile && isLocalStorage) {
		// Direct upload to Supabase Storage
		const { createClient } = await import('@supabase/supabase-js');
		const supabase = createClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
		);
		
		const key = `${projectId}/${crypto.randomUUID()}-${payload.file.name}`;
		const { error: uploadError } = await supabase.storage
			.from('project-files')
			.upload(key, payload.file, {
				contentType: payload.file.type || 'application/octet-stream',
				cacheControl: '3600'
			});
		
		if (uploadError) {
			throw new Error(`Upload failed: ${uploadError.message}`);
		}
		
		// Send metadata to our API
		const form = new FormData();
		form.append("uploadedPath", key);
		form.append("size", payload.file.size.toString());
		form.append("type", payload.file.type || 'application/octet-stream');
		form.append("name", payload.file.name);
		if (payload.description) form.append("description", payload.description);
		if (payload.versionId) form.append("versionId", payload.versionId);
		form.append("storageProvider", "local");

		const res = await fetch(`/api/projects/${projectId}/files`, {
			method: "POST",
			body: form,
		});

		if (!res.ok) {
			let message = "Failed to save file metadata";
			try {
				const body = await res.json();
				if (body?.error) message = body.error as string;
			} catch {}
			throw new Error(message);
		}

		return (await res.json()) as { id: string; filename: string; uploaded_at: string };
	}
	
	// Original flow for small files or external storage
	const form = new FormData();
	form.append("file", payload.file);
	if (payload.description) form.append("description", payload.description);
	if (payload.versionId) form.append("versionId", payload.versionId);
	if (payload.storageProvider) form.append("storageProvider", payload.storageProvider);

	const res = await fetch(`/api/projects/${projectId}/files`, {
		method: "POST",
		body: form,
	});

	if (!res.ok) {
		let message = "Failed to upload file";
		try {
			const body = await res.json();
			if (body?.error) message = body.error as string;
		} catch {}
		throw new Error(message);
	}

	return (await res.json()) as { id: string; filename: string; uploaded_at: string };
}

export async function getProjectFiles(projectId: string): Promise<ProjectFile[]> {
	const res = await fetch(`/api/projects/${projectId}/files`, {
		method: "GET",
		headers: { "Content-Type": "application/json" },
	});

	if (!res.ok) {
		let message = "Failed to fetch project files";
		try {
			const body = await res.json();
			if (body?.error) message = body.error as string;
		} catch {}
		throw new Error(message);
	}

	return (await res.json()) as ProjectFile[];
}

export async function getProjectFileDetail(projectId: string, fileId: string): Promise<ProjectFileDetail> {
	const res = await fetch(`/api/projects/${projectId}/files/${fileId}`, {
		method: "GET",
		headers: { "Content-Type": "application/json" },
	});

	if (!res.ok) {
		let message = "Failed to fetch file details";
		try {
			const body = await res.json();
			if (body?.error) message = body.error as string;
		} catch {}
		throw new Error(message);
	}

	return (await res.json()) as ProjectFileDetail;
}

// Project Versions
export type ProjectVersion = {
  id: string;
  version_type: "semantic" | "date" | "custom";
  version_name: string;
  description: string;
  created_at: string;
  is_active: boolean;
  created_by: {
    name: string;
    avatar: string | null;
  };
  file_count: number;
};

export type CreateVersionInput = {
  version_type: "semantic" | "date" | "custom";
  version_name?: string; // Only required for custom type
  description: string;
  copy_files_from_version_id?: string;
};

export async function createProjectVersion(projectId: string, payload: CreateVersionInput): Promise<{ id: string; version_name: string; description: string; version_type: string; created_at: string }> {
  const res = await fetch(`/api/projects/${projectId}/versions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message = "Failed to create version";
    try {
      const body = await res.json();
      if (body?.error) message = body.error as string;
    } catch {}
    throw new Error(message);
  }

  return (await res.json()) as { id: string; version_name: string; description: string; version_type: string; created_at: string };
}

export async function getProjectVersions(projectId: string): Promise<ProjectVersion[]> {
  const res = await fetch(`/api/projects/${projectId}/versions`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    let message = "Failed to fetch project versions";
    try {
      const body = await res.json();
      if (body?.error) message = body.error as string;
    } catch {}
    throw new Error(message);
  }

  return (await res.json()) as ProjectVersion[];
}

// Project Activity
export type ProjectActivityMicroChange = {
  id: string;
  type: "addition" | "feedback" | "update" | "deletion";
  description: string;
  author: string;
  authorId: string;
  time: string;
  fullTimestamp: string; // ISO timestamp for accurate sorting
  avatar?: string | null;
  filename?: string;
  fileId?: string | null;
  fileReplaced?: boolean;
  replacedByFileId?: string | null;
};

export type ProjectActivityVersion = {
  id?: string;
  version: string;
  description: string;
  author: string;
  date: string;
  avatar?: string | null;
  microChanges: ProjectActivityMicroChange[];
  isActive?: boolean;
};

export async function getProjectActivity(projectId: string): Promise<ProjectActivityVersion[]> {
  const res = await fetch(`/api/projects/${projectId}/activity`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    let message = "Failed to fetch project activity";
    try {
      const body = await res.json();
      if (body?.error) message = body.error as string;
    } catch {}
    throw new Error(message);
  }

  return (await res.json()) as ProjectActivityVersion[];
}

export async function getProjectsLastActivity(ids: string[]): Promise<Record<string, string>> {
  const res = await fetch('/api/projects/last-activity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  })
  if (!res.ok) {
    let message = 'Failed to fetch last activity'
    try { const body = await res.json(); if (body?.error) message = body.error as string } catch {}
    throw new Error(message)
  }
  return (await res.json()) as Record<string, string>
}

// Storage usage (current user)
export type StorageUsage = {
    bytesUsed: number;
    bytesMax: number;
    bytesRemaining: number;
    mbUsed: number;
    mbMax: number;
    mbRemaining: number;
    percentUsed: number;
}

export async function getMyStorageUsage(): Promise<StorageUsage> {
    const res = await fetch(`/api/storage/usage`, { method: 'GET' });
    if (!res.ok) {
        let message = 'Failed to load storage usage';
        try { const body = await res.json(); if (body?.error) message = body.error as string } catch {}
        throw new Error(message);
    }
    return (await res.json()) as StorageUsage;
}

export async function createFeedbackChange(projectId: string, versionId: string, description?: string): Promise<{ id: string; version_id: string }> {
  const res = await fetch(`/api/projects/${projectId}/activity`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ versionId, description }),
  });
  if (!res.ok) {
    let message = "Failed to create feedback change";
    try {
      const body = await res.json();
      if (body?.error) message = body.error as string;
    } catch {}
    throw new Error(message);
  }
  return (await res.json()) as { id: string; version_id: string };
}

export async function updateFeedbackChange(projectId: string, changeId: string, description: string): Promise<{ id: string; description: string }> {
  const res = await fetch(`/api/projects/${projectId}/activity/${changeId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description }),
  });
  if (!res.ok) {
    let message = "Failed to update feedback";
    try { const body = await res.json(); if (body?.error) message = body.error as string; } catch {}
    throw new Error(message);
  }
  return (await res.json()) as { id: string; description: string };
}

export async function deleteFeedbackChange(projectId: string, changeId: string): Promise<void> {
  const res = await fetch(`/api/projects/${projectId}/activity/${changeId}`, { method: "DELETE" });
  if (!res.ok) {
    let message = "Failed to delete feedback";
    try { const body = await res.json(); if (body?.error) message = body.error as string; } catch {}
    throw new Error(message);
  }
}