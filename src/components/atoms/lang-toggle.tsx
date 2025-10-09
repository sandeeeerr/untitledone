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
  fullName: string;
}

const LANGUAGES: Language[] = [
  { code: 'en', label: 'EN', fullName: 'English' },
  { code: 'nl', label: 'NL', fullName: 'Nederlands' },
];

interface LangToggleProps {
  className?: string;
}

/**
 * Language toggle atom component
 * - Collapsed by default (shows globe icon)
 * - Expands on click to show language options (dropdown style)
 * - Aligns to the right, expands left
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

  // Close on Escape key
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  return (
    <div 
      ref={containerRef}
      className={cn('relative inline-flex items-center', className)}
    >
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select language"
        aria-expanded={isOpen}
        className={cn('[&_svg]:size-4', isOpen && 'opacity-0 pointer-events-none')}
      >
        <Globe className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Language</span>
      </Button>

      {isOpen && (
        <div 
          className={cn(
            'absolute right-0 top-0 z-50',
            'inline-flex items-center gap-0.5 rounded-md border border-input bg-background px-1 h-9',
            'animate-in fade-in-0 zoom-in-95 duration-200'
          )}
          role="menu"
        >
          {LANGUAGES.map((lang) => {
            const isActive = lang.code === currentLocale;
            
            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={cn(
                  'relative flex h-7 cursor-default select-none items-center rounded-sm px-2.5 text-sm font-medium outline-none whitespace-nowrap',
                  'transition-colors focus:bg-accent focus:text-accent-foreground',
                  isActive 
                    ? 'bg-accent text-accent-foreground' 
                    : 'hover:bg-accent hover:text-accent-foreground'
                )}
                role="menuitem"
                aria-label={`Switch to ${lang.fullName}`}
              >
                {lang.fullName}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

