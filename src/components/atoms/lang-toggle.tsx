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
        className="[&_svg]:size-4"
      >
        <Globe className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Language</span>
      </Button>

      {isOpen && (
        <div 
          className={cn(
            'absolute right-0 top-full mt-2 z-50',
            'min-w-[8rem] rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
            'animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200'
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
                  'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
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

