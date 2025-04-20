import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useProgramContext } from './ProgramContext';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
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
  const { selectedProgramId, selectedProgram } = useProgramContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<TaskStatus[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [phases, setPhases] = useState<Phase[]>([]);

  // Get today's date for comparison
  const today = new Date().toISOString().split('T')[0];

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
      assignee: "Program Manager",
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
      assignee: "Program Manager",
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
      assignee: "Program Director",
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
      assignee: "Program Manager",
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
      assignee: "Technical Advisor",
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
      assignee: "Program Manager",
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
      assignee: "Product Lead",
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
      assignee: "Program Director",
      phaseId: "phase-5",
      phaseName: "Demo Day",
      tags: ["presentation", "demo"],
      isOverdue: false,
      programId: "1",
      forAllTeams: true
    }
  ];

  // Initialize tasks with initial data
  useEffect(() => {
    setTasks(initialTasks);
  }, []);

  // Filter tasks based on selected filters, search query, and program
  const filteredTasks = tasks.filter(task => {
    if (!task) return false;
    
    // Safe check for title and description
    const title = task.title || task.name || '';
    const description = task.description || '';
    
    const matchesSearch = searchQuery === '' || 
                        title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatuses.length === 0 || (task.status && selectedStatuses.includes(task.status));
    const matchesPriority = selectedPriorities.length === 0 || (task.priority && selectedPriorities.includes(task.priority));
    const matchesPhase = !selectedPhase || task.phaseId === selectedPhase;
    const matchesProgram = !selectedProgramId || task.programId === selectedProgramId;
    return matchesSearch && matchesStatus && matchesPriority && matchesPhase && matchesProgram;
  });

  // Group tasks by status
  const tasksByStatus = {
    todo: filteredTasks.filter(task => task.status === 'todo'),
    in_progress: filteredTasks.filter(task => task.status === 'in_progress'),
    completed: filteredTasks.filter(task => task.status === 'completed')
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
    const newTaskId = uuidv4();
    const newTask: Task = {
      ...task,
      id: newTaskId
    };
    
    setTasks(prevTasks => [...prevTasks, newTask]);
    return newTaskId;
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