'use client';

import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface WidgetFrameProps {
  title?: string;
  children: ReactNode;
  inactive?: boolean;
}

export function WidgetFrame({ title, children, inactive = false }: WidgetFrameProps) {
  return (
    <Card className="h-full relative overflow-hidden">
      {inactive && (
        <div className="absolute inset-0 z-10 bg-background/70 backdrop-blur-[1px] flex items-center justify-center select-none">
          <span className="text-xs text-muted-foreground">Inactive</span>
        </div>
      )}
      <CardContent className="p-3 sm:p-4 h-full flex flex-col">
        {title ? (
          <div className="text-sm font-medium mb-2 truncate" title={title}>
            {title}
          </div>
        ) : null}
        <div className="flex-1 min-h-0 opacity-100">{children}</div>
      </CardContent>
    </Card>
  );
}

export default WidgetFrame;


