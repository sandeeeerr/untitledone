import { getTranslations } from 'next-intl/server';
import { Pencil, Clock, Star, Plus, Rocket, FileAudio, Users } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LayoutSidebar from '@/components/organisms/layout-sidebar';
import UserAvatar from '@/components/atoms/user-avatar';
import { getDashboardData } from '@/lib/api/dashboard';
import { formatRelativeTime, formatRelativeTimeWithTranslations } from '@/lib/utils/time';
import { getChangeIcon, getChangePrefix } from '@/lib/ui/activity';
import { cn } from '@/lib/utils';
import DashboardContent from './dashboard-content';
import { listProjectMembers, type ProjectMember } from '@/lib/api/projects';

/**
 * Dashboard Page - Server Component
 * Fetches all data server-side for optimal performance
 */
export default async function DashboardPage() {
	const t = await getTranslations('dashboard');
	const tNav = await getTranslations('navigation');
	const tProj = await getTranslations('projects');

	// Parallel data fetching on the server - FAST! 🚀
	const dashboardData = await getDashboardData();

	// Fetch members for pinned projects (parallel)
	const pinnedMembersMap: Record<string, ProjectMember[]> = {};
	if (dashboardData.pinnedProjects.length > 0) {
		const membersResults = await Promise.all(
			dashboardData.pinnedProjects.map(async (p) => {
				try {
					const members = await listProjectMembers(p.id);
					return { projectId: p.id, members };
				} catch {
					return { projectId: p.id, members: [] };
				}
			}),
		);
		membersResults.forEach(({ projectId, members }) => {
			pinnedMembersMap[projectId] = members;
		});
	}

	return (
		<LayoutSidebar
			title={t('title')}
			titleActions={
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" disabled>
						<Pencil className="mr-2 h-4 w-4" />
						{t('editDashboard', { default: 'Edit dashboard' })}
					</Button>
				</div>
			}
		>
			<DashboardContent initialData={dashboardData}>
				{/* Overview: Activity digest (2/3) + Pinned projects (1/3) */}
				<div className="grid gap-4 md:grid-cols-12">
					{/* Activity Digest */}
					<Card className="md:col-span-8">
						<CardContent className="p-4 md:p-5">
							<div className="flex items-center gap-2 text-sm font-medium mb-3">
								<Clock className="h-4 w-4" />
								{t('activityDigest')}
							</div>
							<div className="space-y-2">
								{dashboardData.activityDigest.length > 0 ? (
									dashboardData.activityDigest.map((item, idx) => {
										const unread =
											Date.now() - new Date(item.timestamp).getTime() <
											24 * 60 * 60 * 1000;
										const typeBg: Record<string, string> = {
											feedback: 'bg-blue-50/40 dark:bg-blue-950/10',
											addition: 'bg-green-50/40 dark:bg-green-950/10',
											update: 'bg-orange-50/40 dark:bg-orange-950/10',
											deletion: 'bg-red-50/40 dark:bg-red-950/10',
										};
										const typeBorder: Record<string, string> = {
											feedback: 'border-blue-200 dark:border-blue-900/30',
											addition: 'border-green-200 dark:border-green-900/30',
											update: 'border-orange-200 dark:border-orange-900/30',
											deletion: 'border-red-200 dark:border-red-900/30',
										};
										const tKey = item.type in typeBg ? item.type : 'update';
										return (
											<Link
												key={`digest-${idx}-${item.projectId}`}
												href={`/projects/${item.projectId}`}
												className={cn(
													'flex items-center gap-3 rounded-md border px-3 py-2 transition-colors',
													typeBg[tKey],
													typeBorder[tKey],
												)}
											>
												<div className="flex items-center gap-2 shrink-0">
													{getChangeIcon(item.type)}
													<span
														className={cn(
															'h-2 w-2 rounded-full',
															unread
																? 'bg-primary'
																: 'bg-muted-foreground/30',
														)}
														aria-label={unread ? t('unread') : ''}
													/>
												</div>
												<div className="min-w-0 flex-1">
													<div
														className="truncate text-sm"
														title={item.description}
													>
														<span className="font-medium mr-1">
															{getChangePrefix(item.type)}
														</span>
														<span>{item.description}</span>
														{item.filename ? (
															<span className="text-muted-foreground">
																{' '}
																· {item.filename}
															</span>
														) : null}
													</div>
													<div className="text-xs text-muted-foreground truncate">
														{item.projectName} ·{' '}
														{formatRelativeTime(item.timestamp)}
													</div>
												</div>
											</Link>
										);
									})
								) : (
									<div className="text-sm text-muted-foreground">
										{t('noActivityDigest')}
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Pinned projects */}
					<Card className="md:col-span-4">
						<CardContent className="p-4 md:p-5">
							<div className="flex items-center justify-between mb-3">
								<div className="flex items-center gap-2 text-sm font-medium">
									<Star className="h-4 w-4" />
									{t('pinnedProjects')}
								</div>
							</div>
							<div className="space-y-2">
								{dashboardData.pinnedProjects.length > 0 ? (
									dashboardData.pinnedProjects.map((p) => {
										const members = pinnedMembersMap[p.id] ?? [];
										const avatars = members.slice(0, 5);
										return (
											<Link
												key={p.id}
												href={`/projects/${p.id}`}
												className="block rounded-md border px-3 py-2 hover:bg-accent"
											>
												<div className="flex items-center gap-2 min-w-0">
													<div className="truncate font-semibold">{p.name}</div>
													<Badge
														variant={p.is_private ? 'secondary' : 'default'}
														className={
															(p.is_private
																? 'shrink-0'
																: 'shrink-0 bg-green-500 hover:bg-green-600') +
															' px-1.5 py-0 text-[10px]'
														}
													>
														{p.is_private
															? tProj('private')
															: tProj('public')}
													</Badge>
												</div>
												<div className="mt-1 flex items-center justify-between gap-2">
													<div className="flex -space-x-2">
														{avatars.map((m) => (
															<UserAvatar
																key={m.user_id}
																className="h-6 w-6 ring-2 ring-background"
																name={
																	m.profile?.display_name ||
																	m.profile?.username ||
																	undefined
																}
																username={m.profile?.username || undefined}
																userId={m.user_id}
																src={m.profile?.avatar_url || null}
															/>
														))}
														{members.length > avatars.length && (
															<div className="h-6 w-6 rounded-full bg-muted text-xs flex items-center justify-center ring-2 ring-background">
																+{members.length - avatars.length}
															</div>
														)}
													</div>
													<div className="text-xs text-muted-foreground whitespace-nowrap">
														{t('lastUpdatedShort')}:{' '}
														{formatRelativeTime(p.updated_at)}
													</div>
												</div>
											</Link>
										);
									})
								) : (
									<div className="text-sm text-muted-foreground">
										{t('noPins')}
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Bottom: recent projects */}
				<div className="mt-4">
					<div className="flex items-center justify-between mb-3">
						<div className="flex items-center gap-2 text-sm font-medium">
							<Clock className="h-4 w-4" />
							{t('recentProjects')}
						</div>
						<div className="flex items-center gap-2">
							{dashboardData.recentProjects.length > 0 && (
								<Button asChild variant="ghost" size="sm">
									<Link href="/projects">
										{t('viewAllProjects', { default: tNav('projects') })}
									</Link>
								</Button>
							)}
							<Button asChild size="sm">
								<Link href="/projects/new">
									<Plus className="mr-2 h-4 w-4" />
									{t('addProject')}
								</Link>
							</Button>
						</div>
					</div>
					{dashboardData.recentProjects.length === 0 ? (
						<Card className="border-dashed">
							<CardContent className="py-12">
								<div className="flex flex-col items-center text-center space-y-4">
									<div className="rounded-full bg-primary/10 p-4">
										<Rocket className="h-8 w-8 text-primary" />
									</div>
									<div className="space-y-2">
										<h3 className="text-lg font-semibold">
											{t('noRecentProjects')}
										</h3>
										<p className="text-sm text-muted-foreground max-w-md">
											Create your first project to start collaborating with audio
											creatives. Share files, exchange feedback, and manage
											versions all in one place.
										</p>
									</div>
									<div className="flex flex-col sm:flex-row gap-3 pt-2">
										<Button asChild size="lg">
											<Link href="/projects/new">
												<Plus className="mr-2 h-4 w-4" />
												Create First Project
											</Link>
										</Button>
										<Button asChild variant="outline" size="lg">
											<Link
												href="https://github.com/sandeeeerr/untitledone#readme"
												target="_blank"
												rel="noreferrer"
											>
												Learn More
											</Link>
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					) : (
						<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
							{dashboardData.recentProjects.slice(0, 3).map((project) => (
								<Link
									key={project.id}
									href={`/projects/${project.id}`}
									className="group"
								>
									<Card className="transition-all duration-200 hover:shadow-md hover:shadow-primary/5 hover:border-primary/20 cursor-pointer h-full">
										<div className="p-6 pb-0">
											<div className="flex items-center gap-2 min-w-0">
												<div className="text-lg font-semibold truncate group-hover:text-primary transition-colors">
													{project.name}
												</div>
												<Badge
													variant={project.is_private ? 'secondary' : 'default'}
													className={
														(project.is_private
															? 'shrink-0'
															: 'shrink-0 bg-green-500 hover:bg-green-600') +
														' px-1.5 py-0 text-[10px]'
													}
												>
													{project.is_private
														? tProj('private')
														: tProj('public')}
												</Badge>
											</div>
										</div>
										<CardContent className="space-y-4">
											<div className="flex items-center gap-3 min-w-0">
												<UserAvatar
													className="h-8 w-8 shrink-0"
													name={project.creator?.name}
													username={undefined}
													userId={project.creator?.id}
													src={project.creator?.avatar || null}
												/>
												<div className="flex-1 min-w-0">
													<p className="text-sm font-medium truncate">
														{project.creator?.name ||
															tProj('unknownCreator')}
													</p>
													<p className="text-xs text-muted-foreground">
														{formatRelativeTimeWithTranslations(
															project.updated_at,
															{
																justNow: tProj('time.justNow'),
																hoursAgo: (count) =>
																	tProj('time.hoursAgo', { count }),
																yesterday: tProj('time.yesterday'),
																daysAgo: (count) =>
																	tProj('time.daysAgo', { count }),
															},
														)}
													</p>
												</div>
											</div>

											<div className="min-h-12">
												<p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
													{project.description || '\u00A0'}
												</p>
											</div>

											{project.tags && project.tags.length > 0 && (
												<div className="flex flex-wrap gap-1">
													{project.tags.slice(0, 2).map((tag, index) => (
														<Badge
															key={index}
															variant="outline"
															className="text-xs"
														>
															{tag}
														</Badge>
													))}
													{project.tags.length > 2 && (
														<Badge variant="outline" className="text-xs">
															+{project.tags.length - 2}
														</Badge>
													)}
												</div>
											)}

											<div className="flex items-center justify-between pt-2 border-t">
												<div className="flex items-center gap-4 text-xs text-muted-foreground">
													<div className="flex items-center gap-1">
														<FileAudio className="h-3 w-3" />
														<span>{project.file_count ?? 0}</span>
													</div>
													<div className="flex items-center gap-1">
														<Users className="h-3 w-3" />
														<span>{project.collaborators_count ?? 1}</span>
													</div>
												</div>
											</div>
										</CardContent>
									</Card>
								</Link>
							))}
						</div>
					)}
				</div>
			</DashboardContent>
		</LayoutSidebar>
	);
}
