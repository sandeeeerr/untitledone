'use client';

import * as React from 'react';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { setLanguageCookie } from '@/lib/cookies';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

interface Language {
  code: string;
  label: string;
}

const LANGUAGES: Language[] = [
  { code: 'en', label: 'EN' },
  { code: 'nl', label: 'NL' },
];

interface LangToggleProps {
  className?: string;
}

/**
 * Language toggle atom component
 * - Collapsed by default (shows globe icon)
 * - Expands on click to show EN/NL options
 * - Active state with bg-accent
 * - Server-side cookie update + refresh
 */
export function LangToggle({ className }: LangToggleProps) {
  const router = useRouter();
  const currentLocale = useLocale();
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleLanguageChange = (locale: string) => {
    if (locale === currentLocale) {
      setIsOpen(false);
      return;
    }
    
    setLanguageCookie(locale);
    setIsOpen(false);
    router.refresh();
  };

  // Close when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div 
      ref={containerRef}
      className={cn('relative inline-flex items-center', className)}
      role="group"
      aria-label="Language selection"
    >
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            'h-9 w-9 inline-flex items-center justify-center rounded-md',
            'border border-input bg-background',
            'hover:bg-accent hover:text-accent-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'transition-colors'
          )}
          aria-label="Select language"
          aria-expanded={isOpen}
        >
          <Globe className="h-[1.2rem] w-[1.2rem]" />
        </button>
      ) : (
        <div 
          className={cn(
            'inline-flex items-center gap-1 rounded-md border border-input bg-background p-0.5',
            'animate-in fade-in zoom-in-95 duration-200'
          )}
        >
          {LANGUAGES.map((lang) => {
            const isActive = lang.code === currentLocale;
            
            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={cn(
                  'h-8 px-3 rounded-md text-sm font-medium transition-colors',
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
      )}
    </div>
  );
}

