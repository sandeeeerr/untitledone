import { notFound } from "next/navigation";
import { Suspense } from "react";
import FileDetailClient from "./file-detail-client";
import LayoutSidebar from "@/components/organisms/layout-sidebar";
import { getProject, getProjectFileDetail } from "@/lib/api/projects";

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
  
  // Try to get project name from multiple sources
  try {
    const project = await getProject(projectId);
    projectName = project?.name;
  } catch {}

  // If we still don't have project name, try from file detail
  if (!projectName) {
    try {
      const detail = await getProjectFileDetail(projectId, fileId);
      fileTitle = detail.filename || fileTitle;
      projectName = detail.project?.name || projectName;
    } catch {}
  } else {
    // If we have project name, still try to get the file title
    try {
      const detail = await getProjectFileDetail(projectId, fileId);
      fileTitle = detail.filename || fileTitle;
    } catch {}
  }

  return (
    <LayoutSidebar 
      title={fileTitle}
      breadcrumbLabelOverride={fileTitle}
      projectBreadcrumbLabelOverride={projectName || projectId.slice(0, 8) + '...'}
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
