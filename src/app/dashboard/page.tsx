'use client';

import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/use-current-user';
import LayoutSidebar from '@/components/organisms/layout-sidebar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Rocket, Sparkles, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function DashboardPage() {
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();

  return (
    <LayoutSidebar title="Dashboard">
      <div className="py-6 space-y-6">
        {/* Hero */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                  <Sparkles className="h-5 w-5 mr-1" />
                  <span className="truncate">Welcome back,  <br /> {currentUser?.email ? currentUser.email : ''}</span>
                </div>
                <p className="text-muted-foreground mt-1">
                  UntitledOne is actively in development. We&#39;re excited you&#39;re here — features will appear and evolve rapidly. Thanks for joining early!
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0">Alpha</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm font-medium mb-1">
                <Rocket className="h-4 w-4" />
                Quick start
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Create a new project and invite collaborators to start working together.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <Link href="/projects/new">Create project</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/projects">View projects</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm font-medium mb-1">
                <BookOpen className="h-4 w-4" />
                What to expect
              </div>
              <p className="text-sm text-muted-foreground">
                Invitations, team management, and collaboration tools are being built. You might see changes frequently — we&#39;ll keep things as stable as possible.
              </p>
              <Separator className="my-3" />
              <ul className="text-sm list-disc pl-5 text-muted-foreground space-y-1">
                <li>Invite teammates to your projects</li>
                <li>Manage project details and visibility</li>
                <li>More collaboration features coming soon</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {userLoading && <Skeleton className="h-8 w-64" />}
      </div>
    </LayoutSidebar>
  );
}