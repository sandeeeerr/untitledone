"use client"

import LayoutSidebar from "@/components/organisms/layout-sidebar"
import { cn } from "@/lib/utils"

// Minimal spinner; replace with shadcn-io Spinner when available
function CircleSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)} role="status" aria-label="Loading">
      <div className="h-10 w-10 rounded-full border-2 border-muted-foreground/20 border-t-primary animate-spin" />
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export function PageLoading({ title = "Loading...", message = "Loading..." }: { title?: string; message?: string }) {
  return (
    <LayoutSidebar title={title}>
      <div>
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <CircleSpinner />
            <div className="text-sm text-muted-foreground">{message}</div>
          </div>
        </div>
      </div>
    </LayoutSidebar>
  )
}

export default PageLoading


