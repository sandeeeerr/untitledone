"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function SidebarBugReportCard() {
  const t = useTranslations("sidebar.bugs")

  const reportUrl = "https://github.com/sandeeeerr/untitledone/issues/new?labels=bug&template=bug_report.md"

  return (
    <Card className="gap-2 shadow-none">
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-sm">{t("title")}</CardTitle>
        <CardDescription>
          {t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid gap-2.5">
          <Button asChild size="sm" className="w-full">
            <a href={reportUrl} target="_blank" rel="noreferrer">
              {t("report")}
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default SidebarBugReportCard


