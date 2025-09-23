'use client';

import type { WidgetProps } from '@/lib/ui/widget-types';

export default function HelloWidget({ id, title }: WidgetProps) {
  return (
    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
      <div>
        <div className="font-medium text-foreground mb-1">Hello Widget</div>
        <div>ID: {id}</div>
        {title ? <div>Title: {title}</div> : null}
      </div>
    </div>
  );
}


