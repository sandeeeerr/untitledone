"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HardDrive, Plus } from "lucide-react"
import { useMyStorageUsage, useStorageConnections } from "@/lib/api/queries"
import Link from "next/link"

export function SidebarStorageCard() {
  const t = useTranslations("sidebar.storage")
  const { data: usage } = useMyStorageUsage()
  const { data: connections } = useStorageConnections()

  // Count active external storage connections
  const activeConnections = connections?.filter(c => c.status === 'active') || []
  const hasExternalStorage = activeConnections.length > 0

  // Hide the card if user has external storage connected
  if (hasExternalStorage) {
    return null
  }

  const usedStorage = usage?.mbUsed ?? 0
  const totalStorage = usage?.mbMax ?? 50 // Updated to 50MB
  const percentageUsed = totalStorage > 0 ? (usedStorage / totalStorage) * 100 : 0

  return (
    <Card className="gap-2 shadow-none mt-8">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <HardDrive className="h-4 w-4" />
          {t("title")}
        </CardTitle>
        <CardDescription className="text-xs mt-1.5">
          {t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        <div className="text-xs text-muted-foreground">
          {usedStorage.toFixed(1)}MB / {totalStorage}MB
        </div>
        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
          <div 
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${Math.min(100, percentageUsed)}%` }}
          />
        </div>
        <Button asChild variant="outline" size="sm" className="w-full h-8">
          <Link href="/settings/storage" className="flex items-center gap-1.5">
            <Plus className="h-3 w-3" />
            <span className="text-xs">Connect external storage</span>
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export default SidebarStorageCard

