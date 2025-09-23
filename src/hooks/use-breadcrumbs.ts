import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useBreadcrumbOverride } from '@/components/atoms/breadcrumb-context';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

export function useBreadcrumbs(): BreadcrumbItem[] {
  const pathname = usePathname();
  const t = useTranslations('breadcrumbs');
  const override = useBreadcrumbOverride();
  
  // Split pathname into segments
  const segments = pathname.split('/').filter(Boolean);
  
  // Landing page (/) - no breadcrumbs needed
  if (segments.length === 0) {
    return [];
  }
  
  // Public user profiles: /u/[username]
  if (segments[0] === 'u' && segments.length === 2) {
    const username = segments[1];
    return [
      { label: t('dashboard'), href: '/dashboard' },
      { label: t('users'), href: '#' },
      { label: username, isCurrentPage: true }
    ];
  }
  
  // Internal app routes (with sidebar)
  if (['dashboard', 'projects', 'todos', 'profile'].includes(segments[0])) {
    const breadcrumbs: BreadcrumbItem[] = [];
    
    // Always start with Dashboard (as home for internal app)
    breadcrumbs.push({ 
      label: t('dashboard'), 
      href: '/dashboard' 
    });
    
    // Add specific route breadcrumbs
    if (segments[0] === 'dashboard') {
      // Dashboard is the root, but we still want to show it as current page
      breadcrumbs[0].isCurrentPage = true;
      // Return breadcrumbs even for single item to show dashboard
      return breadcrumbs;
    } else if (segments[0] === 'projects') {
      breadcrumbs.push({ 
        label: t('projects'), 
        href: '/projects' 
      });

      // /projects -> Projects current
      if (segments.length === 1) {
        breadcrumbs[1].isCurrentPage = true;
        return breadcrumbs;
      }

      const projectId = segments[1];

      // /projects/[id] -> Project page
      if (segments.length === 2) {
        breadcrumbs.push({ 
          label: override.projectLabelOverride || override.currentPageLabel || `Project ${projectId}`, 
          isCurrentPage: true 
        });
        return breadcrumbs;
      }

      // Deeper routes under a project
      // Example: /projects/[id]/files/[fileId]
      // Project crumb (link)
      breadcrumbs.push({ 
        label: override.projectLabelOverride || `Project ${projectId}`, 
        href: `/projects/${projectId}` 
      });

      // Files section
      if (segments[2] === 'files') {
        breadcrumbs.push({ 
          label: 'Files', 
          href: `/projects/${projectId}#files` 
        });
        if (segments.length >= 4) {
          breadcrumbs.push({ 
            label: override.currentPageLabel || segments[3], 
            isCurrentPage: true 
          });
          return breadcrumbs;
        }
        // /projects/[id]/files
        breadcrumbs[breadcrumbs.length - 1].isCurrentPage = true;
        return breadcrumbs;
      }

      // Generic extra segment under project, mark last as current
      breadcrumbs.push({ label: segments[2].charAt(0).toUpperCase() + segments[2].slice(1), isCurrentPage: true });
      return breadcrumbs;
    } else if (segments[0] === 'todos') {
      breadcrumbs.push({ 
        label: t('todos'), 
        href: '/todos', 
        isCurrentPage: true 
      });
    } else if (segments[0] === 'profile') {
      breadcrumbs.push({ 
        label: t('profile'), 
        href: '/profile', 
        isCurrentPage: true 
      });
    }
    
    return breadcrumbs;
  }
  
  // Generic dynamic routes: /[section]/[id] - automatically handle any new dynamic routes
  if (segments.length === 2) {
    const section = segments[0];
    const id = segments[1];
    
    // Check if this is a known section that should show dashboard
    if (['dashboard', 'projects', 'todos', 'profile'].includes(section)) {
      return []; // Already handled above
    }
    
    // For any other dynamic route, create breadcrumbs automatically
    return [
      { label: t('dashboard'), href: '/dashboard' },
      { label: section.charAt(0).toUpperCase() + section.slice(1), href: `/${section}` },
      { label: id, isCurrentPage: true }
    ];
  }
  
  // For other routes (like auth pages), don't show breadcrumbs
  return [];
} 