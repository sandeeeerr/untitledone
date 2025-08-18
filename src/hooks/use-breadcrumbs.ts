import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useBreadcrumbOverride } from '@/components/breadcrumb-context';

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
      { label: 'User', href: '/u' },
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
      
      // If there's a project ID, add it
      if (segments.length > 1) {
        breadcrumbs.push({ 
          label: override.currentPageLabel || `Project ${segments[1]}`, 
          isCurrentPage: true 
        });
      } else {
        breadcrumbs[1].isCurrentPage = true;
      }
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