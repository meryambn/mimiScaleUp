import React, { useState, useEffect } from 'react';
import {
  FaCheckCircle,
  FaRegCircle,
  FaTrash,
  FaEllipsisV,
  FaExclamationTriangle,
  FaSearch,
  FaFilter
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import Sidebar from '@/components/sidebar';
import TaskKanbanBoard from '@/components/tasks/TaskKanbanBoard';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useProgramContext } from '@/context/ProgramContext';
import { useAuth } from '@/context/AuthContext';
import { getAllPrograms, getProgram, getPhases, getTasks, updateProgramStatus } from '@/services/programService';
import { getSubmissionsByProgram } from '@/services/formService';
import { checkSubmissionAccepted } from '@/services/teamService';
import { FrontendStatus } from '@/utils/statusMapping';
import ProgramAccessGuard from '@/components/guards/ProgramAccessGuard';

// Define types
interface Task {
  id: number | string;
  title: string;
  completed: boolean;
  priority: string;
  dueDate: string;
  status?: 'todo' | 'in_progress' | 'completed';
  isOverdue?: boolean;
}

interface Phase {
  id: string | number;
  name: string;
  description: string;
  status: string;
  color: string;
  tasks: Task[];
  recommendedTasks?: string[];
  startDate: string;
  endDate: string;
  date_debut?: string;
  date_fin?: string;
  nom?: string;
}

interface ProgramPhase {
  id: number;
  name: string;
  description: string;
  color: string;
  status: string;
  recommendedTasks?: string[];
}

const StartupTasksPage = () => {
  const { selectedProgram, selectedPhaseId, setSelectedPhaseId, setSelectedProgram } = useProgramContext();
  const { user } = useAuth();
  const [activePhase, setActivePhase] = useState<number>(Number(selectedPhaseId) || 1);
  const [activeView, setActiveView] = useState<"list" | "kanban">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [tasks, setTasks] = useState<Record<number, Task[]>>({});
  const [phases, setPhases] = useState<Phase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch submission program info and details
  useEffect(() => {
    const fetchSubmissionProgramInfo = async () => {
      if (!user?.id) {
        console.log('Pas d\'utilisateur connecté');
        setError('Vous devez être connecté pour accéder aux tâches');
        setIsLoading(false);
        return;
      }

      if (user.role !== 'startup') {
        console.log('Utilisateur n\'est pas une startup');
        setError('Cette page est réservée aux startups');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        console.log('Récupération des programmes...');
        const programs = await getAllPrograms();
        console.log('Programmes récupérés:', programs);

        if (!programs || programs.length === 0) {
          console.log('Aucun programme trouvé');
          setError('Aucun programme disponible');
          setIsLoading(false);
          return;
        }

        // Cherche le dernier programme où la soumission de l'utilisateur est acceptée
        let lastAcceptedProgram = null;
        for (const prog of programs) {
          console.log(`Vérification du programme ${prog.id}...`);
          const result = await getSubmissionsByProgram(prog.id);
          if (result.submissions && result.submissions.length > 0) {
            const userSubmission = result.submissions[0];
            console.log(`Soumission trouvée pour le programme ${prog.id}:`, userSubmission);
            const acceptanceResult = await checkSubmissionAccepted(userSubmission.id, prog.id);
            console.log(`Résultat de l'acceptation pour le programme ${prog.id}:`, acceptanceResult);
            if (acceptanceResult.accepted) {
              lastAcceptedProgram = { program: prog, submission: userSubmission };
              console.log(`Programme ${prog.id} accepté, on l'utilise.`);
              break;
            }
          }
        }

        if (!lastAcceptedProgram) {
          console.log('Aucun programme accepté trouvé');
          setError('Aucun programme accepté trouvé');
          setIsLoading(false);
          return;
        }

        const programDetails = await getProgram(lastAcceptedProgram.program.id);
        console.log('Détails du programme récupérés:', programDetails);

        if (!programDetails) {
          console.log('Aucun détail de programme trouvé');
          setError('Impossible de récupérer les détails du programme');
          setIsLoading(false);
          return;
        }

        // Fetch phases for this program
        console.log(`Fetching phases for program ${programDetails.id}...`);
        const phases = await getPhases(programDetails.id);
        console.log(`Fetched ${phases ? phases.length : 0} phases for program ${programDetails.id}:`, phases);

        if (!phases || phases.length === 0) {
          console.log('Aucune phase trouvée pour ce programme');
          setError('Aucune phase trouvée pour ce programme');
          setIsLoading(false);
          return;
        }

        // Format date function to get only the date part
        const formatDateString = (dateStr: string) => {
          if (!dateStr) return new Date().toISOString().split('T')[0];
          // If it's already just a date (YYYY-MM-DD), return it
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
          // Otherwise, extract the date part from the timestamp
          return dateStr.split('T')[0];
        };

        // Fetch tasks for all phases
        const allTasks: Record<number, Task[]> = {};
        const phasesWithDetails = await Promise.all(
          phases.map(async (phase) => {
            try {
              // Update program status to active
              await updateProgramStatus(programDetails.id, 'active' as FrontendStatus);

              // Fetch tasks for this phase
              console.log(`Fetching tasks for phase ${phase.id}...`);
              const tasks = await getTasks(phase.id);
              console.log(`Fetched ${tasks ? tasks.length : 0} tasks for phase ${phase.id}:`, tasks);

              // Format tasks for this phase
              const formattedTasks = (tasks || []).map(task => ({
                id: String(task.id),
                title: task.nom || task.title || 'Tâche sans titre',
                completed: task.completed || false,
                priority: task.priority || 'medium',
                dueDate: task.date_echeance || task.dueDate || new Date().toISOString(),
                status: task.status || (task.completed ? 'completed' : 'todo'),
                isOverdue: task.date_echeance && new Date(task.date_echeance) < new Date() && !task.completed
              }));

              // Add to all tasks
              allTasks[Number(phase.id)] = formattedTasks;

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
                ...phase,
                id: String(phase.id),
                name: phase.nom || phase.name || `Phase ${phase.id}`,
                description: phase.description || '',
                startDate: formatDateString(phase.date_debut),
                endDate: formatDateString(phase.date_fin),
                status: phaseStatus,
                color: phase.color || '#818cf8',
                tasks: formattedTasks
              };
            } catch (error) {
              console.error(`Error fetching details for phase ${phase.id}:`, error);
              return {
                ...phase,
                id: String(phase.id),
                name: phase.nom || phase.name || `Phase ${phase.id}`,
                description: phase.description || '',
                startDate: formatDateString(phase.date_debut),
                endDate: formatDateString(phase.date_fin),
                status: 'not_started',
                color: '#818cf8',
                tasks: []
              };
            }
          })
        );

        console.log('All tasks:', allTasks);
        setTasks(allTasks);
        setPhases(phasesWithDetails);

        // Set the first phase as active by default if not already set
        if (phasesWithDetails.length > 0 && !activePhase) {
          setActivePhase(Number(phasesWithDetails[0].id));
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des informations du programme:', error);
        setError('Une erreur est survenue lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmissionProgramInfo();
  }, [user?.id, user?.role, activePhase]);

  // Update active phase when selectedPhaseId changes
  useEffect(() => {
    if (selectedPhaseId) {
      setActivePhase(Number(selectedPhaseId));
    }
  }, [selectedPhaseId]);

  // Fetch tasks when phase changes
  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        // TODO: Replace with actual API call
        const response = await fetch(`/api/tasks?phaseId=${activePhase}`);
        const data = await response.json();
        setTasks(prev => ({
          ...prev,
          [activePhase]: data
        }));
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [activePhase]);

  // Function to toggle filters visibility
  const toggleFilters = () => {
    setShowFilters(prev => !prev);
  };

  const currentTasks = tasks[activePhase] || [];

  // Filter tasks based on search query and filters
  const filteredTasks = currentTasks.filter((task: Task) => {
    // Filter by search query
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Filter by status
    if (selectedStatuses.length > 0) {
      const taskStatus = task.status || (task.completed ? 'completed' : 'todo');
      if (!selectedStatuses.includes(taskStatus)) {
        return false;
      }
    }

    // Filter by priority
    if (selectedPriorities.length > 0 && !selectedPriorities.includes(task.priority)) {
      return false;
    }

    // Filter by tab
    if (activeTab === "my-tasks") {
      return false;
    } else if (activeTab === "overdue") {
      return !task.completed && task.dueDate && new Date(task.dueDate) < new Date();
    }

    return true;
  });

  const toggleTask = async (id: number | string): Promise<void> => {
    try {
      // TODO: Replace with actual API call
      await fetch(`/api/tasks/${id}/toggle`, {
        method: 'POST'
      });

      setTasks(prevTasks => ({
        ...prevTasks,
        [activePhase]: prevTasks[activePhase]?.map((task: Task) =>
          task.id === id ? {
            ...task,
            completed: !task.completed,
            status: !task.completed ? 'completed' as const : 'todo' as const
          } : task
        ) || []
      }));
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const handleStatusChange = async (taskId: number | string, newStatus: 'todo' | 'in_progress' | 'completed'): Promise<void> => {
    try {
      // TODO: Replace with actual API call
      await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      setTasks(prevTasks => ({
        ...prevTasks,
        [activePhase]: prevTasks[activePhase]?.map((task: Task) =>
          task.id === taskId ? {
            ...task,
            status: newStatus,
            completed: newStatus === 'completed'
          } : task
        ) || []
      }));
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const deleteTask = async (id: number | string): Promise<void> => {
    try {
      // TODO: Replace with actual API call
      await fetch(`/api/tasks/${id}`, {
        method: 'DELETE'
      });

      setTasks(prevTasks => ({
        ...prevTasks,
        [activePhase]: prevTasks[activePhase]?.filter((task: Task) => task.id !== id) || []
      }));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handlePhaseChange = (phase: number) => {
    setActivePhase(phase);
    setSelectedPhaseId(phase);
    setSearchQuery('');
    setActiveTab('all');
  };

  const getPriorityColor = (priority: string): string => {
    switch(priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityLabel = (priority: string): string => {
    switch(priority) {
      case "high": return "Haute";
      case "medium": return "Moyenne";
      case "low": return "Basse";
      default: return "";
    }
  };

  const formatDate = (dateString: string | Date): string => {
    if (!dateString) return "Pas de date";
    try {
      const date = dateString instanceof Date ? dateString : new Date(dateString);
      if (isNaN(date.getTime())) return "Date invalide";

      const options: Intl.DateTimeFormatOptions = {
        weekday: 'short' as const,
        day: 'numeric' as const,
        month: 'short' as const
      };
      return date.toLocaleDateString('fr-FR', options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return "Date invalide";
    }
  };

  // Get phase description
  const getPhaseDescription = (phaseId: number) => {
    if (selectedProgram && selectedProgram.phases) {
      const phase = selectedProgram.phases.find(p => Number(p.id) === phaseId);
      if (phase) {
        return phase.description;
      }
    }
    return "Description non disponible";
  };

  // Get the program ID from the phases
  const programId = phases.length > 0 && phases[0].id ? phases[0].id : '';

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 overflow-auto" style={{ marginLeft: '290px' }}>
        <div className="p-6">
          <div className="tasks-container">
            {/* Main Content */}
            <ProgramAccessGuard programId={programId}>
              <main className="main-content">
                {/* Header */}
                <header className="tasks-header">
                  <div>
                    <h1>Tâches - {selectedProgram?.name || 'Programme'}</h1>
                    <p className="subtitle">Gérez vos actions et priorités par phase</p>
                  </div>
                </header>

              {/* Phases Navigation */}
              <section className="phases-section">
                {isLoading ? (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">Chargement des phases...</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="mb-4">
                      <h2 className="text-lg font-semibold">Chronologie des phases du programme</h2>
                      <p className="text-sm text-gray-500">Cliquez sur une phase pour filtrer les tâches</p>
                    </div>
                    <div className="flex flex-col space-y-2">
                      {/* Phase Timeline Bar */}
                      <div className="relative h-12 bg-gray-100 rounded-md overflow-hidden flex">
                        {phases.map((phase, i) => {
                          const width = `${100 / phases.length}%`;
                          return (
                            <div
                              key={phase.id}
                              className={`h-full cursor-pointer hover:opacity-90 flex items-center justify-center
                                ${activePhase === Number(phase.id) ? 'ring-2 ring-offset-2 ring-offset-white ring-blue-500 z-10' : ''}
                              `}
                              style={{
                                width,
                                backgroundColor: phase.color,
                                opacity: phase.status === 'not_started' ? 0.5 : 1,
                                zIndex: phases.length - i
                              }}
                              onClick={() => handlePhaseChange(Number(phase.id))}
                            >
                              <span className="text-white font-medium text-xs md:text-sm truncate px-2">
                                {phase.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Phase Details */}
                      <div className="grid grid-cols-5 gap-2">
                        {phases.map((phase) => (
                          <div
                            key={`details-${phase.id}`}
                            className={`text-xs p-2 rounded ${activePhase === Number(phase.id) ? 'bg-gray-100' : ''}`}
                          >
                            <div className="font-medium">{phase.name}</div>
                            <div className="text-gray-500">
                              {formatDate(phase.startDate)} - {formatDate(phase.endDate)}
                            </div>
                            <div className="mt-1 flex items-center">
                              <FaRegCircle className="h-3 w-3 mr-1 text-gray-500" />
                              <span>{phase.tasks?.length || 0} Tâches</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* View toggle and filters */}
              <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveView("kanban")}
                    className="flex-1 md:flex-none"
                    style={{
                      backgroundColor: activeView === "kanban" ? '#0c4c80' : 'white',
                      color: activeView === "kanban" ? 'white' : '#0c4c80',
                      border: '1px solid #e5e7eb',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Tableau Kanban
                  </button>
                  <button
                    onClick={() => setActiveView("list")}
                    className="flex-1 md:flex-none"
                    style={{
                      backgroundColor: activeView === "list" ? '#0c4c80' : 'white',
                      color: activeView === "list" ? 'white' : '#0c4c80',
                      border: '1px solid #e5e7eb',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Vue Liste
                  </button>
                </div>
                <div className="flex gap-2 flex-1 md:w-1/2">
                  <div className="relative flex-1">
                    <FaSearch className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      placeholder={`Rechercher des tâches pour la phase ${activePhase}...`}
                      className="pl-8 w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={toggleFilters}
                    className={showFilters ? "bg-gray-100" : ""}
                    style={{
                      backgroundColor: showFilters ? '#f3f4f6' : 'white',
                      color: '#0c4c80',
                      border: '1px solid #e5e7eb',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <FaFilter className="h-4 w-4 mr-2" />
                    Filtres
                  </button>
                </div>
              </div>

              {/* Active Phase Filter */}
              {activePhase && (
                <div className="mb-6 px-4 py-3 bg-blue-50 rounded-lg flex justify-between items-center">
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 rounded-full mr-2"
                      style={{ backgroundColor: phases.find(p => Number(p.id) === activePhase)?.color }}
                    ></div>
                    <span className="font-medium">
                      Filtré par phase : {phases.find(p => Number(p.id) === activePhase)?.name}
                    </span>
                  </div>
                  <button
                    onClick={() => handlePhaseChange(1)}
                    className="text-primary hover:text-primary/80"
                  >
                    Effacer
                  </button>
                </div>
              )}

              {/* Filters */}
              {showFilters ? (
                <Card className="mb-6 border-2 border-blue-200 shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Filtres</CardTitle>
                    <CardDescription>Sélectionnez les filtres pour affiner les tâches</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-medium mb-3">Statut de la tâche</h3>
                        <div className="space-y-2">
                          {(['todo', 'in_progress', 'completed'] as const).map(status => (
                            <div key={status} className="flex items-center">
                              <Checkbox
                                id={`status-${status}`}
                                checked={selectedStatuses.includes(status)}
                                onCheckedChange={(checked) => {
                                  const newStatuses = checked
                                    ? [...selectedStatuses, status]
                                    : selectedStatuses.filter(s => s !== status);
                                  setSelectedStatuses(newStatuses);
                                }}
                              />
                              <label htmlFor={`status-${status}`} className="ml-2 capitalize">
                                {status === 'todo' ? 'À faire' :
                                 status === 'in_progress' ? 'En cours' :
                                 'Terminé'}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-medium mb-3">Priorité</h3>
                        <div className="space-y-2">
                          {(['high', 'medium', 'low'] as const).map(priority => (
                            <div key={priority} className="flex items-center">
                              <Checkbox
                                id={`priority-${priority}`}
                                checked={selectedPriorities.includes(priority)}
                                onCheckedChange={(checked) => {
                                  const newPriorities = checked
                                    ? [...selectedPriorities, priority]
                                    : selectedPriorities.filter(p => p !== priority);
                                  setSelectedPriorities(newPriorities);
                                }}
                              />
                              <label htmlFor={`priority-${priority}`} className="ml-2">
                                {getPriorityLabel(priority)}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {/* Recommended Tasks */}
              <section className="recommended-tasks">
                <div className="recommended-card">
                  <h2>Tâches recommandées pour la Phase {activePhase}</h2>
                  {phases.find(p => Number(p.id) === activePhase)?.recommendedTasks ? (
                    <ul>
                      {phases.find(p => Number(p.id) === activePhase)?.recommendedTasks?.map((task: string, index: number) => (
                        <li key={index} className="flex items-center gap-2">
                          <FaRegCircle className="h-3 w-3 text-gray-400" />
                          {task}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic">
                      Aucune tâche recommandée pour cette phase.
                    </p>
                  )}
                </div>
              </section>

              {/* Task content */}
              <Tabs defaultValue="all" onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="all">Toutes les tâches - Phase {activePhase}</TabsTrigger>
                  <TabsTrigger value="my-tasks">Mes tâches</TabsTrigger>
                  <TabsTrigger value="overdue">En retard</TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                  {filteredTasks.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <FaExclamationTriangle className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-lg font-medium text-gray-900">Aucune tâche trouvée</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Aucune tâche disponible pour la phase {activePhase}. Essayez d'ajuster votre recherche ou vos filtres.
                      </p>
                    </div>
                  ) : activeView === "kanban" ? (
                    // Kanban Board View
                    <section className="kanban-board-container">
                      <TaskKanbanBoard
                        tasks={filteredTasks}
                        onStatusChange={handleStatusChange}
                        onDelete={deleteTask}
                      />
                    </section>
                  ) : (
                    // List View
                    <div>
                      {/* Tasks by Status */}
                      {(['todo', 'in_progress', 'completed'] as const).map(status => {
                        const statusTasks = filteredTasks.filter(task => task.status === status ||
                          (status === 'todo' && !task.status && !task.completed) ||
                          (status === 'completed' && task.completed));

                        if (statusTasks.length === 0) return null;

                        return (
                          <div key={status} className="mb-8">
                            <div className="flex items-center mb-4">
                              {status === 'todo' ? (
                                <FaRegCircle className="h-4 w-4 text-gray-500 mr-2" />
                              ) : status === 'in_progress' ? (
                                <FaRegCircle className="h-4 w-4 text-blue-500 mr-2" />
                              ) : (
                                <FaCheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              )}
                              <h2 className="text-lg font-medium ml-2">
                                {status === 'todo' ? 'À faire' :
                                 status === 'in_progress' ? 'En cours' :
                                 'Terminé'}
                              </h2>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                              {statusTasks.map(task => (
                                <motion.div
                                  key={task.id}
                                  className={`task-card ${task.completed ? 'completed' : ''}`}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <div className="task-main">
                                    <button
                                      className="task-checkbox"
                                      onClick={() => toggleTask(task.id)}
                                    >
                                      {task.completed ? (
                                        <FaCheckCircle className="checked" />
                                      ) : (
                                        <FaRegCircle />
                                      )}
                                    </button>

                                    <div className="task-content">
                                      <h3 className={task.completed ? 'line-through' : ''}>
                                        {task.title}
                                      </h3>
                                      <div className="task-meta">
                                        <span className={`priority-badge ${getPriorityColor(task.priority)}`}>
                                          {getPriorityLabel(task.priority)}
                                        </span>
                                        {task.dueDate && (
                                          <span className={`due-date ${!task.completed && new Date(task.dueDate) < new Date() ? 'overdue' : ''}`}>
                                            {formatDate(task.dueDate)}
                                            {!task.completed && new Date(task.dueDate) < new Date() && (
                                              <FaExclamationTriangle className="ml-1" />
                                            )}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="task-actions">
                                    <button
                                      className="action-btn delete"
                                      onClick={() => deleteTask(task.id)}
                                    >
                                      <FaTrash />
                                    </button>
                                    <button className="action-btn more">
                                      <FaEllipsisV />
                                    </button>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="my-tasks">
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <FaRegCircle className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">Mes tâches</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      L'attribution de tâches personnelles sera bientôt disponible.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="overdue">
                  {filteredTasks.filter(task => !task.completed && task.dueDate && new Date(task.dueDate) < new Date()).length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <FaCheckCircle className="mx-auto h-12 w-12 text-green-500" />
                      <h3 className="mt-2 text-lg font-medium text-gray-900">Aucune tâche en retard</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Toutes les tâches de la phase {activePhase} sont à jour. Excellent travail !
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {filteredTasks
                        .filter(task => !task.completed && task.dueDate && new Date(task.dueDate) < new Date())
                        .map(task => (
                          <motion.div
                            key={task.id}
                            className="task-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="task-main">
                              <button
                                className="task-checkbox"
                                onClick={() => toggleTask(task.id)}
                              >
                                <FaRegCircle />
                              </button>

                              <div className="task-content">
                                <h3>{task.title}</h3>
                                <div className="task-meta">
                                  <span className={`priority-badge ${getPriorityColor(task.priority)}`}>
                                    {getPriorityLabel(task.priority)}
                                  </span>
                                  <span className="due-date overdue">
                                    {formatDate(task.dueDate)}
                                    <FaExclamationTriangle className="ml-1" />
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="task-actions">
                              <button
                                className="action-btn delete"
                                onClick={() => deleteTask(task.id)}
                              >
                                <FaTrash />
                              </button>
                              <button className="action-btn more">
                                <FaEllipsisV />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </main>
            </ProgramAccessGuard>

            {/* CSS Styles */}
            <style>{`
              .tasks-container {
                display: flex;
                min-height: 100vh;
                background-color: #f9fafb;
                position: relative;
              }

              .main-content {
                flex: 1;
                padding: 2rem;
                padding-top: 100px; /* Add padding to account for the navbar height */
                position: relative;
                min-height: 100vh;
              }

              .tasks-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 2rem;
                padding-bottom: 1rem;
                border-bottom: 1px solid #e5e7eb;
              }

              .tasks-header h1 {
                font-size: 1.5rem;
                color: #111827;
                margin-bottom: 0.25rem;
              }

              .subtitle {
                color: #6b7280;
                font-size: 1rem;
                margin: 0;
              }

              .primary-btn {
                background: var(--gradient);
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 6px;
                font-weight: 500;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                cursor: pointer;
                transition: all 0.2s;
              }

              .primary-btn:hover {
                background: var(--gradient);
                opacity: 0.9;
              }

              /* View Toggle */
              .view-toggle {
                display: flex;
                background: #f3f4f6;
                border-radius: 8px;
                padding: 2px;
              }

              .view-btn {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem 1rem;
                border-radius: 6px;
                font-size: 0.875rem;
                font-weight: 500;
                color: #6b7280;
                border: none;
                background: transparent;
                cursor: pointer;
                transition: all 0.2s;
              }

              .view-btn.active {
                background: white;
                color: #111827;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              }

              .view-btn:hover:not(.active) {
                background: rgba(255, 255, 255, 0.5);
              }

              /* Kanban Board Container */
              .kanban-board-container {
                margin-top: 1.5rem;
              }

              /* Phases Navigation */
              .phases-section {
                margin-bottom: 1.5rem;
              }

              /* Recommended Tasks */
              .recommended-tasks {
                margin-bottom: 2rem;
              }

              .recommended-card {
                background: #f0fdf4;
                border-radius: 8px;
                padding: 1rem;
                border-left: 4px solid #10b981;
              }

              .recommended-card h2 {
                margin-top: 0;
                color: #111827;
                font-size: 1.2rem;
                margin-bottom: 1rem;
              }

              .recommended-card ul {
                margin: 0;
                padding-left: 1.5rem;
              }

              .recommended-card li {
                margin-bottom: 0.5rem;
                color: #374151;
              }

              /* Stats Grid */
              .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 1rem;
                margin-bottom: 2rem;
              }

              .stat-card {
                background: white;
                border-radius: 8px;
                padding: 1.5rem;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                text-align: center;
              }

              .stat-card h3 {
                font-size: 1rem;
                color: #6b7280;
                margin-bottom: 0.5rem;
              }

              .stat-value {
                font-size: 2rem;
                font-weight: 700;
                color: #111827;
              }

              /* Tasks List */
              .tasks-list {
                display: grid;
                grid-template-columns: 1fr;
                gap: 0.75rem;
              }

              .task-card {
                background: white;
                border-radius: 8px;
                padding: 1rem 1.5rem;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: all 0.3s ease;
              }

              .task-card.completed {
                opacity: 0.7;
              }

              .task-card:hover {
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }

              .task-main {
                display: flex;
                align-items: center;
                gap: 1rem;
                flex: 1;
              }

              .task-checkbox {
                background: none;
                border: none;
                color: #d1d5db;
                cursor: pointer;
                font-size: 1.25rem;
                padding: 0.25rem;
              }

              .task-checkbox .checked {
                color: #10b981;
              }

              .task-content {
                flex: 1;
              }

              .task-content h3 {
                font-size: 1.1rem;
                color: #111827;
                margin: 0 0 0.25rem 0;
              }

              .line-through {
                text-decoration: line-through;
                color: #9ca3af;
              }

              .task-meta {
                display: flex;
                gap: 1rem;
                font-size: 0.85rem;
              }

              .priority-badge {
                padding: 0.25rem 0.75rem;
                border-radius: 12px;
                font-weight: 500;
                font-size: 0.75rem;
              }

              .bg-red-100 { background-color: #fee2e2; }
              .text-red-800 { color: #991b1b; }
              .bg-yellow-100 { background-color: #fef3c7; }
              .text-yellow-800 { color: #92400e; }
              .bg-green-100 { background-color: #d1fae5; }
              .text-green-800 { color: #065f46; }

              .due-date {
                color: #6b7280;
                display: flex;
                align-items: center;
              }

              .due-date.overdue {
                color: #ef4444;
              }

              .task-actions {
                display: flex;
                gap: 0.5rem;
              }

              .action-btn {
                background: none;
                border: none;
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 4px;
                font-size: 1rem;
              }

              .action-btn.delete {
                color: #ef4444;
              }

              .action-btn.delete:hover {
                background: #fee2e2;
              }

              .action-btn.more {
                color: #6b7280;
              }

              .action-btn.more:hover {
                background: #f3f4f6;
              }

              /* Modal Styles */
              .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                backdrop-filter: blur(2px);
              }

              .modal-content {
                background: white;
                border-radius: 12px;
                padding: 2rem;
                width: 90%;
                max-width: 500px;
                position: relative;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
              }

              .close-btn {
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #6b7280;
                padding: 0.25rem;
              }

              .modal-content h2 {
                margin-top: 0;
                color: #111827;
                margin-bottom: 1.5rem;
              }

              .form-group {
                margin-bottom: 1.5rem;
              }

              .form-group label {
                display: block;
                margin-bottom: 0.5rem;
                color: #4b5563;
                font-weight: 300;
              }

              .form-group input,
              .form-group select {
                width: 100%;
                padding: 0.75rem;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-size: 1rem;
              }

              .form-row {
                display: flex;
                gap: 1rem;
              }

              .form-row .form-group {
                flex: 1;
              }

              .form-actions {
                display: flex;
                justify-content: flex-end;
                gap: 1rem;
                margin-top: 2rem;
              }

              .secondary-btn {
                background: none;
                color: #e43e32;
                border: 1px solid #e43e32;
                padding: 0.75rem 1.5rem;
                border-radius: 6px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
              }

              .secondary-btn:hover {
                background: rgba(228, 62, 50, 0.1);
              }

              @media (max-width: 768px) {
                .main-content {
                  padding: 1rem;
                  padding-top: 100px; /* Maintain padding for navbar on mobile */
                }

                .tasks-header {
                  flex-direction: column;
                  align-items: flex-start;
                  gap: 1rem;
                }

                .form-actions {
                  flex-direction: column;
                }

                .primary-btn, .secondary-btn {
                  width: 100%;
                }
              }
            `}</style>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartupTasksPage;