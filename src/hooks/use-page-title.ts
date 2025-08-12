import { useBreadcrumbs } from './use-breadcrumbs';

export function usePageTitle(): string {
  const breadcrumbs = useBreadcrumbs();
  
  if (breadcrumbs.length === 0) {
    return '';
  }
  
  // Get the last breadcrumb item (current page)
  const lastItem = breadcrumbs[breadcrumbs.length - 1];
  
  // For dynamic routes with IDs, show the section name instead of the ID
  if (breadcrumbs.length >= 3 && lastItem.isCurrentPage && !lastItem.href) {
    // This is a dynamic ID page, show the section name instead
    const sectionItem = breadcrumbs[breadcrumbs.length - 2];
    return sectionItem.label;
  }
  
  // For all other cases, just use the last breadcrumb label
  return lastItem.label;
} 