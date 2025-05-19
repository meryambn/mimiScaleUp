import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useProgramContext } from './ProgramContext';
import { CheckCircle2, Clock } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// Interfaces
export interface Phase {
  id: string | number;
  name: string;
  color: string;
  startDate: string;
  endDate: string;
  status: 'not_started' | 'in_progress' | 'completed';
}

export interface Task {
  id: string;
  title: string;
  name?: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  assignee: string;
  phaseId: string;
  phaseName: string;
  tags: string[];
  isOverdue: boolean;
  programId: string;
  forAllTeams: boolean;
}

export type TaskStatus = 'todo' | 'in_progress' | 'completed';

// Context interface
interface TasksContextType {
  tasks: Task[];
  phases: Phase[];
  filteredTasks: Task[];
  tasksByStatus: {
    todo: Task[];
    in_progress: Task[];
    completed: Task[];
  };
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedStatuses: TaskStatus[];
  setSelectedStatuses: (statuses: TaskStatus[]) => void;
  selectedPriorities: string[];
  setSelectedPriorities: (priorities: string[]) => void;
  selectedPhase: string | null;
  setSelectedPhase: (phaseId: string | null) => void;
  getPhaseById: (phaseId: string) => Phase | undefined;
  updateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  priorityColors: Record<string, string>;
  statusIcons: Record<TaskStatus, React.ReactNode>;
  today: string;
  createTask: (task: Omit<Task, 'id'>) => string;
  addTasks: (tasks: Omit<Task, 'id'>[]) => string[];
}

// Create context
const TasksContext = createContext<TasksContextType | undefined>(undefined);

// Provider component
export const TasksProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { selectedProgramId, selectedProgram, selectedPhaseId, setSelectedPhaseId } = useProgramContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<TaskStatus[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);

  // Get today's date for comparison
  const today = new Date().toISOString().split('T')[0];

  // Load tasks for the selected program
  const loadProgramTasks = async (programId: string) => {
    try {
      // Convert programId to number if needed
      const programIdNumber = parseInt(programId);
      if (isNaN(programIdNumber)) {
        console.error('Invalid program ID:', programId);
        return;
      }

      // Fetch tasks from the backend
      const response = await fetch(`http://localhost:8083/api/taches/programme/${programIdNumber}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Map backend tasks to frontend format
      const mappedTasks: Task[] = data.map((task: any) => ({
        id: String(task.id),
        title: task.nom || task.title || 'Tâche sans titre',
        description: task.description || '',
        dueDate: task.date_echeance || new Date().toISOString().split('T')[0],
        status: task.status === 'completed' ? 'completed' : 
                task.status === 'in_progress' ? 'in_progress' : 'todo',
        priority: task.priorite || 'medium',
        assignee: task.assignee || 'Non assigné',
        phaseId: String(task.phase_id),
        phaseName: task.phase_name || 'Phase inconnue',
        tags: task.tags || [],
        isOverdue: task.is_overdue || false,
        programId: String(programId),
        forAllTeams: task.for_all_teams || false
      }));

      setTasks(mappedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      // For now, use mock data
      const mockTasks: Task[] = [
        {
          id: '1',
          title: 'Tâche 1',
          description: 'Description de la tâche 1',
          dueDate: '2024-03-20',
          status: 'todo',
          priority: 'high',
          assignee: 'John Doe',
          phaseId: 'phase-1',
          phaseName: 'Application',
          tags: ['important'],
          isOverdue: false,
          programId: programId,
          forAllTeams: true
        },
        {
          id: '2',
          title: 'Tâche 2',
          description: 'Description de la tâche 2',
          dueDate: '2024-03-25',
          status: 'in_progress',
          priority: 'medium',
          assignee: 'Jane Smith',
          phaseId: 'phase-2',
          phaseName: 'Selection',
          tags: ['urgent'],
          isOverdue: false,
          programId: programId,
          forAllTeams: false
        }
      ];
      setTasks(mockTasks);
    }
  };

  // Load tasks when selected program changes
  useEffect(() => {
    if (selectedProgramId) {
      loadProgramTasks(selectedProgramId);
    } else {
      setTasks([]);
    }
  }, [selectedProgramId]);

  // Sync selectedPhase with selectedPhaseId from ProgramContext
  useEffect(() => {
    if (selectedPhaseId) {
      setSelectedPhase(String(selectedPhaseId));
    }
  }, [selectedPhaseId]);

  // Sync selectedPhaseId with selectedPhase from TasksContext
  useEffect(() => {
    if (selectedPhase) {
      setSelectedPhaseId(selectedPhase);
    } else if (selectedPhaseId) {
      // If selectedPhase is cleared but selectedPhaseId exists, clear it too
      setSelectedPhaseId(null);
    }
  }, [selectedPhase, setSelectedPhaseId]);

  // Update phases when selected program changes
  useEffect(() => {
    if (selectedProgram && selectedProgram.phases && selectedProgram.phases.length > 0) {
      // Map program phases to the format needed by the context
      const mappedPhases = selectedProgram.phases.map((phase: any) => {
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

        // Ensure color is defined
        const phaseColor = phase.color || "#3b82f6"; // Default to blue if not provided

        return {
          id: phase.id.toString(),
          name: phase.name,
          color: phaseColor,
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
          status: "not_started"
        },
        {
          id: "phase-3",
          name: "Incubation",
          color: "#f43f5e", // rose
          startDate: "2023-03-16",
          endDate: "2023-04-15",
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
            color: phase.color,
            startDate: formatDate(phase.startDate),
            endDate: formatDate(phase.endDate),
            status: mappedStatus
          };
        });

        setPhases(mappedPhases);
      }

      // Update tasks from the new program
      if (program && program.tasks && Array.isArray(program.tasks)) {
        // Add all tasks from the new program
        const programTasks = program.tasks.map((task: any) => ({
          ...task,
          id: task.id || uuidv4(),
          programId: programId,
          // Ensure both title and name are set properly
          title: task.title || task.name || 'Untitled Task',
          name: task.name || task.title || 'Untitled Task',
          description: task.description || '',
          status: task.status || 'todo',
          priority: task.priority || 'medium',
          tags: task.tags || [],
          assignee: task.assignee || 'Unassigned',
          isOverdue: new Date(task.dueDate) < new Date(today)
        }));

        setTasks(prevTasks => [...prevTasks, ...programTasks]);
      }
    };

    document.addEventListener('program-created', handleProgramCreated);

    return () => {
      document.removeEventListener('program-created', handleProgramCreated);
    };
  }, [today]);

  // Mock tasks data
  const initialTasks: Task[] = [
    {
      id: "1",
      title: "Complete team profile",
      description: "Fill out all required information in your team profile.",
      dueDate: "2023-01-25",
      status: "completed",
      priority: "high",
      assignee: "Assigné",
      phaseId: "phase-1",
      phaseName: "Application",
      tags: ["profile", "onboarding"],
      isOverdue: false,
      programId: "1",
      forAllTeams: true
    },
    {
      id: "2",
      title: "Submit market research",
      description: "Upload your market research report with competitor analysis.",
      dueDate: "2023-02-10",
      status: "completed",
      priority: "high",
      assignee: "Assigné",
      phaseId: "phase-1",
      phaseName: "Application",
      tags: ["research", "market"],
      isOverdue: false,
      programId: "1",
      forAllTeams: true
    },
    {
      id: "3",
      title: "Prepare pitch deck",
      description: "Create a 10-slide pitch deck for the selection committee.",
      dueDate: "2023-02-20",
      status: "completed",
      priority: "high",
      assignee: "Assigné",
      phaseId: "phase-2",
      phaseName: "Selection",
      tags: ["pitch", "presentation"],
      isOverdue: false,
      programId: "1",
      forAllTeams: true
    },
    {
      id: "4",
      title: "Attend mentor matching event",
      description: "Join the mentor matching session to meet potential mentors.",
      dueDate: "2023-03-20",
      status: "completed",
      priority: "medium",
      assignee: "Assigné",
      phaseId: "phase-3",
      phaseName: "Onboarding",
      tags: ["mentors", "networking"],
      isOverdue: false,
      programId: "1",
      forAllTeams: true
    },
    {
      id: "5",
      title: "Create product development roadmap",
      description: "Define milestones and timelines for your product development.",
      dueDate: "2023-04-01",
      status: "in_progress",
      priority: "medium",
      assignee: "Assigné",
      phaseId: "phase-3",
      phaseName: "Onboarding",
      tags: ["product", "planning"],
      isOverdue: true,
      programId: "1",
      forAllTeams: true
    },
    {
      id: "6",
      title: "Weekly progress report",
      description: "Submit your team's weekly progress update.",
      dueDate: "2023-04-07",
      status: "todo",
      priority: "medium",
      assignee: "Assigné",
      phaseId: "phase-3",
      phaseName: "Onboarding",
      tags: ["reporting", "progress"],
      isOverdue: false,
      programId: "1",
      forAllTeams: true
    },
    {
      id: "7",
      title: "Finalize MVP features",
      description: "Finalize the feature list for your minimum viable product.",
      dueDate: "2023-04-15",
      status: "todo",
      priority: "high",
      assignee: "Assigné",
      phaseId: "phase-3",
      phaseName: "Onboarding",
      tags: ["product", "mvp"],
      isOverdue: false,
      programId: "1",
      forAllTeams: true
    },
    {
      id: "8",
      title: "Prepare for demo day",
      description: "Create and rehearse your final demo day presentation.",
      dueDate: "2023-05-25",
      status: "todo",
      priority: "high",
      assignee: "Assigné",
      phaseId: "phase-5",
      phaseName: "Demo Day",
      tags: ["presentation", "demo"],
      isOverdue: false,
      programId: "1",
      forAllTeams: true
    }
  ];

  // Initialize tasks with program data or fallback to initial data
  useEffect(() => {
    if (selectedProgram && selectedProgram.phases) {
      console.log('Loading tasks from program phases...', selectedProgram);

      // Extract tasks from all phases
      const programTasks: Task[] = [];

      // Also extract phases for the phase filter
      const programPhases: Phase[] = [];

      selectedProgram.phases.forEach((phase: any) => {
        // Add phase to phases list for filtering
        programPhases.push({
          id: String(phase.id),
          name: phase.name,
          color: phase.color || '#818cf8'
        });

        if (phase.tasks && Array.isArray(phase.tasks)) {
          const phaseTasks = phase.tasks.map((task: any) => {
            // Map backend task to frontend Task format
            // Normalize status to English values for consistency
            let normalizedStatus = task.status || 'todo';

            // Map various status values to our three standard statuses
            if (normalizedStatus === 'à faire' ||
                normalizedStatus?.toLowerCase() === 'a faire' ||
                normalizedStatus === 'not_started' ||
                normalizedStatus === 'pending') {
              normalizedStatus = 'todo';
            } else if (normalizedStatus === 'en cours' ||
                       normalizedStatus?.toLowerCase() === 'en_cours' ||
                       normalizedStatus === 'in_progress' ||
                       normalizedStatus === 'started') {
              normalizedStatus = 'in_progress';
            } else if (normalizedStatus === 'terminé' ||
                       normalizedStatus?.toLowerCase() === 'termine' ||
                       normalizedStatus === 'completed' ||
                       normalizedStatus === 'done') {
              normalizedStatus = 'completed';
            }

            return {
              id: String(task.id),
              title: task.name || task.title || 'Untitled Task',
              name: task.name || task.title || 'Untitled Task',
              description: task.description || '',
              dueDate: task.dueDate || task.date_decheance || new Date().toISOString().split('T')[0],
              status: normalizedStatus,
              priority: task.priority || 'medium',
              assignee: task.assignee || 'Unassigned',
              phaseId: String(phase.id),
              phaseName: phase.name,
              tags: task.tags || [],
              isOverdue: new Date(task.dueDate || task.date_decheance) < new Date(today),
              programId: String(selectedProgram.id),
              forAllTeams: true
            };
          });

          programTasks.push(...phaseTasks);
        }
      });

      // Update phases for filtering
      setPhases(programPhases);

      if (programTasks.length > 0) {
        // Use ONLY program tasks when available
        setTasks(programTasks);
        return; // Exit early to avoid setting mock tasks
      }
    }

    // Only use mock tasks if no program is selected or no program tasks are available
    setTasks(initialTasks);
  }, [selectedProgram, today]);

  // Filter tasks based on selected filters, search query, and program
  const filteredTasks = tasks.filter(task => {
    if (!task) return false;

    // Safe check for title and description
    const title = task.title || task.name || '';
    const description = task.description || '';

    const matchesSearch = searchQuery === '' ||
                        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        description.toLowerCase().includes(searchQuery.toLowerCase());
    // Handle both English and French status values for filtering
    const matchesStatus = selectedStatuses.length === 0 || (task.status && (
      selectedStatuses.includes(task.status) ||
      (task.status === 'todo' && selectedStatuses.includes('à faire')) ||
      (task.status === 'in_progress' && selectedStatuses.includes('en cours')) ||
      (task.status === 'completed' && selectedStatuses.includes('terminé'))
    ));
    const matchesPriority = selectedPriorities.length === 0 || (task.priority && selectedPriorities.includes(task.priority));
    const matchesPhase = !selectedPhase || task.phaseId === selectedPhase;

    // Only show tasks for the selected program
    const matchesProgram = !selectedProgramId || task.programId === selectedProgramId;

    return matchesSearch && matchesStatus && matchesPriority && matchesPhase && matchesProgram;
  });

  // Group tasks by status - handle both English and French status values
  const tasksByStatus = {
    todo: filteredTasks.filter(task =>
      task.status === 'todo' ||
      task.status === 'à faire' ||
      task.status?.toLowerCase() === 'a faire' ||
      task.status === 'not_started' ||
      task.status === 'pending'),
    in_progress: filteredTasks.filter(task =>
      task.status === 'in_progress' ||
      task.status === 'en cours' ||
      task.status?.toLowerCase() === 'en_cours' ||
      task.status === 'started'),
    completed: filteredTasks.filter(task =>
      task.status === 'completed' ||
      task.status === 'terminé' ||
      task.status?.toLowerCase() === 'termine' ||
      task.status === 'done')
  };

  // Function to get a phase by ID
  const getPhaseById = (phaseId: string): Phase | undefined => {
    return phases.find(phase => phase.id === phaseId);
  };

  // Function to update a task's status
  const updateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, status: newStatus } : task
    ));
  };

  // Function to create a new task
  const createTask = (task: Omit<Task, 'id'>): string => {
    if (!selectedProgramId) {
      throw new Error('No program selected');
    }

    const newTask: Task = {
      ...task,
      id: uuidv4(),
      programId: selectedProgramId
    };

    setTasks(prevTasks => [...prevTasks, newTask]);
    return newTask.id;
  };

  // Function to add multiple tasks at once
  const addTasks = (tasksToAdd: Omit<Task, 'id'>[]): string[] => {
    const newTaskIds: string[] = [];

    const newTasks = tasksToAdd.map(task => {
      const newTaskId = uuidv4();
      newTaskIds.push(newTaskId);

      return {
        ...task,
        id: newTaskId
      };
    });

    setTasks(prevTasks => [...prevTasks, ...newTasks]);
    return newTaskIds;
  };

  const priorityColors = {
    low: "bg-gray-100 text-gray-800",
    medium: "bg-blue-100 text-blue-800",
    high: "bg-red-100 text-red-800"
  };

  const statusIcons = {
    todo: <Clock className="h-4 w-4 text-gray-500" />,
    in_progress: <Clock className="h-4 w-4 text-blue-500" />,
    completed: <CheckCircle2 className="h-4 w-4 text-green-500" />
  };

  // Value object for the context provider
  const value = {
    tasks,
    phases,
    filteredTasks,
    tasksByStatus,
    searchQuery,
    setSearchQuery,
    selectedStatuses,
    setSelectedStatuses,
    selectedPriorities,
    setSelectedPriorities,
    selectedPhase,
    setSelectedPhase,
    getPhaseById,
    updateTaskStatus,
    priorityColors,
    statusIcons,
    today,
    createTask,
    addTasks
  };

  return (
    <TasksContext.Provider value={value}>
      {children}
    </TasksContext.Provider>
  );
};

// Custom hook to use the tasks context
export const useTasks = (): TasksContextType => {
  const context = useContext(TasksContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
};