import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { Program, Phase } from "@/types/program";
import { v4 as uuidv4 } from 'uuid';

// Example programs
const examplePrograms: Program[] = [
  {
    id: "1",
    name: "Tech Accelerator 2023",
    description: "A comprehensive accelerator program for early-stage technology startups",
    startDate: "2023-01-15",
    endDate: "2023-06-15",
    status: "active",
    phases: [
      {
        id: "phase1",
        name: "Idéation",
        description: "Développement et validation de l'idée",
        startDate: new Date("2023-01-15"),
        endDate: new Date("2023-02-15"),
        tasks: [],
        meetings: [],
        evaluationCriteria: [
          { id: '1', name: 'Idée Innovante', description: 'Niveau d\'innovation de l\'idée', weight: 40, accessibleBy: ['mentors'], requiresValidation: false },
          { id: '2', name: 'Analyse de Marché', description: 'Qualité de l\'analyse de marché', weight: 30, accessibleBy: ['mentors'], requiresValidation: false },
          { id: '3', name: 'Compétence de l\'Equipe', description: 'Compétences et expérience de l\'equipe', weight: 30, accessibleBy: ['mentors'], requiresValidation: false }
        ],
        status: "completed",
        color: "#818cf8"
      },
      {
        id: "phase2",
        name: "Prototypage",
        description: "Création d'un prototype fonctionnel",
        startDate: new Date("2023-02-16"),
        endDate: new Date("2023-03-31"),
        tasks: [],
        meetings: [],
        evaluationCriteria: [
          { id: '4', name: 'Qualité du Prototype', description: 'Qualité et fonctionnalité du prototype', weight: 35, accessibleBy: ['mentors'], requiresValidation: false },
          { id: '5', name: 'Faisabilité Technique', description: 'Faisabilité technique de la solution', weight: 35, accessibleBy: ['mentors'], requiresValidation: false },
          { id: '6', name: 'Expérience Utilisateur', description: 'Qualité de l\'expérience utilisateur', weight: 30, accessibleBy: ['mentors'], requiresValidation: false }
        ],
        status: "completed",
        color: "#60a5fa"
      },
      {
        id: "phase3",
        name: "Validation",
        description: "Tests et validation du marché",
        startDate: new Date("2023-04-01"),
        endDate: new Date("2023-04-30"),
        tasks: [],
        meetings: [],
        evaluationCriteria: [
          { id: '7', name: 'Résultats des Tests', description: 'Résultats des tests de validation', weight: 40, accessibleBy: ['mentors'], requiresValidation: false },
          { id: '8', name: 'Retour Utilisateurs', description: 'Qualité des retours utilisateurs', weight: 30, accessibleBy: ['mentors'], requiresValidation: false },
          { id: '9', name: 'Potentiel de Croissance', description: 'Potentiel de croissance et d\'expansion', weight: 30, accessibleBy: ['mentors'], requiresValidation: false }
        ],
        status: "in_progress",
        color: "#34d399"
      },
      {
        id: "phase4",
        name: "Lancement",
        description: "Préparation et lancement sur le marché",
        startDate: new Date("2023-05-01"),
        endDate: new Date("2023-06-15"),
        tasks: [],
        meetings: [],
        evaluationCriteria: [
          { id: '10', name: 'Stratégie de Lancement', description: 'Qualité de la stratégie de lancement', weight: 25, accessibleBy: ['mentors'], requiresValidation: false },
          { id: '11', name: 'Plan Marketing', description: 'Efficacité du plan marketing', weight: 25, accessibleBy: ['mentors'], requiresValidation: false },
          { id: '12', name: 'Modèle Économique', description: 'Viabilité du modèle économique', weight: 25, accessibleBy: ['mentors'], requiresValidation: false },
          { id: '13', name: 'Présentation Finale', description: 'Qualité de la présentation finale', weight: 25, accessibleBy: ['mentors'], requiresValidation: false }
        ],
        status: "not_started",
        color: "#fbbf24",
        hasWinner: true
      }
    ],
    evaluationCriteria: [],
    eligibilityCriteria: {
      minTeamSize: 1,
      maxTeamSize: 5,
      requiredStages: [],
      requiredIndustries: [],
      minRevenue: 0,
      maxRevenue: 1000000,
      requiredDocuments: []
    },
    dashboardWidgets: [],
    mentors: [],
    createdAt: "2022-11-01",
    updatedAt: "2023-01-15"
  },
  {
    id: "2",
    name: "Impact Ventures 2023",
    description: "Supporting startups focused on social and environmental impact",
    startDate: "2023-03-01",
    endDate: "2023-08-30",
    status: "active",
    phases: [
      {
        id: "phase1",
        name: "Découverte",
        description: "Exploration du problème et de l'impact social",
        startDate: new Date("2023-03-01"),
        endDate: new Date("2023-04-15"),
        tasks: [],
        meetings: [],
        evaluationCriteria: [
          { id: '1', name: 'Compréhension du Problème', description: 'Niveau de compréhension du problème', weight: 35, accessibleBy: ['mentors'], requiresValidation: false },
          { id: '2', name: 'Impact Social Potentiel', description: 'Potentiel d\'impact social', weight: 35, accessibleBy: ['mentors'], requiresValidation: false },
          { id: '3', name: 'Engagement Communautaire', description: 'Niveau d\'engagement avec la communauté', weight: 30, accessibleBy: ['mentors'], requiresValidation: false }
        ],
        status: "completed",
        color: "#a78bfa"
      },
      {
        id: "phase2",
        name: "Solution",
        description: "Développement de la solution",
        startDate: new Date("2023-04-16"),
        endDate: new Date("2023-06-15"),
        tasks: [],
        meetings: [],
        evaluationCriteria: [
          { id: '4', name: 'Innovation de la Solution', description: 'Niveau d\'innovation de la solution', weight: 30, accessibleBy: ['mentors'], requiresValidation: false },
          { id: '5', name: 'Faisabilité', description: 'Faisabilité technique et économique', weight: 30, accessibleBy: ['mentors'], requiresValidation: false },
          { id: '6', name: 'Durabilité', description: 'Durabilité de la solution', weight: 20, accessibleBy: ['mentors'], requiresValidation: false },
          { id: '7', name: 'Accessibilité', description: 'Accessibilité de la solution', weight: 20, accessibleBy: ['mentors'], requiresValidation: false }
        ],
        status: "in_progress",
        color: "#60a5fa"
      },
      {
        id: "phase3",
        name: "Impact",
        description: "Mesure et optimisation de l'impact",
        startDate: new Date("2023-06-16"),
        endDate: new Date("2023-07-31"),
        tasks: [],
        meetings: [],
        evaluationCriteria: [
          { id: '8', name: 'Méthodologie de Mesure', description: 'Qualité de la méthodologie de mesure', weight: 25, accessibleBy: ['mentors'], requiresValidation: false },
          { id: '9', name: 'Résultats Préliminaires', description: 'Qualité des résultats préliminaires', weight: 25, accessibleBy: ['mentors'], requiresValidation: false },
          { id: '10', name: 'Optimisation de l\'Impact', description: 'Stratégies d\'optimisation de l\'impact', weight: 25, accessibleBy: ['mentors'], requiresValidation: false },
          { id: '11', name: 'Rapport d\'Impact', description: 'Qualité du rapport d\'impact', weight: 25, accessibleBy: ['mentors'], requiresValidation: false }
        ],
        status: "not_started",
        color: "#34d399"
      },
      {
        id: "phase4",
        name: "Scaling",
        description: "Expansion et mise à l'échelle",
        startDate: new Date("2023-08-01"),
        endDate: new Date("2023-08-30"),
        tasks: [],
        meetings: [],
        evaluationCriteria: [
          { id: '12', name: 'Stratégie de Croissance', description: 'Qualité de la stratégie de croissance', weight: 25, accessibleBy: ['mentors'], requiresValidation: false },
          { id: '13', name: 'Modèle Économique Durable', description: 'Durabilité du modèle économique', weight: 25, accessibleBy: ['mentors'], requiresValidation: false },
          { id: '14', name: 'Partenariats Stratégiques', description: 'Qualité des partenariats stratégiques', weight: 25, accessibleBy: ['mentors'], requiresValidation: false },
          { id: '15', name: 'Plan de Financement', description: 'Solidité du plan de financement', weight: 25, accessibleBy: ['mentors'], requiresValidation: false }
        ],
        status: "not_started",
        color: "#f87171"
      }
    ],
    evaluationCriteria: [],
    eligibilityCriteria: {
      minTeamSize: 1,
      maxTeamSize: 5,
      requiredStages: [],
      requiredIndustries: [],
      minRevenue: 0,
      maxRevenue: 1000000,
      requiredDocuments: []
    },
    dashboardWidgets: [],
    mentors: [],
    createdAt: "2023-01-15",
    updatedAt: "2023-02-28"
  },
  {
    id: "3",
    name: "Programme Terminé 2022",
    description: "Un programme d'accélération qui est déjà terminé",
    startDate: "2022-01-01",
    endDate: "2022-12-31",
    status: "completed",
    phases: [
      {
        id: "phase1",
        name: "Phase 1",
        description: "Première phase du programme",
        startDate: new Date("2022-01-01"),
        endDate: new Date("2022-04-30"),
        tasks: [],
        meetings: [],
        evaluationCriteria: [],
        status: "completed",
        color: "#818cf8"
      },
      {
        id: "phase2",
        name: "Phase 2",
        description: "Deuxième phase du programme",
        startDate: new Date("2022-05-01"),
        endDate: new Date("2022-08-31"),
        tasks: [],
        meetings: [],
        evaluationCriteria: [],
        status: "completed",
        color: "#60a5fa"
      },
      {
        id: "phase3",
        name: "Phase 3",
        description: "Troisième phase du programme",
        startDate: new Date("2022-09-01"),
        endDate: new Date("2022-12-31"),
        tasks: [],
        meetings: [],
        evaluationCriteria: [],
        status: "completed",
        color: "#34d399"
      }
    ],
    evaluationCriteria: [],
    eligibilityCriteria: {
      minTeamSize: 1,
      maxTeamSize: 5,
      requiredStages: [],
      requiredIndustries: [],
      minRevenue: 0,
      maxRevenue: 1000000,
      requiredDocuments: []
    },
    dashboardWidgets: [],
    mentors: [],
    createdAt: "2021-12-01",
    updatedAt: "2023-01-15"
  },
  {
    id: "4",
    name: "Programme en Brouillon",
    description: "Un programme en cours de création",
    startDate: "2023-09-01",
    endDate: "2024-03-31",
    status: "active",
    phases: [
      {
        id: "phase1",
        name: "Phase 1",
        description: "Première phase du programme",
        startDate: new Date("2023-09-01"),
        endDate: new Date("2023-11-30"),
        tasks: [],
        meetings: [],
        evaluationCriteria: [],
        status: "not_started",
        color: "#818cf8"
      },
      {
        id: "phase2",
        name: "Phase 2",
        description: "Deuxième phase du programme",
        startDate: new Date("2023-12-01"),
        endDate: new Date("2024-03-31"),
        tasks: [],
        meetings: [],
        evaluationCriteria: [],
        status: "not_started",
        color: "#60a5fa"
      }
    ],
    evaluationCriteria: [],
    eligibilityCriteria: {
      minTeamSize: 1,
      maxTeamSize: 5,
      requiredStages: [],
      requiredIndustries: [],
      minRevenue: 0,
      maxRevenue: 1000000,
      requiredDocuments: []
    },
    dashboardWidgets: [],
    mentors: [],
    createdAt: "2023-07-15",
    updatedAt: "2023-07-15"
  }
];

interface ProgramContextType {
  selectedProgramId: string | null;
  setSelectedProgramId: (id: string | null) => void;
  programs: Program[];
  selectedProgram: Program | null;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  resetProgramCreation: () => void;
  setSelectedProgram: (program: Program) => void;
  createProgram: (program: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateProgram: (updatedProgram: Program) => void;
}

const ProgramContext = createContext<ProgramContextType | undefined>(undefined);

export const useProgramContext = () => {
  const context = useContext(ProgramContext);
  if (context === undefined) {
    throw new Error("useProgramContext must be used within a ProgramProvider");
  }
  return context;
};

interface ProgramProviderProps {
  children: ReactNode;
}

export const ProgramProvider: React.FC<ProgramProviderProps> = ({ children }) => {
  const [location] = useLocation();
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [programs, setPrograms] = useState<Program[]>(examplePrograms);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  // Get the selected program based on the ID
  const currentProgram = selectedProgramId
    ? programs.find(p => p.id === selectedProgramId) || null
    : null;

  // Auto-select the first program if none is selected, but only if we're not in the process of creating a new program
  useEffect(() => {
    // Vérifier si nous sommes sur la page de création de programme
    const isCreatingProgram = location.includes('/programs/create');

    // Ne pas sélectionner automatiquement le premier programme si nous sommes en train d'en créer un nouveau
    if (!selectedProgramId && programs.length > 0 && !isCreatingProgram) {
      console.log('%c Auto-sélection du premier programme:', "background: blue; color: white; padding: 5px; font-size: 14px;", programs[0].id);
      setSelectedProgramId(programs[0].id);
    }
  }, [selectedProgramId, programs, location]);

  // Check URL for program ID
  useEffect(() => {
    // If URL includes a program ID, select that program
    const match = location.match(/\/programs\/([^\/]+)/);
    if (match && match[1]) {
      const programId = match[1];
      // Only set if it's a valid program ID
      if (programs.some(p => p.id === programId)) {
        setSelectedProgramId(programId);
      }
    }
  }, [location, programs]);

  const resetProgramCreation = () => {
    setCurrentStep(1);
  };

  // Create a new program with unique ID
  const createProgram = (program: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>): string => {
    console.log('Creating program with mentors:', program.mentors);

    // Ensure mentors are properly formatted
    if (program.mentors && Array.isArray(program.mentors)) {
      program.mentors = program.mentors.map(mentor => {
        // Ensure expertise is an array
        if (typeof mentor.expertise === 'string') {
          return {
            ...mentor,
            expertise: mentor.expertise.split(',').map((e: string) => e.trim())
          };
        }
        return mentor;
      });
    }

    // Ajouter des phases par défaut si aucune n'est définie
    if (!program.phases || program.phases.length === 0) {
      const defaultPhases: Phase[] = [
        {
          id: "phase1",
          name: "Idéation",
          description: "Développement et validation de l'idée",
          startDate: new Date(),
          endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
          tasks: [],
          meetings: [],
          evaluationCriteria: [
            { id: '1', name: 'Idée Innovante', description: 'Niveau d\'innovation de l\'idée', weight: 40, accessibleBy: ['mentors'], requiresValidation: false },
            { id: '2', name: 'Analyse de Marché', description: 'Qualité de l\'analyse de marché', weight: 30, accessibleBy: ['mentors'], requiresValidation: false },
            { id: '3', name: 'Compétence de l\'Equipe', description: 'Compétences et expérience de l\'equipe', weight: 30, accessibleBy: ['mentors'], requiresValidation: false }
          ],
          status: "not_started",
          color: "#818cf8",
          deliverables: [
            {
              id: `deliverable-${Date.now()}-1`,
              name: "Présentation de l'idée",
              description: "Préparez une présentation détaillée de votre idée d'entreprise",
              dueDate: new Date(new Date().setDate(new Date().getDate() + 14)),
              status: "pending",
              submissionType: "file",
              required: true,
              assignedBy: "Program Manager",
              assignmentDate: new Date().toISOString(),
              teamsAssigned: ["All Teams"]
            },
            {
              id: `deliverable-${Date.now()}-2`,
              name: "Analyse de marché",
              description: "Fournissez une analyse détaillée du marché cible et de la concurrence",
              dueDate: new Date(new Date().setDate(new Date().getDate() + 21)),
              status: "pending",
              submissionType: "file",
              required: true,
              assignedBy: "Program Manager",
              assignmentDate: new Date().toISOString(),
              teamsAssigned: ["All Teams"]
            }
          ]
        },
        {
          id: "phase2",
          name: "Prototypage",
          description: "Création d'un prototype fonctionnel",
          startDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
          endDate: new Date(new Date().setMonth(new Date().getMonth() + 2)),
          tasks: [],
          meetings: [],
          evaluationCriteria: [
            { id: '4', name: 'Qualité du Prototype', description: 'Qualité et fonctionnalité du prototype', weight: 35, accessibleBy: ['mentors'], requiresValidation: false },
            { id: '5', name: 'Faisabilité Technique', description: 'Faisabilité technique de la solution', weight: 35, accessibleBy: ['mentors'], requiresValidation: false },
            { id: '6', name: 'Expérience Utilisateur', description: 'Qualité de l\'expérience utilisateur', weight: 30, accessibleBy: ['mentors'], requiresValidation: false }
          ],
          status: "not_started",
          color: "#60a5fa",
          deliverables: [
            {
              id: `deliverable-${Date.now()}-3`,
              name: "Prototype initial",
              description: "Soumettez un prototype initial ou une maquette de votre produit/service",
              dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1, 15)),
              status: "pending",
              submissionType: "file",
              required: true,
              assignedBy: "Technical Advisor",
              assignmentDate: new Date().toISOString(),
              teamsAssigned: ["All Teams"]
            }
          ]
        },
        {
          id: "phase3",
          name: "Validation",
          description: "Tests et validation du marché",
          startDate: new Date(new Date().setMonth(new Date().getMonth() + 2)),
          endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
          tasks: [],
          meetings: [],
          evaluationCriteria: [
            { id: '7', name: 'Résultats des Tests', description: 'Résultats des tests de validation', weight: 40, accessibleBy: ['mentors'], requiresValidation: false },
            { id: '8', name: 'Retour Utilisateurs', description: 'Qualité des retours utilisateurs', weight: 30, accessibleBy: ['mentors'], requiresValidation: false },
            { id: '9', name: 'Potentiel de Croissance', description: 'Potentiel de croissance et d\'expansion', weight: 30, accessibleBy: ['mentors'], requiresValidation: false }
          ],
          status: "not_started",
          color: "#34d399",
          deliverables: [
            {
              id: `deliverable-${Date.now()}-4`,
              name: "Résultats des tests utilisateurs",
              description: "Partagez les résultats des tests utilisateurs et les retours du marché",
              dueDate: new Date(new Date().setMonth(new Date().getMonth() + 2, 15)),
              status: "pending",
              submissionType: "file",
              required: true,
              assignedBy: "Program Director",
              assignmentDate: new Date().toISOString(),
              teamsAssigned: ["All Teams"]
            },
            {
              id: `deliverable-${Date.now()}-5`,
              name: "Pitch final",
              description: "Préparez un pitch final pour la démonstration de votre produit/service",
              dueDate: new Date(new Date().setMonth(new Date().getMonth() + 3, 1)),
              status: "pending",
              submissionType: "file",
              required: true,
              assignedBy: "Program Director",
              assignmentDate: new Date().toISOString(),
              teamsAssigned: ["All Teams"]
            }
          ]
        }
      ];
      program.phases = defaultPhases;
    }

    const now = new Date().toISOString();
    const newProgram: Program = {
      ...program,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now
    };

    console.log('Creating new program:', newProgram);
    setPrograms(prevPrograms => [...prevPrograms, newProgram]);

    // Automatically select the newly created program
    console.log('%c Setting selected program ID to:', "background: red; color: white; padding: 5px; font-size: 14px;", newProgram.id, "type:", typeof newProgram.id);
    setSelectedProgramId(newProgram.id);

    // Vérifier immédiatement si le selectedProgramId a été correctement défini
    console.log('%c selectedProgramId après setSelectedProgramId:', "background: orange; color: black; padding: 5px; font-size: 14px;", selectedProgramId, "type:", typeof selectedProgramId);

    // Publish the program data for other contexts to consume
    // This will trigger a custom event that other contexts can listen for
    const programCreatedEvent = new CustomEvent('program-created', {
      detail: {
        programId: newProgram.id,
        program: newProgram
      }
    });
    console.log('Dispatching program-created event:', {
      programId: newProgram.id,
      phasesCount: newProgram.phases?.length || 0,
      meetingsCount: newProgram.phases?.reduce((count, phase) =>
        count + (phase.meetings?.length || 0), 0) || 0
    });
    document.dispatchEvent(programCreatedEvent);

    // Add a delay and verify the selected program ID was set correctly
    setTimeout(() => {
      console.log('%c After program creation - Selected program ID:', "background: purple; color: white; padding: 5px; font-size: 14px;", selectedProgramId, "type:", typeof selectedProgramId);

      // Vérifier si le selectedProgramId est différent de l'ID du nouveau programme
      if (selectedProgramId !== newProgram.id) {
        console.log('%c CORRECTION: Le selectedProgramId ne correspond pas au nouveau programme', "background: red; color: white; padding: 5px; font-size: 14px;");
        console.log('%c Forcer la sélection du nouveau programme:', "background: green; color: white; padding: 5px; font-size: 14px;", newProgram.id);
        setSelectedProgramId(newProgram.id);
      }
    }, 100);

    return newProgram.id;
  };

  // Fonction pour mettre à jour un programme existant
  const updateProgram = (updatedProgram: Program) => {
    // Mettre à jour le programme dans la liste des programmes
    const updatedPrograms = programs.map(program =>
      program.id === updatedProgram.id ? updatedProgram : program
    );

    // Mettre à jour l'état des programmes
    setPrograms(updatedPrograms);

    // Stocker les programmes mis à jour dans le localStorage
    localStorage.setItem('programs', JSON.stringify(updatedPrograms));

    // Si le programme mis à jour est le programme sélectionné, mettre à jour l'ID sélectionné
    if (selectedProgramId === updatedProgram.id) {
      // Forcer une mise à jour du programme sélectionné
      setSelectedProgramId(null);
      setTimeout(() => {
        setSelectedProgramId(updatedProgram.id);
      }, 10);
    }
  };

  return (
    <ProgramContext.Provider
      value={{
        selectedProgramId,
        setSelectedProgramId,
        programs,
        selectedProgram: currentProgram,
        currentStep,
        setCurrentStep,
        resetProgramCreation,
        setSelectedProgram,
        createProgram,
        updateProgram
      }}
    >
      {children}
    </ProgramContext.Provider>
  );
};
