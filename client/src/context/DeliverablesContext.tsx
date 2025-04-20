import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useProgramContext } from './ProgramContext';
import { FileText, Video, ExternalLink } from 'lucide-react';
import { format, isBefore, isToday } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

// Interfaces
export interface Phase {
  id: string;
  name: string;
  color: string;
  startDate: string;
  endDate: string;
  status: 'not_started' | 'in_progress' | 'completed';
}

export interface Deliverable {
  id: string;
  name: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'reviewed';
  phaseId: string;
  phaseName: string;
  submissionType: 'file' | 'link' | 'text';
  required: boolean;
  programId: string;
  assignedBy: string;
  assignmentDate: string;
  teamsAssigned: string[];
}

// Context interface
interface DeliverablesContextType {
  deliverables: Deliverable[];
  phases: Phase[];
  filteredDeliverables: Deliverable[];
  upcomingDeliverables: Deliverable[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedPhase: string | null;
  setSelectedPhase: (phaseId: string | null) => void;
  selectedType: string | null;
  setSelectedType: (type: string | null) => void;
  getStatusBadgeClass: (status: Deliverable['status'], dueDate: string) => string;
  getStatusText: (status: Deliverable['status'], dueDate: string) => string;
  getSubmissionTypeIcon: (type: Deliverable['submissionType']) => React.ReactNode;
  getPhaseById: (phaseId: string) => Phase | undefined;
  getPhaseColor: (phaseId: string) => string;
  today: string;
  createDeliverable: (deliverable: Omit<Deliverable, 'id'>) => string;
  addDeliverables: (deliverables: Omit<Deliverable, 'id'>[]) => string[];
}

// Create context
const DeliverablesContext = createContext<DeliverablesContextType | undefined>(undefined);

// Provider component
export const DeliverablesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { selectedProgramId, selectedProgram } = useProgramContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);

  // Get today's date for UI comparison
  const today = new Date().toISOString().split('T')[0];

  // Update phases when selected program changes
  useEffect(() => {
    if (selectedProgram && selectedProgram.phases && selectedProgram.phases.length > 0) {
      // Map program phases to the format needed by the context
      const mappedPhases = selectedProgram.phases.map(phase => {
        // Format dates if needed
        const formatDate = (date: Date | string) => {
          if (date instanceof Date) {
            return date.toISOString().split('T')[0];
          }
          return date;
        };

        // Map status
        let mappedStatus: 'not_started' | 'in_progress' | 'completed' = 'not_started';
        if (phase.status === 'completed') {
          mappedStatus = 'completed';
        } else if (phase.status === 'in_progress') {
          mappedStatus = 'in_progress';
        }

        return {
          id: phase.id.toString(),
          name: phase.name,
          color: phase.color || "#3b82f6", // Default to blue
          startDate: formatDate(phase.startDate),
          endDate: formatDate(phase.endDate),
          status: mappedStatus
        };
      });

      setPhases(mappedPhases);
    } else {
      // Use default phases if no program is selected
      setPhases([
        {
          id: "phase-1",
          name: "Application",
          color: "#3b82f6", // blue
          startDate: "2023-01-15",
          endDate: "2023-02-15",
          status: "completed"
        },
        {
          id: "phase-2",
          name: "Selection",
          color: "#10b981", // green
          startDate: "2023-02-16",
          endDate: "2023-03-15",
          status: "completed"
        },
        {
          id: "phase-3",
          name: "Onboarding",
          color: "#8b5cf6", // purple
          startDate: "2023-03-16",
          endDate: "2023-04-15",
          status: "in_progress"
        },
        {
          id: "phase-4",
          name: "Development",
          color: "#f59e0b", // amber
          startDate: "2023-04-16",
          endDate: "2023-05-15",
          status: "not_started"
        },
        {
          id: "phase-5",
          name: "Demo Day",
          color: "#ef4444", // red
          startDate: "2023-05-16",
          endDate: "2023-06-15",
          status: "not_started"
        }
      ]);
    }
  }, [selectedProgram]);

  // Add event listener for new program creation
  useEffect(() => {
    const handleProgramCreated = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { programId, program } = customEvent.detail;

      // Update phases from the new program
      if (program && program.phases && Array.isArray(program.phases)) {
        const mappedPhases = program.phases.map((phase: any) => {
          // Format dates
          const formatDate = (date: Date | string) => {
            if (date instanceof Date) {
              return date.toISOString().split('T')[0];
            }
            return date;
          };

          // Map status
          let mappedStatus: 'not_started' | 'in_progress' | 'completed' = 'not_started';
          if (phase.status === 'completed') {
            mappedStatus = 'completed';
          } else if (phase.status === 'in_progress') {
            mappedStatus = 'in_progress';
          }

          return {
            id: phase.id.toString(),
            name: phase.name,
            color: phase.color || "#3b82f6", // Default to blue
            startDate: formatDate(phase.startDate),
            endDate: formatDate(phase.endDate),
            status: mappedStatus
          };
        });

        setPhases(mappedPhases);
      }

      // Update deliverables from the new program if any
      if (program && program.phases && Array.isArray(program.phases)) {
        // Extract deliverables from each phase
        const allDeliverables: any[] = [];

        program.phases.forEach((phase: any) => {
          if (phase.deliverables && Array.isArray(phase.deliverables)) {
            const phaseDeliverables = phase.deliverables.map((deliverable: any) => ({
              ...deliverable,
              id: deliverable.id || uuidv4(),
              programId: String(programId),
              phaseId: phase.id,
              phaseName: phase.name
            }));

            allDeliverables.push(...phaseDeliverables);
          }
        });

        if (allDeliverables.length > 0) {
          console.log(`Adding ${allDeliverables.length} deliverables from program ${programId}`);
          setDeliverables(prevDeliverables => [...prevDeliverables, ...allDeliverables]);
        }
      }
    };

    document.addEventListener('program-created', handleProgramCreated);

    return () => {
      document.removeEventListener('program-created', handleProgramCreated);
    };
  }, []);

  // Mock deliverables data
  const initialDeliverables: Deliverable[] = [
    {
      id: "1",
      name: "Team Introduction",
      description: "Submit a brief introduction of your team, including member backgrounds and roles.",
      dueDate: "2023-01-30",
      status: "reviewed",
      phaseId: "phase-1",
      phaseName: "Application",
      submissionType: "file",
      required: true,
      programId: "1",
      assignedBy: "Program Manager",
      assignmentDate: "2023-01-15",
      teamsAssigned: ["All Teams"]
    },
    {
      id: "2",
      name: "Market Research Report",
      description: "Provide a comprehensive market research report identifying target customers and competitors.",
      dueDate: "2023-02-15",
      status: "reviewed",
      phaseId: "phase-1",
      phaseName: "Application",
      submissionType: "file",
      required: true,
      programId: "1",
      assignedBy: "Program Manager",
      assignmentDate: "2023-01-20",
      teamsAssigned: ["All Teams"]
    },
    {
      id: "3",
      name: "Business Model Canvas",
      description: "Complete a business model canvas outlining your business approach.",
      dueDate: "2023-03-20",
      status: "submitted",
      phaseId: "phase-2",
      phaseName: "Selection",
      submissionType: "file",
      required: true,
      programId: "1",
      assignedBy: "Program Director",
      assignmentDate: "2023-02-25",
      teamsAssigned: ["All Teams"]
    },
    {
      id: "4",
      name: "Prototype Demo Video",
      description: "Provide a video demonstration of your prototype.",
      dueDate: "2023-03-25",
      status: "submitted",
      phaseId: "phase-2",
      phaseName: "Selection",
      submissionType: "link",
      required: true,
      programId: "2",
      assignedBy: "Technical Advisor",
      assignmentDate: "2023-03-01",
      teamsAssigned: ["All Teams"]
    },
    {
      id: "5",
      name: "Financial Projections",
      description: "Provide 3-year financial projections including revenue and expense forecasts.",
      dueDate: "2023-04-10",
      status: "pending",
      phaseId: "phase-3",
      phaseName: "Onboarding",
      submissionType: "file",
      required: true,
      programId: "1",
      assignedBy: "Finance Mentor",
      assignmentDate: "2023-03-20",
      teamsAssigned: ["All Teams"]
    },
    {
      id: "6",
      name: "Product Development Roadmap",
      description: "Submit a detailed product development roadmap with milestones.",
      dueDate: "2023-04-15",
      status: "pending",
      phaseId: "phase-3",
      phaseName: "Onboarding",
      submissionType: "file",
      required: false,
      programId: "2",
      assignedBy: "Technical Advisor",
      assignmentDate: "2023-03-25",
      teamsAssigned: ["Tech Teams"]
    },
    {
      id: "7",
      name: "Investor Pitch Deck",
      description: "Create a compelling pitch deck for potential investors.",
      dueDate: "2023-05-01",
      status: "pending",
      phaseId: "phase-4",
      phaseName: "Development",
      submissionType: "file",
      required: true,
      programId: "1",
      assignedBy: "Program Director",
      assignmentDate: "2023-04-01",
      teamsAssigned: ["All Teams"]
    },
    {
      id: "8",
      name: "Go-to-Market Strategy",
      description: "Outline your go-to-market strategy including marketing channels and launch plan.",
      dueDate: "2023-05-15",
      status: "pending",
      phaseId: "phase-4",
      phaseName: "Development",
      submissionType: "file",
      required: true,
      programId: "2",
      assignedBy: "Marketing Advisor",
      assignmentDate: "2023-04-15",
      teamsAssigned: ["All Teams"]
    }
  ];

  // Initialize deliverables with initial data
  useEffect(() => {
    setDeliverables(initialDeliverables);
  }, []);

  // Filter deliverables based on selected filters, search query, and program
  const filteredDeliverables = deliverables.filter(deliverable => {
    const matchesSearch = deliverable.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        deliverable.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPhase = !selectedPhase || deliverable.phaseId === selectedPhase;
    const matchesType = !selectedType || deliverable.submissionType === selectedType;

    // Improved program matching with multiple comparison strategies
    let matchesProgram = false;
    if (!selectedProgramId) {
      matchesProgram = true; // If no program selected, show all
    } else {
      // Try different comparison methods
      const deliverableProgramId = deliverable.programId;
      const targetProgramId = selectedProgramId;

      // Exact match
      if (deliverableProgramId === targetProgramId) {
        matchesProgram = true;
      }
      // String comparison
      else if (String(deliverableProgramId) === String(targetProgramId)) {
        matchesProgram = true;
      }
      // Numeric comparison
      else if (Number(deliverableProgramId) === Number(targetProgramId)) {
        matchesProgram = true;
      }
    }

    return matchesSearch && matchesPhase && matchesType && matchesProgram;
  });

  // Get upcoming deliverables (not completed and due date hasn't passed)
  const upcomingDeliverables = filteredDeliverables.filter(deliverable => {
    const dueDateObj = new Date(deliverable.dueDate);
    const todayObj = new Date(today);
    return (deliverable.status === 'pending' && (dueDateObj >= todayObj || isToday(dueDateObj)));
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // Function to get a phase by ID
  const getPhaseById = (phaseId: string): Phase | undefined => {
    return phases.find(phase => phase.id === phaseId);
  };

  // Function to get phase color
  const getPhaseColor = (phaseId: string): string => {
    const phase = phases.find(p => p.id === phaseId);
    return phase ? phase.color : "#64748b"; // Default slate color if not found
  };

  // Get status badge class
  const getStatusBadgeClass = (status: Deliverable['status'], dueDate: string): string => {
    const dueDateObj = new Date(dueDate);
    const todayObj = new Date(today);

    if (status === 'reviewed') return 'bg-green-100 text-green-800';
    if (status === 'submitted') return 'bg-blue-100 text-blue-800';

    // Status is pending
    if (isBefore(dueDateObj, todayObj) && !isToday(dueDateObj)) {
      return 'bg-red-100 text-red-800'; // Overdue
    }
    return 'bg-amber-100 text-amber-800'; // Pending and not overdue
  };

  // Get status text
  const getStatusText = (status: Deliverable['status'], dueDate: string): string => {
    const dueDateObj = new Date(dueDate);
    const todayObj = new Date(today);

    if (status === 'reviewed') return 'Reviewed';
    if (status === 'submitted') return 'Submitted';

    // Status is pending
    if (isBefore(dueDateObj, todayObj) && !isToday(dueDateObj)) {
      return 'Overdue';
    }
    return 'Pending';
  };

  // Get submission type icon
  const getSubmissionTypeIcon = (type: Deliverable['submissionType']): React.ReactNode => {
    switch (type) {
      case 'file':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'link':
        return <ExternalLink className="h-4 w-4 text-purple-500" />;
      case 'text':
        return <FileText className="h-4 w-4 text-gray-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Function to create a new deliverable
  const createDeliverable = (deliverable: Omit<Deliverable, 'id'>): string => {
    const newDeliverableId = uuidv4();
    const newDeliverable: Deliverable = {
      ...deliverable,
      id: newDeliverableId
    };

    setDeliverables(prevDeliverables => [...prevDeliverables, newDeliverable]);
    return newDeliverableId;
  };

  // Function to add multiple deliverables at once
  const addDeliverables = (deliverablesData: Omit<Deliverable, 'id'>[]): string[] => {
    const newDeliverableIds: string[] = [];

    const newDeliverables = deliverablesData.map(deliverable => {
      const newDeliverableId = uuidv4();
      newDeliverableIds.push(newDeliverableId);

      return {
        ...deliverable,
        id: newDeliverableId
      };
    });

    setDeliverables(prevDeliverables => [...prevDeliverables, ...newDeliverables]);
    return newDeliverableIds;
  };

  // Value object for the context provider
  const value = {
    deliverables,
    phases,
    filteredDeliverables,
    upcomingDeliverables,
    searchQuery,
    setSearchQuery,
    selectedPhase,
    setSelectedPhase,
    selectedType,
    setSelectedType,
    getStatusBadgeClass,
    getStatusText,
    getSubmissionTypeIcon,
    getPhaseById,
    getPhaseColor,
    today,
    createDeliverable,
    addDeliverables
  };

  return (
    <DeliverablesContext.Provider value={value}>
      {children}
    </DeliverablesContext.Provider>
  );
};

// Custom hook to use the deliverables context
export const useDeliverables = (): DeliverablesContextType => {
  const context = useContext(DeliverablesContext);
  if (context === undefined) {
    throw new Error('useDeliverables must be used within a DeliverablesProvider');
  }
  return context;
};