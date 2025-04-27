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
  position: WidgetPosition;
  content: React.ReactNode;
  size?: "small" | "medium" | "large" | "full";
  data?: any;
}

export type WidgetType =
  | 'numberOfStartups'
  | 'progressTracker'
  | 'upcomingMeetings'
  | 'evaluationCriteria'
  | 'eligibilityCriteria'
  | 'overallTasks'
  | 'phases'
  | 'resources';