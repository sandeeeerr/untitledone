'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { setLanguageCookie } from '@/lib/cookies';
import { useRouter, usePathname } from 'next/navigation';

interface Language {
  code: string;
  label: string;
}

const LANGUAGES: Language[] = [
  { code: 'en', label: 'EN' },
  { code: 'nl', label: 'NL' },
  { code: 'fr', label: 'FR' },
];

interface LangToggleProps {
  className?: string;
}

/**
 * Language toggle atom component
 * - Inline buttons for NL/EN/FR
 * - Active state with bg-accent
 * - Server-side cookie update + refresh
 */
export function LangToggle({ className }: LangToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Extract current locale from pathname (format: /[locale]/...)
  const currentLocale = React.useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    const firstSegment = segments[0];
    
    // Check if first segment is a valid locale
    if (LANGUAGES.some(lang => lang.code === firstSegment)) {
      return firstSegment;
    }
    
    // Default to 'en' if no locale in path
    return 'en';
  }, [pathname]);

  const handleLanguageChange = (locale: string) => {
    if (locale === currentLocale) return;
    
    setLanguageCookie(locale);
    router.refresh();
  };

  return (
    <div 
      className={cn('inline-flex items-center gap-1 rounded-md border border-input bg-background p-0.5', className)}
      role="group"
      aria-label="Language selection"
    >
      {LANGUAGES.map((lang) => {
        const isActive = lang.code === currentLocale;
        
        return (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={cn(
              'h-8 px-2.5 rounded-md text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            )}
            aria-pressed={isActive}
            aria-label={`Switch to ${lang.label}`}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
}

