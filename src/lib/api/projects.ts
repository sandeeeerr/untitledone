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
	daw_info: Record<string, any>;
	plugins_used: Array<{ name: string; version?: string }>;
	status: string;
	created_at: string;
	updated_at: string;
	owner_id: string;
	likes_count: number;
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