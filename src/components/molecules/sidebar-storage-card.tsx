"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HardDrive } from "lucide-react"

export function SidebarStorageCard() {
  const t = useTranslations("sidebar.storage")

  // Mock storage values - replace with actual data later
  const usedStorage = 19 // MB
  const totalStorage = 500 // MB
  const percentageUsed = (usedStorage / totalStorage) * 100

  return (
    <Card className="gap-2 shadow-none mt-8">
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-sm flex items-center gap-2">
          <HardDrive className="h-4 w-4" />
          {t("title")}
        </CardTitle>
        <CardDescription className="mt-1">
          {usedStorage}MB / {totalStorage}MB
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
          <div 
            className="bg-primary h-full transition-all duration-300"
            style={{ width: `${percentageUsed}%` }}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export default SidebarStorageCard

