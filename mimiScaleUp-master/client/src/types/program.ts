import { WidgetData, WidgetPosition } from './widgets';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

export interface Task {
  id: string;
  name: string;
  description: string;
  dueDate: Date;
  status?: 'todo' | 'in_progress' | 'completed';
}

export interface Meeting {
  id: string;
  title: string;
  date: Date;
  type: string;
  name?: string;
  time?: string;
  duration?: number;
  description?: string;
  attendees?: string[];
  location?: string;
  meetingType?: 'online' | 'in-person' | 'hybrid';
}

export interface EvaluationCriterion {
  id: string;
  name: string;
  description: string;
  weight: number;
  type?: 'numeric' | 'star_rating' | 'yes_no' | 'liste_deroulante';
  accessibleBy: string[];
  filledBy?: 'mentors' | 'teams';
  requiresValidation: boolean;
  options?: string[];
  rubric?: {
    id: string;
    score: number;
    description: string;
  }[];
}

export interface Deliverable {
  id: string;
  name: string;
  description: string;
  dueDate: Date;
  status: 'pending' | 'submitted' | 'reviewed';
  submissionType?: 'file' | 'link' | 'text';
  required?: boolean;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  assignedBy?: string;
  assignmentDate?: string;
  teamsAssigned?: string[];
}

export interface Phase {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  tasks: Task[];
  meetings: Meeting[];
  evaluationCriteria: EvaluationCriterion[];
  status: 'not_started' | 'in_progress' | 'completed';
  color?: string;
  hasWinner?: boolean;
  deliverables?: Deliverable[];
}

export interface PhaseDetails extends Phase {
  deliverables: Deliverable[];
}

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  questions: {
    id: string;
    type: string;
    text: string;
    required: boolean;
    options?: string[];
  }[];
}

export interface DashboardWidget extends WidgetData {
  content: ReactNode;
  position: WidgetPosition;
}

export interface ProgramTemplate {
  id: string;
  name: string;
  description: string;
  phases: Phase[];
  evaluationCriteria: EvaluationCriterion[];
  formTemplates: FormTemplate[];
  dashboardWidgets: DashboardWidget[];
  startDate?: Date;
  endDate?: Date;
  mentors?: any[];
  eligibilityCriteria?: {
    minTeamSize: number;
    maxTeamSize: number;
    requiredStages: string[];
    requiredIndustries: string[];
    minRevenue: number;
    maxRevenue: number;
    requiredDocuments: string[];
  };
  createdAt?: string;
  createdBy?: string;
  isCustom?: boolean;
}

export interface SavedProgramTemplate {
  id: string;
  name: string;
  description: string;
  programData: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>;
  createdAt: string;
  createdBy?: string;
}

export interface EligibilityCriteria {
  minTeamSize: number;
  maxTeamSize: number;
  requiredStages: string[];
  requiredIndustries: string[];
  minRevenue: number;
  maxRevenue: number;
  requiredDocuments: string[];
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: string;
  url: string;
  is_external?: boolean;
  created_at: string;
  program_id: number;
  category?: string;
}

export interface Program {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: "active" | "completed" | "draft";
  phases: Phase[];
  evaluationCriteria: EvaluationCriterion[];
  eligibilityCriteria?: EligibilityCriteria;
  dashboardWidgets?: WidgetData[];
  mentors?: any[];
  resources?: Resource[];
  hasWinner?: boolean;
  createdAt: string;
  updatedAt: string;
}