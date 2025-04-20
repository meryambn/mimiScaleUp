import { LucideIcon } from 'lucide-react';

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WidgetData {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  size: 'small' | 'medium' | 'large';
  position: WidgetPosition;
  config: Record<string, any>;
  content?: React.ReactNode;
} 