import { getProject } from '@/lib/api/projects';
import ProjectDetailClient from './project-detail-client';

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;

  try {
    // Fetch initial project data on the server
    const initialProject = await getProject(id);
    
    return <ProjectDetailClient id={id} initialProject={initialProject} />;
  } catch {
    // If project not found or other error, let client handle it with proper UX
    return <ProjectDetailClient id={id} />;
  }
}