'use client';

import * as React from 'react';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { setLanguageCookie } from '@/lib/cookies';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';

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
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(true)}
          aria-label="Select language"
          aria-expanded={isOpen}
        >
          <Globe className="h-[1.2rem] w-[1.2rem]" />
        </Button>
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
              <Button
                key={lang.code}
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handleLanguageChange(lang.code)}
                className={cn(
                  'h-8 px-3',
                  isActive && 'bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground'
                )}
                aria-pressed={isActive}
                aria-label={`Switch to ${lang.label}`}
              >
                {lang.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}

