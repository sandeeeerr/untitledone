'use client';

import { useEffect, useMemo, useRef } from 'react';
import type { WidgetItem } from '@/lib/ui/widget-types';
import {
  GridStack,
  type GridStackOptions,
  type GridStackNode,
  type GridStackNodesHandler,
  type GridStackElementHandler,
} from 'gridstack';
import { WidgetRegistry } from './widget-registry.client';

export interface WidgetGridProps {
  items: WidgetItem[];
  options?: GridStackOptions;
  onLayoutChange?: (items: WidgetItem[]) => void;
  editable?: boolean;
  dragInSelector?: string;
  trashSelector?: string;
  onItemsAdded?: (items: WidgetItem[]) => void;
  onItemsRemoved?: (ids: string[]) => void;
}

export function WidgetGrid({ items, options, onLayoutChange, editable = false, dragInSelector = '#dashboard-toolbar .grid-stack-item', trashSelector = '#dashboard-trash', onItemsAdded, onItemsRemoved }: WidgetGridProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<GridStack | null>(null);
  const onLayoutChangeRef = useRef<WidgetGridProps['onLayoutChange']>(undefined);
  const onItemsAddedRef = useRef<WidgetGridProps['onItemsAdded']>(undefined);
  const onItemsRemovedRef = useRef<WidgetGridProps['onItemsRemoved']>(undefined);

  // keep latest callbacks without re-binding events
  useEffect(() => { onLayoutChangeRef.current = onLayoutChange; }, [onLayoutChange]);
  useEffect(() => { onItemsAddedRef.current = onItemsAdded; }, [onItemsAdded]);
  useEffect(() => { onItemsRemovedRef.current = onItemsRemoved; }, [onItemsRemoved]);

  const allowedWidths = useMemo(() => [4, 6, 12], []);
  const allowedHeights = useMemo(() => [2, 3, 4], []);

  const clampToAllowed = (value: number, allowed: number[]) => {
    let best = allowed[0];
    let bestDiff = Math.abs(value - best);
    for (let i = 1; i < allowed.length; i++) {
      const current = allowed[i];
      const diff = Math.abs(value - current);
      if (diff < bestDiff) {
        best = current;
        bestDiff = diff;
      }
    }
    return best;
  };

  const gridOptions: GridStackOptions = useMemo(
    () => ({
      column: 12,
      margin: 8,
      float: true,
      acceptWidgets: editable ? true : undefined,
      removable: editable ? trashSelector : undefined,
      ...options,
    }),
    [options, editable, trashSelector]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    let created = false;
    let grid = gridRef.current;

    if (!grid) {
      grid = GridStack.init(gridOptions, containerRef.current);
      gridRef.current = grid;
      created = true;
    } else {
      grid.updateOptions(gridOptions);
    }

    if (editable) {
      GridStack.setupDragIn(dragInSelector, undefined, [{ w: 4, h: 2 }]);
    }

    const handleChange: GridStackNodesHandler = (
      _event,
      changedItems
    ) => {
      if (!changedItems) return;
      const mapped = changedItems.map((n: GridStackNode) => ({
        id: String((n as GridStackNode & { id?: string }).id ?? n.el?.getAttribute('gs-id') ?? ''),
        widgetType: ((n.el?.getAttribute('data-widget-type') as string) ?? 'hello') as 'hello',
        x: n.x ?? 0,
        y: n.y ?? 0,
        w: n.w ?? 1,
        h: n.h ?? 1,
        minW: n.minW,
        minH: n.minH,
        locked: !!n.locked,
        title: n.el?.getAttribute('data-title') ?? undefined,
      }));
      onLayoutChangeRef.current?.(mapped);
    };

    const handleElementEvent: GridStackElementHandler = (_event, el) => {
      const node = (el as HTMLElement & { gridstackNode?: GridStackNode }).gridstackNode;
      if (!node) return;
      const targetW = clampToAllowed(node.w ?? 1, allowedWidths);
      const targetH = clampToAllowed(node.h ?? 1, allowedHeights);
      if (targetW !== node.w || targetH !== node.h) {
        grid.update(el, { w: targetW, h: targetH });
      }
    };

    const handleAdded: GridStackNodesHandler = (_event, nodes) => {
      if (!nodes?.length) return;
      const created: WidgetItem[] = [];
      nodes.forEach((n, idx) => {
        const el = n.el as HTMLElement | undefined;
        if (!el) return;
        let id = String((n as GridStackNode & { id?: string }).id ?? el.getAttribute('gs-id') ?? '');
        if (!id) {
          id = `w-${Date.now()}-${idx}`;
          grid.update(el, { id });
        }
        const w = clampToAllowed(n.w ?? 1, allowedWidths);
        const h = clampToAllowed(n.h ?? 1, allowedHeights);
        if (w !== n.w || h !== n.h) {
          grid.update(el, { w, h });
        }
        el.setAttribute('data-widget-type', el.getAttribute('data-widget-type') ?? 'hello');
        const title = el.getAttribute('data-title') ?? 'New Widget';
        const item: WidgetItem = {
          id,
          widgetType: ((el.getAttribute('data-widget-type') as string) ?? 'hello') as 'hello',
          x: n.x ?? 0,
          y: n.y ?? 0,
          w,
          h,
          minW: n.minW,
          minH: n.minH,
          locked: !!n.locked,
          title,
        };
        created.push(item);
      });
      if (created.length) onItemsAddedRef.current?.(created);
    };

    const handleRemoved: GridStackNodesHandler = (_event, nodes) => {
      if (!nodes?.length) return;
      const ids = nodes
        .map((n) => String((n as GridStackNode & { id?: string }).id ?? n.el?.getAttribute('gs-id') ?? ''))
        .filter(Boolean);
      if (ids.length) onItemsRemovedRef.current?.(ids);
    };

    grid.on('change', handleChange);
    grid.on('added', handleAdded);
    grid.on('removed', handleRemoved);
    grid.on('dragstop', handleElementEvent);
    grid.on('resizestop', handleElementEvent);

    return () => {
      if (created) {
        try {
          grid.off('change');
          grid.off('added');
          grid.off('removed');
          grid.off('dragstop');
          grid.off('resizestop');
          grid.destroy(false);
        } catch {
          // ignore cleanup errors (can happen in strict/dev double-invoke)
        }
        gridRef.current = null;
      } else {
        // no-op: we didn't create this instance in this effect run
      }
    };
  }, [gridOptions, editable, dragInSelector, allowedWidths, allowedHeights]);

  return (
    <div ref={containerRef} className="grid-stack">
      {items.map((item) => (
        <div
          key={item.id}
          className="grid-stack-item"
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          gs-id={item.id}
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          gs-x={item.x}
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          gs-y={item.y}
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          gs-w={item.w}
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          gs-h={item.h}
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          gs-min-w={item.minW}
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          gs-min-h={item.minH}
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          gs-locked={item.locked ? 'true' : undefined}
          data-widget-type={item.widgetType}
          data-title={item.title}
        >
          <div className="grid-stack-item-content h-full">
            <WidgetRegistry item={item} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default WidgetGrid;


