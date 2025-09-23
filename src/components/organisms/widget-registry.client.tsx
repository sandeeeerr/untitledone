'use client';

import type { ReactNode } from 'react';
import type { WidgetItem } from '@/lib/ui/widget-types';
import HelloWidget from './widgets/hello-widget.client';
import WidgetFrame from '@/components/molecules/widget-frame.client';

interface RegistryProps {
  item: WidgetItem;
}

export function WidgetRegistry({ item }: RegistryProps) {
  let content: ReactNode;
  switch (item.widgetType) {
    case 'hello':
      content = <HelloWidget id={item.id} title={item.title} />;
      break;
    default:
      content = (
        <div className="text-sm text-muted-foreground">Unknown widget: {item.widgetType}</div>
      );
  }

  return <WidgetFrame title={item.title} inactive={true}>{content}</WidgetFrame>;
}

export default WidgetRegistry;


