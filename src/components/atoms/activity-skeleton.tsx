"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function ActivitySkeleton() {
  return (
    <div className="space-y-8 mt-8">
      {/* Date group header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        
        {/* Version card skeleton */}
        <Card className="border-l-4 border-l-gray-200">
          <CardHeader className="p-4 md:p-6">
            <div className="flex items-start gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-12" />
                </div>
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
          </CardHeader>
          
          <CardContent className="pt-0 p-4 md:p-6">
            <div className="space-y-3">
              {/* Micro-change skeletons */}
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className="flex items-center gap-2 mt-0.5">
                    <Skeleton className="h-3 w-3" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
