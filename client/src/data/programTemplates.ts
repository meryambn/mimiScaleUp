import { ProgramTemplate } from '@/types/program';
import { BarChart, Users, Flag } from 'lucide-react';

export const templates: ProgramTemplate[] = [
  {
    id: "template-1",
    name: "Tech Accelerator",
    description: "A comprehensive program for technology startups",
    phases: [
      {
        id: "phase-1",
        name: "Ideation",
        description: "Develop and validate business ideas",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        tasks: [
          {
            id: "task-1",
            name: "Market Research",
            description: "Conduct market analysis",
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        ],
        meetings: [
          {
            id: "meeting-1",
            title: "Kickoff Meeting",
            date: new Date(Date.now() + 24 * 60 * 60 * 1000),
            type: "group"
          }
        ],
        evaluationCriteria: [
          {
            id: "eval-1",
            name: "Market Understanding",
            description: "Understanding of target market",
            weight: 30,
            type: "numeric",
            accessibleBy: ["mentors"],
            requiresValidation: true,
            rubric: [
              {
                id: "rubric-1",
                score: 5,
                description: "Excellent market understanding"
              }
            ]
          }
        ],
        status: "not_started"
      }
    ],
    evaluationCriteria: [
      {
        id: "eval-1",
        name: "Market Potential",
        description: "Evaluation of market size and opportunity",
        weight: 30,
        type: "numeric",
        accessibleBy: ["mentors"],
        requiresValidation: true,
        rubric: [
          {
            id: "rubric-1",
            score: 5,
            description: "Excellent market understanding"
          }
        ]
      }
    ],
    formTemplates: [
      {
        id: "form-1",
        name: "Application Form",
        description: "Initial screening form",
        questions: [
          {
            id: "q-1",
            type: "text",
            text: "Describe your business idea",
            required: true
          }
        ]
      }
    ],
    dashboardWidgets: [
      {
        id: "widget-1",
        type: "progress",
        title: "Program Progress",
        description: "Overall program completion status",
        icon: BarChart,
        color: "blue",
        position: { x: 0, y: 0, w: 2, h: 1 },
        size: "medium",
        config: {},
        content: null
      },
      {
        id: "widget-2",
        type: "teams",
        title: "Teams Overview",
        description: "View participating teams",
        icon: Users,
        color: "green",
        position: { x: 2, y: 0, w: 2, h: 1 },
        size: "medium",
        config: {},
        content: null
      },
      {
        id: "widget-3",
        type: "evaluation",
        title: "Evaluation Progress",
        description: "Track evaluation progress",
        icon: Flag,
        color: "orange",
        position: { x: 0, y: 1, w: 4, h: 2 },
        size: "large",
        config: {},
        content: null
      }
    ],
    eligibilityCriteria: {
      minTeamSize: 2,
      maxTeamSize: 5,
      requiredStages: ["idea", "mvp"],
      requiredIndustries: ["technology", "software"],
      minRevenue: 0,
      maxRevenue: 1000000,
      requiredDocuments: ["pitch_deck", "financial_projections"]
    }
  }
]; 