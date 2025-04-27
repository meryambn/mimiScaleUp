import { z } from "zod";

// User types
export interface User {
  id: number;
  username: string;
  password: string;
  name: string;
  email: string;
  role: string;
  profileImage?: string | null;
}

export interface InsertUser {
  username: string;
  password: string;
  name: string;
  email: string;
  role?: string;
  profileImage?: string | null;
}

// Program template types
export interface ProgramTemplate {
  id: number;
  name: string;
  description: string;
  type: string;
  phases: any;
  evaluationCriteria: any;
  formTemplates: any;
  dashboardLayout?: any;
  popular?: boolean;
}

export interface InsertProgramTemplate {
  name: string;
  description: string;
  type: string;
  phases: any;
  evaluationCriteria: any;
  formTemplates: any;
  dashboardLayout?: any;
  popular?: boolean;
}

// Program types
export interface Program {
  id: number;
  name: string;
  description: string;
  templateId?: number;
  startDate: Date | string;
  endDate: Date | string;
  phases: any;
  dashboardLayout?: any;
  active?: boolean;
}

export interface InsertProgram {
  name: string;
  description: string;
  templateId?: number;
  startDate: Date | string;
  endDate: Date | string;
  phases: any;
  dashboardLayout?: any;
  active?: boolean;
}

// Mentor types
export interface Mentor {
  id: number;
  name: string;
  email: string;
  expertise: string;
  bio?: string | null;
  profileImage?: string | null;
  userId?: number | null;
  title?: string | null;
  rating?: number | null;
  isTopMentor?: boolean | null;
  calendlyUrl?: string | null;
  linkedinUrl?: string | null;
}

export interface InsertMentor {
  name: string;
  email: string;
  expertise: string;
  bio?: string;
  profileImage?: string;
  userId?: number;
  title?: string;
  rating?: number;
  isTopMentor?: boolean;
  calendlyUrl?: string;
  linkedinUrl?: string;
}

// Program mentors types
export interface ProgramMentor {
  id: number;
  programId: number;
  mentorId: number;
}

export interface InsertProgramMentor {
  programId: number;
  mentorId: number;
}

// Startup types
export interface Startup {
  id: number;
  name: string;
  description: string;
  founderNames: string;
  industry: string;
  website?: string;
  logo?: string;
  programId?: number;
  userId?: number;
}

export interface InsertStartup {
  name: string;
  description: string;
  founderNames: string;
  industry: string;
  website?: string;
  logo?: string;
  programId?: number;
  userId?: number;
}

// Application form types
export interface ApplicationForm {
  id: number;
  name: string;
  description: string;
  programId: number;
  questions: any;
  settings?: any;
}

export interface InsertApplicationForm {
  name: string;
  description: string;
  programId: number | string;
  questions?: any;
  settings?: any;
  formSchema?: string;
  isActive?: boolean;
}

// Widget types
export interface Widget {
  id: number;
  name: string;
  type: string;
  icon: string;
  description?: string;
  config?: any;
}

export interface InsertWidget {
  name: string;
  type: string;
  icon: string;
  description?: string;
  config?: any;
}
