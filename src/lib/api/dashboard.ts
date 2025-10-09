import createClient from '@/lib/supabase/server';
import type { Project } from './projects';

export type DashboardData = {
	recentProjects: Project[];
	pinnedProjects: Project[];
	activityDigest: ActivityDigestItem[];
	profileCheck: {
		needsDisplay: boolean;
		needsUsername: boolean;
	} | null;
};

export type ActivityDigestItem = {
	projectId: string;
	projectName: string;
	type: 'feedback' | 'addition' | 'update' | 'deletion';
	description: string;
	timestamp: string;
	filename?: string;
};

/**
 * Fetch recent projects (sorted by updated_at, limit 5)
 * Server-side function for Server Components
 */
export async function getRecentProjects(): Promise<Project[]> {
	try {
		const supabase = await createClient();

		const { data: userData } = await supabase.auth.getUser();
		if (!userData.user) return [];

		const { data, error } = await supabase
			.from('projects')
			.select(
				`
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
        owner_id,
        likes_count,
        profiles!projects_owner_id_fkey (
          id,
          display_name,
          username,
          avatar_url
        )
      `,
			)
			.eq('owner_id', userData.user.id)
			.order('updated_at', { ascending: false })
			.limit(5);

		if (error) throw error;

		return (
			data?.map((p) => ({
				id: p.id,
				name: p.name,
				description: p.description,
				tags: (p.tags as string[]) || [],
				genre: p.genre,
				is_private: p.is_private,
				downloads_enabled: p.downloads_enabled,
				daw_info: (p.daw_info as Record<string, string>) || {},
				plugins_used:
					(p.plugins_used as Array<{ name: string; version?: string }>) || [],
				status: p.status,
				created_at: p.created_at,
				updated_at: p.updated_at,
				owner_id: p.owner_id,
				likes_count: p.likes_count || 0,
				file_count: 0, // Would need separate query
				collaborators_count: 1, // Would need separate query
				creator: p.profiles
					? {
							id: (p.profiles as { id: string }).id,
							name:
								(p.profiles as { display_name?: string }).display_name ||
								(p.profiles as { username?: string }).username ||
								'Unknown',
							avatar: (p.profiles as { avatar_url?: string | null }).avatar_url || undefined,
						}
					: undefined,
			})) || []
		);
	} catch (error) {
		console.error('Error fetching recent projects:', error);
		return [];
	}
}

/**
 * Fetch pinned projects
 * Server-side function for Server Components
 */
export async function getPinnedProjects(): Promise<Project[]> {
	try {
		const supabase = await createClient();

		const { data: userData } = await supabase.auth.getUser();
		if (!userData.user) return [];

		// Get pinned project IDs
		const { data: pins, error: pinsError } = await supabase
			.from('project_pins')
			.select('project_id')
			.eq('user_id', userData.user.id)
			.order('created_at', { ascending: false })
			.limit(5);

		if (pinsError) throw pinsError;
		if (!pins || pins.length === 0) return [];

		const projectIds = pins.map((p) => p.project_id);

		// Fetch project details
		const { data, error } = await supabase
			.from('projects')
			.select(
				`
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
        owner_id,
        likes_count,
        profiles!projects_owner_id_fkey (
          id,
          display_name,
          username,
          avatar_url
        )
      `,
			)
			.in('id', projectIds);

		if (error) throw error;

		return (
			data?.map((p) => ({
				id: p.id,
				name: p.name,
				description: p.description,
				tags: (p.tags as string[]) || [],
				genre: p.genre,
				is_private: p.is_private,
				downloads_enabled: p.downloads_enabled,
				daw_info: (p.daw_info as Record<string, string>) || {},
				plugins_used:
					(p.plugins_used as Array<{ name: string; version?: string }>) || [],
				status: p.status,
				created_at: p.created_at,
				updated_at: p.updated_at,
				owner_id: p.owner_id,
				likes_count: p.likes_count || 0,
				file_count: 0,
				collaborators_count: 1,
				creator: p.profiles
					? {
							id: (p.profiles as { id: string }).id,
							name:
								(p.profiles as { display_name?: string }).display_name ||
								(p.profiles as { username?: string }).username ||
								'Unknown',
							avatar: (p.profiles as { avatar_url?: string | null }).avatar_url || undefined,
						}
					: undefined,
			})) || []
		);
	} catch (error) {
		console.error('Error fetching pinned projects:', error);
		return [];
	}
}

/**
 * Fetch activity digest from recent/pinned projects
 * Server-side function for Server Components
 */
export async function getActivityDigest(
	recentProjects: Project[],
	pinnedProjects: Project[],
): Promise<ActivityDigestItem[]> {
	try {
		const supabase = await createClient();

		// Combine and deduplicate projects
		const projectMap = new Map<string, Project>();
		[...recentProjects, ...pinnedProjects].forEach((p) =>
			projectMap.set(p.id, p),
		);
		const sourceProjects = Array.from(projectMap.values())
			.sort(
				(a, b) =>
					new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
			)
			.slice(0, 8);

		if (sourceProjects.length === 0) return [];

		const projectIds = sourceProjects.map((p) => p.id);

		// Fetch activity (versions + changes)
		const { data: versions, error } = await supabase
			.from('project_versions')
			.select(
				`
        id,
        project_id,
        version_name,
        created_at,
        activity_changes (
          id,
          type,
          description,
          created_at,
          project_files (
            filename
          )
        )
      `,
			)
			.in('project_id', projectIds)
			.order('created_at', { ascending: false })
			.limit(50);

		if (error) throw error;

		const items: ActivityDigestItem[] = [];

		versions?.forEach((v) => {
			const project = sourceProjects.find((p) => p.id === v.project_id);
			if (!project) return;

			const changes = v.activity_changes as Array<{
				type: string;
				description: string;
				created_at: string;
				project_files?: {
					filename: string;
				} | null;
			}>;

			changes?.forEach((change) => {
				const typeMap: Record<
					string,
					'feedback' | 'addition' | 'update' | 'deletion'
				> = {
					feedback: 'feedback',
					comment: 'feedback',
					addition: 'addition',
					upload: 'addition',
					update: 'update',
					replacement: 'update',
					deletion: 'deletion',
					delete: 'deletion',
				};

				items.push({
					projectId: project.id,
					projectName: project.name,
					type: typeMap[change.type] || 'update',
					description: change.description,
					timestamp: change.created_at,
					filename: change.project_files?.filename,
				});
			});
		});

		// Sort by timestamp and limit to 4 most recent
		items.sort(
			(a, b) =>
				new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
		);

		return items.slice(0, 4);
	} catch (error) {
		console.error('Error fetching activity digest:', error);
		return [];
	}
}

/**
 * Check if user profile needs completion
 * Server-side function for Server Components
 */
export async function checkProfileCompletion(): Promise<{
	needsDisplay: boolean;
	needsUsername: boolean;
} | null> {
	try {
		const supabase = await createClient();

		const { data: userData } = await supabase.auth.getUser();
		if (!userData.user) return null;

		const { data: profile } = await supabase
			.from('profiles')
			.select('display_name, username')
			.eq('id', userData.user.id)
			.single();

		if (!profile) return { needsDisplay: true, needsUsername: true };

		return {
			needsDisplay: !profile.display_name,
			needsUsername: !profile.username,
		};
	} catch (error) {
		console.error('Error checking profile:', error);
		return null;
	}
}

/**
 * Fetch all dashboard data in parallel
 * Server-side function for Server Components - RECOMMENDED
 */
export async function getDashboardData(): Promise<DashboardData> {
	// Parallel data fetching - significantly faster than sequential
	const [recentProjects, pinnedProjects, profileCheck] = await Promise.all([
		getRecentProjects(),
		getPinnedProjects(),
		checkProfileCompletion(),
	]);

	// Activity digest depends on projects data
	const activityDigest = await getActivityDigest(
		recentProjects,
		pinnedProjects,
	);

	return {
		recentProjects,
		pinnedProjects,
		activityDigest,
		profileCheck,
	};
}

