import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading state for dashboard
 * Shown during Server Component data fetching
 */
export default function DashboardLoading() {
	return (
		<div className="flex h-screen">
			{/* Sidebar skeleton */}
			<div className="hidden md:flex w-64 border-r bg-muted/10">
				<div className="flex flex-col w-full p-4 space-y-4">
					<Skeleton className="h-8 w-32" />
					<div className="space-y-2">
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
					</div>
				</div>
			</div>

			{/* Main content skeleton */}
			<div className="flex-1 overflow-auto">
				<div className="container py-6 space-y-6">
					{/* Header */}
					<div className="flex items-center justify-between">
						<Skeleton className="h-10 w-48" />
						<Skeleton className="h-10 w-40" />
					</div>

					{/* Activity + Pinned grid */}
					<div className="grid gap-4 md:grid-cols-12">
						{/* Activity Digest */}
						<Card className="md:col-span-8">
							<CardContent className="p-4 md:p-5">
								<div className="space-y-3">
									<Skeleton className="h-6 w-40" />
									<div className="space-y-2">
										<Skeleton className="h-16 w-full" />
										<Skeleton className="h-16 w-full" />
										<Skeleton className="h-16 w-full" />
										<Skeleton className="h-16 w-full" />
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Pinned Projects */}
						<Card className="md:col-span-4">
							<CardContent className="p-4 md:p-5">
								<div className="space-y-3">
									<Skeleton className="h-6 w-32" />
									<div className="space-y-2">
										<Skeleton className="h-20 w-full" />
										<Skeleton className="h-20 w-full" />
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Recent Projects */}
					<div className="mt-4">
						<div className="flex items-center justify-between mb-3">
							<Skeleton className="h-6 w-40" />
							<Skeleton className="h-10 w-32" />
						</div>
						<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
							<Card>
								<CardContent className="p-6 space-y-4">
									<Skeleton className="h-6 w-3/4" />
									<div className="flex items-center gap-3">
										<Skeleton className="h-8 w-8 rounded-full" />
										<div className="flex-1 space-y-2">
											<Skeleton className="h-4 w-2/3" />
											<Skeleton className="h-3 w-1/2" />
										</div>
									</div>
									<Skeleton className="h-12 w-full" />
									<div className="flex gap-2">
										<Skeleton className="h-6 w-16" />
										<Skeleton className="h-6 w-16" />
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardContent className="p-6 space-y-4">
									<Skeleton className="h-6 w-3/4" />
									<div className="flex items-center gap-3">
										<Skeleton className="h-8 w-8 rounded-full" />
										<div className="flex-1 space-y-2">
											<Skeleton className="h-4 w-2/3" />
											<Skeleton className="h-3 w-1/2" />
										</div>
									</div>
									<Skeleton className="h-12 w-full" />
									<div className="flex gap-2">
										<Skeleton className="h-6 w-16" />
										<Skeleton className="h-6 w-16" />
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardContent className="p-6 space-y-4">
									<Skeleton className="h-6 w-3/4" />
									<div className="flex items-center gap-3">
										<Skeleton className="h-8 w-8 rounded-full" />
										<div className="flex-1 space-y-2">
											<Skeleton className="h-4 w-2/3" />
											<Skeleton className="h-3 w-1/2" />
										</div>
									</div>
									<Skeleton className="h-12 w-full" />
									<div className="flex gap-2">
										<Skeleton className="h-6 w-16" />
										<Skeleton className="h-6 w-16" />
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

