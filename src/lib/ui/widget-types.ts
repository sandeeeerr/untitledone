export type WidgetType = 'hello';

export interface WidgetItem {
  id: string;
  widgetType: WidgetType;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  locked?: boolean;
  title?: string;
}

export interface WidgetProps {
  id: string;
  title?: string;
}


