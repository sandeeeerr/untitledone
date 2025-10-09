import { notFound } from "next/navigation";
import { Suspense } from "react";
import FileDetailClient from "./file-detail-client";
import LayoutSidebar from "@/components/organisms/layout-sidebar";
import { getProject, getProjectFileDetail } from "@/lib/api/projects";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string; fileId: string }>;
}

export default async function FileDetailPage({ params }: PageProps) {
  const { id: projectId, fileId } = await params;

  if (!projectId || !fileId) {
    notFound();
  }

  let fileTitle = "Bestand";
  let projectName: string | undefined = undefined;
  try {
    const detail = await getProjectFileDetail(projectId, fileId);
    fileTitle = detail.filename || fileTitle;
    projectName = detail.project?.name || projectName;
  } catch {}

  try {
    const project = await getProject(projectId);
    projectName = project?.name;
  } catch {}

  return (
    <LayoutSidebar 
      title={fileTitle}
      breadcrumbLabelOverride={fileTitle}
      projectBreadcrumbLabelOverride={projectName}
      projectIdForBreadcrumb={projectId}
    >
      <Suspense 
        fallback={
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-64 bg-gray-200 rounded animate-pulse" />
          </div>
        }
      >
        <FileDetailClient projectId={projectId} fileId={fileId} />
      </Suspense>
    </LayoutSidebar>
  );
}
