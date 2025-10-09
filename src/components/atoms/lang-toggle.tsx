'use client';

import * as React from 'react';
import { Globe } from 'lucide-react';
import { setLanguageCookie } from '@/lib/cookies';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Language {
  code: string;
  label: string;
}

const LANGUAGES: Language[] = [
  { code: 'en', label: 'English' },
  { code: 'nl', label: 'Nederlands' },
];

interface LangToggleProps {
  className?: string;
}

/**
 * Language toggle atom component
 * - Globe icon button that opens dropdown menu
 * - Clean dropdown menu with language options
 * - Server-side cookie update + refresh
 */
export function LangToggle({ className }: LangToggleProps) {
  const router = useRouter();
  const currentLocale = useLocale();

  const handleLanguageChange = (locale: string) => {
    if (locale === currentLocale) return;
    
    setLanguageCookie(locale);
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Language" className={className}>
          <Globe className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem 
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
          >
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

