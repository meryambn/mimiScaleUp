import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { Program, Phase } from "@/types/program";
import { v4 as uuidv4 } from 'uuid';
import * as programService from "@/services/programService";
import {
  getProgram,
  getPhases,
  getTasks,
  getReunions,
  getCriteres,
  getLivrables,
  createCritere,
  createReunion,
  createLivrable
} from "@/services/programService";

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
  createProgram: (program: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateProgram: (updatedProgram: Program) => void;
  deleteProgram: (programId: string) => Promise<boolean>;
  isLoading: boolean;
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

// Utility function to deduplicate programs by ID
const deduplicatePrograms = (programs: Program[]): Program[] => {
  const programsMap = new Map<string, Program>();

  // Add all programs to the map (this will automatically deduplicate by ID)
  programs.forEach(program => {
    programsMap.set(program.id, program);
  });

  // Convert map back to array
  return Array.from(programsMap.values());
};

export const ProgramProvider: React.FC<ProgramProviderProps> = ({ children }) => {
  const [location] = useLocation();
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [programs, setPrograms] = useState<Program[]>(examplePrograms);
  const [currentStep, setCurrentStep] = useState<number>(1);
  // selectedProgram is used in the context value
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  // isLoading is used to track API request status
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Custom setter for programs that ensures deduplication
  const setDeduplicatedPrograms = (newPrograms: Program[] | ((prev: Program[]) => Program[])) => {
    if (typeof newPrograms === 'function') {
      setPrograms(prev => deduplicatePrograms(newPrograms(prev)));
    } else {
      setPrograms(deduplicatePrograms(newPrograms));
    }
  };

  // Define the function to load programs from the backend
  const loadProgramsFromBackend = async () => {
      try {
        setIsLoading(true);
        console.log('Loading programs from backend...');

        // Since there's no endpoint to get all programs, we'll try a range of IDs
        // This is a workaround to fetch all programs without a dedicated endpoint

        // Create a Set to track program IDs we've already processed
        // This will help prevent duplicates
        const processedProgramIds = new Set<number>();

        // Try to find programs by checking a range of IDs
        // Start with the most recent IDs (higher numbers) to prioritize newer programs
        const programIds: number[] = [];

        // Check the most recent 200 IDs
        for (let i = 200; i >= 1; i--) {
          programIds.push(i);
        }

        console.log(`Checking for programs with IDs from 200 down to 1...`);

        // Try to fetch each program
        const fetchedPrograms: Program[] = [];

        // Keep track of consecutive failures to optimize the process
        let consecutiveFailures = 0;
        const MAX_CONSECUTIVE_FAILURES = 10;

        for (const id of programIds) {
          // Skip IDs we've already processed
          if (processedProgramIds.has(id)) {
            console.log(`Skipping already processed program ID: ${id}`);
            continue;
          }

          // If we've had too many consecutive failures, assume we've reached the end of valid programs
          if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
            console.log(`Stopping program search after ${MAX_CONSECUTIVE_FAILURES} consecutive failures`);
            break;
          }

          try {
            const programDetails = await getProgram(id);
            if (programDetails) {
              // Mark this ID as processed
              processedProgramIds.add(id);

              consecutiveFailures = 0; // Reset counter on success
              console.log(`Found program with ID ${id}:`, programDetails.nom);

              // Map mentors from backend format to frontend format
              const mappedMentors = (programDetails.mentors || []).map((mentor: any) => ({
                id: mentor.utilisateur_id,
                name: `${mentor.prenom} ${mentor.nom}`,
                expertise: mentor.profession || 'General',
                bio: mentor.bio || `${mentor.prenom} ${mentor.nom} - ${mentor.profession || 'Mentor'}`,
                email: mentor.email || `mentor${mentor.utilisateur_id}@example.com`,
                title: mentor.profession || 'Program Mentor',
                rating: 4.5, // Default rating
                isTopMentor: true // Default value
              }));

              console.log('Mapped mentors:', mappedMentors);

              // Parse array fields from PostgreSQL format if needed
              let requiredStages = [];
              let requiredIndustries = [];
              let requiredDocuments = [];

              try {
                // Handle PostgreSQL array format like "{item1,item2}"
                if (typeof programDetails.phases_requises === 'string') {
                  requiredStages = programDetails.phases_requises
                    .replace(/^\{|\}$/g, '') // Remove { and }
                    .split(',')
                    .filter(Boolean)
                    .map((item: string) => item.trim().replace(/^"|"$/g, '')); // Remove quotes
                } else if (Array.isArray(programDetails.phases_requises)) {
                  requiredStages = programDetails.phases_requises;
                }

                if (typeof programDetails.industries_requises === 'string') {
                  requiredIndustries = programDetails.industries_requises
                    .replace(/^\{|\}$/g, '')
                    .split(',')
                    .filter(Boolean)
                    .map((item: string) => item.trim().replace(/^"|"$/g, ''));
                } else if (Array.isArray(programDetails.industries_requises)) {
                  requiredIndustries = programDetails.industries_requises;
                }

                if (typeof programDetails.documents_requis === 'string') {
                  requiredDocuments = programDetails.documents_requis
                    .replace(/^\{|\}$/g, '')
                    .split(',')
                    .filter(Boolean)
                    .map((item: string) => item.trim().replace(/^"|"$/g, ''));
                } else if (Array.isArray(programDetails.documents_requis)) {
                  requiredDocuments = programDetails.documents_requis;
                }
              } catch (error) {
                console.error('Error parsing array fields:', error);
              }

              console.log('Parsed eligibility criteria:', {
                stages: requiredStages,
                industries: requiredIndustries,
                documents: requiredDocuments
              });

              // We need to fetch phases for this program to ensure they're loaded correctly
              let programPhases: Phase[] = [];
              try {
                // Fetch phases for this program
                const phases = await getPhases(id);
                console.log(`Loaded ${phases.length} phases for program ${id}:`, phases);

                if (phases && phases.length > 0) {
                  // Map phases to frontend format
                  programPhases = phases.map((phase: any) => {
                    // Determine phase status based on dates
                    const now = new Date();
                    const startDate = new Date(phase.date_debut);
                    const endDate = new Date(phase.date_fin);

                    let phaseStatus: "not_started" | "in_progress" | "completed" = "not_started";
                    if (now > endDate) {
                      phaseStatus = "completed";
                    } else if (now >= startDate && now <= endDate) {
                      phaseStatus = "in_progress";
                    }

                    return {
                      id: String(phase.id),
                      name: phase.nom,
                      description: phase.description,
                      startDate: new Date(phase.date_debut),
                      endDate: new Date(phase.date_fin),
                      status: phaseStatus,
                      color: "#818cf8", // Default color
                      tasks: [],
                      meetings: [],
                      evaluationCriteria: [],
                      deliverables: []
                    };
                  });
                }
              } catch (error) {
                console.error(`Error fetching phases for program ${id}:`, error);
              }

              // Convert to frontend format
              const convertedProgram = {
                id: String(programDetails.id),
                name: programDetails.nom,
                description: programDetails.description,
                startDate: programDetails.date_debut,
                endDate: programDetails.date_fin,
                status: "active" as "active" | "completed" | "draft",
                phases: programPhases,
                mentors: mappedMentors,
                evaluationCriteria: [],
                eligibilityCriteria: {
                  minTeamSize: programDetails.taille_equipe_min || 1,
                  maxTeamSize: programDetails.taille_equipe_max || 5,
                  requiredStages: requiredStages,
                  requiredIndustries: requiredIndustries,
                  minRevenue: programDetails.ca_min || 0,
                  maxRevenue: programDetails.ca_max || 100000,
                  requiredDocuments: requiredDocuments
                },
                dashboardWidgets: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };

              // Check if this program is already in the fetchedPrograms array
              const isDuplicate = fetchedPrograms.some(p => p.id === convertedProgram.id);
              if (!isDuplicate) {
                fetchedPrograms.push(convertedProgram);
              } else {
                console.log(`Skipping duplicate program with ID ${convertedProgram.id}`);
              }
            }
          } catch (error) {
            // Increment the consecutive failures counter
            consecutiveFailures++;
            // Ignore errors for programs that don't exist
            // Don't log these errors to avoid cluttering the console
          }
        }

        console.log('Fetched programs from API:', fetchedPrograms.length);

        if (fetchedPrograms.length > 0) {
          // Use programs from the backend, but make sure there are no duplicates
          // Create a Map to deduplicate programs by ID
          const programsMap = new Map();

          // Add all fetched programs to the map
          fetchedPrograms.forEach(program => {
            programsMap.set(program.id, program);
          });

          // Convert map back to array
          const uniquePrograms = Array.from(programsMap.values());
          console.log(`Found ${uniquePrograms.length} unique programs`);

          // Replace the programs state entirely with the unique programs from the backend
          // This ensures we don't have any duplicates from previous loads
          setPrograms(uniquePrograms);
        } else {
          // Fallback to example programs if no programs found
          console.log('No programs found in backend, using example programs');
          setPrograms(examplePrograms);
        }

      } catch (error) {
        console.error('Error loading programs:', error);
        // Fallback to example programs
        setPrograms(examplePrograms);
      } finally {
        setIsLoading(false);
      }
  };

  // Load programs directly from the backend on mount
  useEffect(() => {
    loadProgramsFromBackend();
  }, []);

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
      // Deduplicate programs by ID before selecting the first one
      const uniqueProgramIds = new Set(programs.map(p => p.id));
      const uniquePrograms = Array.from(uniqueProgramIds).map(id =>
        programs.find(p => p.id === id)
      ).filter(Boolean);

      if (uniquePrograms.length > 0) {
        console.log('%c Auto-sélection du premier programme:', "background: blue; color: white; padding: 5px; font-size: 14px;", uniquePrograms[0].id);
        setSelectedProgramId(uniquePrograms[0].id);
      }
    }
  }, [selectedProgramId, programs, location]);

  // Fetch program details when a program is selected
  useEffect(() => {
    if (selectedProgramId) {
      const fetchProgramDetails = async () => {
        try {
          console.log(`Fetching details for program ${selectedProgramId}...`);

          // Convert string ID to number if needed
          const programIdNumber = parseInt(selectedProgramId);

          if (isNaN(programIdNumber)) {
            console.log('Program ID is not a number, skipping API fetch');
            return;
          }

          // Fetch program details including mentors
          const programDetails = await getProgram(programIdNumber);
          console.log('Loaded program details:', programDetails);

          // Log the program type to help debug
          console.log('Program type:', programDetails.type);

          if (programDetails) {
            // Fetch phases for this program
            const phases = await getPhases(programIdNumber);
            console.log('Loaded phases:', phases);

            // Fetch tasks, meetings, criteria, and deliverables for each phase
            const phasesWithDetails = await Promise.all(
              phases.map(async (phase: any) => {
                try {
                  // Fetch tasks
                  const tasks = await getTasks(phase.id);

                  // Fetch meetings (reunions)
                  let meetings = [];
                  try {
                    meetings = await getReunions(phase.id);

                    // If meetings is not an array, make it one
                    if (!Array.isArray(meetings)) {
                      meetings = [];
                    }
                  } catch (meetingError) {
                    console.error(`Error fetching meetings for phase ${phase.id}:`, meetingError);
                    meetings = [];
                  }

                  // Fetch evaluation criteria
                  let evaluationCriteria = [];
                  try {
                    evaluationCriteria = await getCriteres(phase.id);

                    // If criteria is not an array, make it one
                    if (!Array.isArray(evaluationCriteria)) {
                      evaluationCriteria = [];
                    }
                  } catch (criteriaError) {
                    console.error(`Error fetching evaluation criteria for phase ${phase.id}:`, criteriaError);
                    evaluationCriteria = [];
                  }

                  // Fetch deliverables
                  let deliverables = [];
                  try {
                    deliverables = await getLivrables(phase.id);

                    // If deliverables is not an array, make it one
                    if (!Array.isArray(deliverables)) {
                      deliverables = [];
                    }
                  } catch (deliverableError) {
                    console.error(`Error fetching deliverables for phase ${phase.id}:`, deliverableError);
                    deliverables = [];
                  }

                  // Return phase with all its details
                  return {
                    ...phase,
                    tasks: Array.isArray(tasks) ? tasks : [],
                    meetings: Array.isArray(meetings) ? meetings : [],
                    evaluationCriteria: Array.isArray(evaluationCriteria) ? evaluationCriteria : [],
                    deliverables: Array.isArray(deliverables) ? deliverables : []
                  };
                } catch (error) {
                  console.error(`Error fetching details for phase ${phase.id}:`, error);
                  return {
                    ...phase,
                    tasks: [],
                    meetings: [],
                    evaluationCriteria: [],
                    deliverables: []
                  };
                }
              })
            );

            // Map mentors from backend format to frontend format
            const mappedMentors = (programDetails.mentors || []).map((mentor: any) => ({
              id: mentor.utilisateur_id,
              name: `${mentor.prenom} ${mentor.nom}`,
              expertise: mentor.profession || 'General',
              bio: mentor.bio || `${mentor.prenom} ${mentor.nom} - ${mentor.profession || 'Mentor'}`,
              email: mentor.email || `mentor${mentor.utilisateur_id}@example.com`,
              title: mentor.profession || 'Program Mentor',
              rating: 4.5, // Default rating
              isTopMentor: true // Default value
            }));

            // Parse array fields from PostgreSQL format if needed
            let requiredStages = [];
            let requiredIndustries = [];
            let requiredDocuments = [];

            try {
              // Handle PostgreSQL array format like "{item1,item2}"
              if (typeof programDetails.phases_requises === 'string') {
                requiredStages = programDetails.phases_requises
                  .replace(/^\{|\}$/g, '') // Remove { and }
                  .split(',')
                  .filter(Boolean)
                  .map((item: string) => item.trim().replace(/^"|"$/g, '')); // Remove quotes
              } else if (Array.isArray(programDetails.phases_requises)) {
                requiredStages = programDetails.phases_requises;
              }

              if (typeof programDetails.industries_requises === 'string') {
                requiredIndustries = programDetails.industries_requises
                  .replace(/^\{|\}$/g, '')
                  .split(',')
                  .filter(Boolean)
                  .map((item: string) => item.trim().replace(/^"|"$/g, ''));
              } else if (Array.isArray(programDetails.industries_requises)) {
                requiredIndustries = programDetails.industries_requises;
              }

              if (typeof programDetails.documents_requis === 'string') {
                requiredDocuments = programDetails.documents_requis
                  .replace(/^\{|\}$/g, '')
                  .split(',')
                  .filter(Boolean)
                  .map((item: string) => item.trim().replace(/^"|"$/g, ''));
              } else if (Array.isArray(programDetails.documents_requis)) {
                requiredDocuments = programDetails.documents_requis;
              }
            } catch (error) {
              console.error('Error parsing array fields:', error);
            }

            // Program details loaded from backend

            // Convert backend program to frontend format
            const updatedProgram = {
              id: String(programDetails.id),
              name: programDetails.nom,
              description: programDetails.description,
              startDate: programDetails.date_debut,
              endDate: programDetails.date_fin,
              status: "active" as "active" | "completed" | "draft",
              phases: phasesWithDetails.map((phase: any) => {
                // Ensure all arrays are properly initialized
                const phaseTasks = Array.isArray(phase.tasks) ? phase.tasks : [];
                const phaseMeetings = Array.isArray(phase.meetings) ? phase.meetings : [];
                const phaseCriteria = Array.isArray(phase.evaluationCriteria) ? phase.evaluationCriteria : [];
                const phaseDeliverables = Array.isArray(phase.deliverables) ? phase.deliverables : [];



                // Determine phase status based on dates
                const now = new Date();
                const startDate = new Date(phase.date_debut);
                const endDate = new Date(phase.date_fin);

                let phaseStatus: "not_started" | "in_progress" | "completed" = "not_started";
                if (now > endDate) {
                  phaseStatus = "completed";
                } else if (now >= startDate && now <= endDate) {
                  phaseStatus = "in_progress";
                }

                // Assign a color based on the phase name or index
                let phaseColor = "#818cf8"; // Default blue

                // Try to assign a meaningful color based on phase name
                const phaseName = phase.nom.toLowerCase();
                if (phaseName.includes("idéation") || phaseName.includes("ideation") || phaseName.includes("découverte") || phaseName.includes("decouverte") || phaseName.includes("définition") || phaseName.includes("definition")) {
                  phaseColor = "#8b5cf6"; // Purple for early phases
                } else if (phaseName.includes("prototype") || phaseName.includes("développement") || phaseName.includes("developpement") || phaseName.includes("solution")) {
                  phaseColor = "#3b82f6"; // Blue for middle phases
                } else if (phaseName.includes("test") || phaseName.includes("validation")) {
                  phaseColor = "#10b981"; // Green for testing phases
                } else if (phaseName.includes("lancement") || phaseName.includes("démo") || phaseName.includes("demo") || phaseName.includes("pitch")) {
                  phaseColor = "#f59e0b"; // Amber for final phases
                }

                return {
                  id: String(phase.id),
                  name: phase.nom,
                  description: phase.description,
                  startDate: new Date(phase.date_debut),
                  endDate: new Date(phase.date_fin),
                  status: phaseStatus,
                  color: phaseColor,
                  tasks: phaseTasks.map((task: any) => {
                    return {
                      id: String(task.id),
                      name: task.nom,
                      description: task.description || '',
                      dueDate: task.date_decheance,
                      status: "todo" as "todo" | "in_progress" | "completed",
                      priority: "medium",
                      assignee: "Unassigned",
                      phaseId: String(phase.id),
                      phaseName: phase.nom,
                      tags: [],
                      isOverdue: false,
                      programId: String(programDetails.id),
                      forAllTeams: true
                    };
                  }),
                  meetings: phaseMeetings.map((meeting: any) => {
                    return {
                      id: String(meeting.id),
                      title: meeting.nom_reunion,
                      date: new Date(meeting.date),
                      time: meeting.heure,
                      location: meeting.lieu,
                      type: 'group',
                      description: meeting.description || '',
                      attendees: [],
                      phaseId: String(phase.id),
                      phaseName: phase.nom,
                      programId: String(programDetails.id)
                    };
                  }),
                  evaluationCriteria: phaseCriteria.map((criterion: any) => {
                    return {
                      id: String(criterion.id),
                      name: criterion.nom_critere,
                      type: criterion.type === 'etoiles' ? 'star_rating' :
                            criterion.type === 'numerique' ? 'numeric' :
                            criterion.type === 'oui_non' ? 'yes_no' :
                            criterion.type === 'liste_deroulante' ? 'dropdown' : 'star_rating',
                      weight: criterion.poids || 10,
                      description: criterion.description || '',
                      accessibleBy: [
                        ...(criterion.accessible_mentors ? ['mentors'] : []),
                        ...(criterion.accessible_equipes ? ['teams'] : [])
                      ],
                      filledBy: criterion.rempli_par === 'mentor' ? 'mentors' : 'teams',
                      requiresValidation: criterion.necessite_validation || false,
                      options: criterion.options || []
                    };
                  }),
                  deliverables: phaseDeliverables.map((deliverable: any) => {
                    return {
                      id: String(deliverable.id),
                      name: deliverable.nom,
                      description: deliverable.description || '',
                      dueDate: new Date(deliverable.date_echeance),
                      status: "pending" as "pending" | "submitted" | "reviewed",
                      submissionType: "file",
                      required: true,
                      maxFileSize: 10,
                      allowedFileTypes: deliverable.types_fichiers ?
                        (Array.isArray(deliverable.types_fichiers) ?
                          deliverable.types_fichiers :
                          typeof deliverable.types_fichiers === 'string' ?
                            deliverable.types_fichiers.split(',').map((type: string) => type.trim()) :
                            ['.pdf', '.doc', '.docx']) :
                        ['.pdf', '.doc', '.docx']
                    };
                  })
                };
              }),
              mentors: mappedMentors,
              evaluationCriteria: [],
              eligibilityCriteria: {
                minTeamSize: programDetails.taille_equipe_min || 1,
                maxTeamSize: programDetails.taille_equipe_max || 5,
                requiredStages: requiredStages,
                requiredIndustries: requiredIndustries,
                minRevenue: programDetails.ca_min || 0,
                maxRevenue: programDetails.ca_max || 100000,
                requiredDocuments: requiredDocuments
              },
              dashboardWidgets: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            // Update the programs array with the detailed program
            setPrograms(prevPrograms => {
              const updatedPrograms = prevPrograms.map(prog =>
                prog.id === selectedProgramId ? updatedProgram : prog
              );

              return updatedPrograms;
            });
          }
        } catch (error) {
          console.error('Error loading program details:', error);
        }
      };

      fetchProgramDetails();
    }
  }, [selectedProgramId]);

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
  const createProgram = async (program: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    console.log('Creating program with mentors:', program.mentors);

    // Log if the program has evaluation criteria, meetings, or deliverables
    if (program.phases) {
      console.log(`ℹ️ Evaluation criteria will be created in create.tsx`);
    }

    if (program.phases) {
      console.log(`ℹ️ Meetings will be created in create.tsx`);
    }

    if (program.phases) {
      console.log(`ℹ️ Deliverables will be created in create.tsx`);
    }

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

    // Store the temporary ID for later removal
    const tempProgramId = newProgram.id;

    // Automatically select the newly created program
    console.log('%c Setting selected program ID to:', "background: red; color: white; padding: 5px; font-size: 14px;", newProgram.id, "type:", typeof newProgram.id);
    setSelectedProgramId(newProgram.id);

    // Vérifier immédiatement si le selectedProgramId a été correctement défini
    console.log('%c selectedProgramId après setSelectedProgramId:', "background: orange; color: black; padding: 5px; font-size: 14px;", selectedProgramId, "type:", typeof selectedProgramId);

    // Create the program in the backend
    try {
      // First, create the program in the backend
      const backendProgram = {
        type: 'Accélération', // Default type
        nom: newProgram.name,
        description: newProgram.description,
        date_debut: newProgram.startDate,
        date_fin: newProgram.endDate,
        phases_requises: newProgram.eligibilityCriteria?.requiredStages || [],
        industries_requises: newProgram.eligibilityCriteria?.requiredIndustries || [],
        documents_requis: newProgram.eligibilityCriteria?.requiredDocuments || [],
        taille_equipe_min: newProgram.eligibilityCriteria?.minTeamSize || 1,
        taille_equipe_max: newProgram.eligibilityCriteria?.maxTeamSize || 5,
        ca_min: newProgram.eligibilityCriteria?.minRevenue || 0,
        ca_max: newProgram.eligibilityCriteria?.maxRevenue || 100000,
        admin_id: 1 // Required by the backend
      };

      console.log('Creating program in backend:', backendProgram);

      const programResponse = await fetch(`http://localhost:8083/api/programmes/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(backendProgram),
        credentials: 'include'
      });

      if (!programResponse.ok) {
        console.error('Failed to create program in backend');
        throw new Error('Failed to create program in backend');
      }

      const programResult = await programResponse.json();
      console.log('Program created in backend:', programResult);

      // Get the backend program ID
      const backendProgramId = programResult.id;

      // Now create phases for the program
      if (newProgram.phases && newProgram.phases.length > 0) {
        for (const phase of newProgram.phases) {
          // Create the phase in the backend
          const phaseData = {
            nom: phase.name,
            description: phase.description,
            date_debut: phase.startDate instanceof Date ? phase.startDate.toISOString().split('T')[0] : phase.startDate,
            date_fin: phase.endDate instanceof Date ? phase.endDate.toISOString().split('T')[0] : phase.endDate,
            gagnant: false // Default value
          };

          console.log(`Creating phase ${phase.name} in backend for program ${backendProgramId}:`, phaseData);

          const phaseResponse = await fetch(`http://localhost:8083/api/phase/create/${backendProgramId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(phaseData),
            credentials: 'include'
          });

          if (!phaseResponse.ok) {
            console.error(`Failed to create phase ${phase.name} in backend`);
            continue; // Skip to the next phase
          }

          const phaseResult = await phaseResponse.json();
          console.log(`Phase ${phase.name} created in backend:`, phaseResult);

          // Get the backend phase ID
          const backendPhaseId = phaseResult.id;
          console.log(`Backend phase ID for ${phase.name}:`, backendPhaseId, 'Type:', typeof backendPhaseId);

          // Add high-level debugging to check the phase structure
          console.log('🔍 PHASE STRUCTURE CHECK:');
          console.log('Phase Object:', phase);
          console.log('Phase has evaluation criteria:', Boolean(phase.evaluationCriteria && phase.evaluationCriteria.length > 0));
          console.log('Phase has meetings:', Boolean(phase.meetings && phase.meetings.length > 0));
          console.log('Phase has deliverables:', Boolean(phase.deliverables && phase.deliverables.length > 0));

          // Debug information about what's available in this phase
          console.log(`DEBUG: Phase ${phase.name} (ID: ${backendPhaseId}) contains:`);
          console.log(`- Evaluation Criteria: ${phase.evaluationCriteria?.length || 0} items`);
          console.log(`- Meetings: ${phase.meetings?.length || 0} items`);
          console.log(`- Deliverables: ${phase.deliverables?.length || 0} items`);
          console.log(`- Tasks: ${phase.tasks?.length || 0} items`);

          // Evaluation criteria, meetings, and deliverables will be created in create.tsx
          if (phase.evaluationCriteria && phase.evaluationCriteria.length > 0) {
            console.log('ℹ️ Evaluation criteria will be created in create.tsx');
          }

          if (phase.meetings && phase.meetings.length > 0) {
            console.log('ℹ️ Meetings will be created in create.tsx');
          }

          if (phase.deliverables && phase.deliverables.length > 0) {
            console.log('ℹ️ Deliverables will be created in create.tsx');
          }
        }
      }

      // Add a summary of what was created
      console.log('📊 CREATION SUMMARY:');
      console.log(`Program created with ID: ${backendProgramId}`);
      console.log(`Phases created: ${newProgram.phases?.length || 0}`);
      let criteriaCount = 0, meetingsCount = 0, deliverablesCount = 0;
      newProgram.phases?.forEach(phase => {
        criteriaCount += phase.evaluationCriteria?.length || 0;
        meetingsCount += phase.meetings?.length || 0;
        deliverablesCount += phase.deliverables?.length || 0;
      });
      console.log(`Total criteria to create: ${criteriaCount}`);
      console.log(`Total meetings to create: ${meetingsCount}`);
      console.log(`Total deliverables to create: ${deliverablesCount}`);

      // Update the program ID to use the backend ID
      newProgram.id = String(backendProgramId);
      console.log('Updated program ID to backend ID:', backendProgramId);

      // Criteria are now created directly when the phase is created

      // Update the programs state with the updated program
      // First, create a Map with all existing programs except the one we're updating
      const programsMap = new Map();

      // Add all existing programs to the map except the one with the same ID
      programs.forEach(program => {
        // Skip the program with the same temporary ID or backend ID
        if (program.id !== tempProgramId && program.id !== String(backendProgramId)) {
          programsMap.set(program.id, program);
        }
      });

      // Add the new program to the map
      programsMap.set(newProgram.id, newProgram);

      // Convert map back to array
      const uniquePrograms = Array.from(programsMap.values());
      console.log(`Setting ${uniquePrograms.length} unique programs`);

      // Replace the programs state entirely with the unique programs
      setPrograms(uniquePrograms);

      // Set the selected program ID to the new program ID
      // This will be overridden by the setTimeout below, but we set it here as a fallback
      setSelectedProgramId(newProgram.id);

    } catch (error) {
      console.error('Error creating program in backend:', error);
    }

    // Publish the program data for other contexts to consume
    // This will trigger a custom event that other contexts can listen for
    const programCreatedEvent = new CustomEvent('program-created', {
      detail: {
        programId: newProgram.id,
        phasesCount: newProgram.phases?.length || 0,
        meetingsCount: newProgram.phases?.reduce((count, phase) =>
          count + (phase.meetings?.length || 0), 0) || 0
      }
    });
    document.dispatchEvent(programCreatedEvent);

    // Instead of reloading all programs, just make sure this program is in the state
    // This is more efficient than reloading everything
    setPrograms(prevPrograms => {
      // Create a Map to deduplicate programs by ID
      const programsMap = new Map();

      // Add all existing programs to the map, except any with the same ID as the new program
      prevPrograms.forEach(program => {
        if (program.id !== newProgram.id) {
          programsMap.set(program.id, program);
        }
      });

      // Add the new program
      programsMap.set(newProgram.id, newProgram);

      // Convert map back to array
      const uniquePrograms = Array.from(programsMap.values());
      console.log(`Setting ${uniquePrograms.length} unique programs after adding new program`);

      return uniquePrograms;
    });

    // Set the selected program ID
    setSelectedProgramId(newProgram.id);

    return newProgram.id;
  };

  // Fonction pour mettre à jour un programme existant
  const updateProgram = (updatedProgram: Program) => {
    console.log('Updating program:', updatedProgram);

    // Mettre à jour le programme dans la liste des programmes
    const updatedPrograms = programs.map(program =>
      program.id === updatedProgram.id ? updatedProgram : program
    );

    // Mettre à jour l'état des programmes
    setPrograms(updatedPrograms);

    // Also update the backend if the program has a numeric ID
    const programIdNumber = parseInt(updatedProgram.id);
    if (!isNaN(programIdNumber)) {
      // Convert frontend program to backend format
      const backendProgram = {
        nom: updatedProgram.name,
        description: updatedProgram.description,
        date_debut: updatedProgram.startDate,
        date_fin: updatedProgram.endDate,
        phases_requises: updatedProgram.eligibilityCriteria?.requiredStages || [],
        industries_requises: updatedProgram.eligibilityCriteria?.requiredIndustries || [],
        documents_requis: updatedProgram.eligibilityCriteria?.requiredDocuments || [],
        taille_equipe_min: updatedProgram.eligibilityCriteria?.minTeamSize || 1,
        taille_equipe_max: updatedProgram.eligibilityCriteria?.maxTeamSize || 5,
        ca_min: updatedProgram.eligibilityCriteria?.minRevenue || 0,
        ca_max: updatedProgram.eligibilityCriteria?.maxRevenue || 100000
      };

      // Send update to backend
      fetch(`http://localhost:8083/api/programmes/${programIdNumber}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(backendProgram),
        credentials: 'include'
      })
      .then(response => {
        if (response.ok) {
          console.log('Program updated successfully in backend');
          return response.json();
        } else {
          console.error('Failed to update program in backend');
          throw new Error('Failed to update program');
        }
      })
      .then(data => {
        console.log('Backend update response:', data);
      })
      .catch(error => {
        console.error('Error updating program in backend:', error);
      });
    }

    // Si le programme mis à jour est le programme sélectionné, mettre à jour l'ID sélectionné
    if (selectedProgramId === updatedProgram.id) {
      // Forcer une mise à jour du programme sélectionné
      setSelectedProgramId(null);
      setTimeout(() => {
        setSelectedProgramId(updatedProgram.id);
      }, 10);
    }
  };

  // Function to delete a program
  const deleteProgram = async (programId: string): Promise<boolean> => {
    try {
      console.log(`Deleting program ${programId}`);

      // Call the API to delete the program
      // Use the imported function from programService.ts
      await programService.deleteProgram(programId);

      // Remove the program from the local state
      setPrograms(prevPrograms => prevPrograms.filter(p => p.id !== programId));

      // If the deleted program was selected, clear the selection
      if (selectedProgramId === programId) {
        setSelectedProgramId(null);
      }

      return true;
    } catch (error) {
      console.error("Error deleting program:", error);
      return false;
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
        updateProgram,
        deleteProgram,
        isLoading
      }}
    >
      {children}
    </ProgramContext.Provider>
  );
};

export default ProgramContext;
