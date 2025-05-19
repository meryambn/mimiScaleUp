import React, { useState } from 'react';
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

const StartupTasksPage = () => {
  const [activePhase, setActivePhase] = useState(1);
  const [activeView, setActiveView] = useState<"list" | "kanban">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);

  // Function to toggle filters visibility
  const toggleFilters = () => {
    setShowFilters(prev => !prev);
  };



  // Phase data for the filter widget
  const phases = [
    { id: 1, name: "Phase 1", color: "#4f46e5", status: "completed" as const },
    { id: 2, name: "Phase 2", color: "#0ea5e9", status: "in-progress" as const },
    { id: 3, name: "Phase 3", color: "#10b981", status: "upcoming" as const },
    { id: 4, name: "Phase 4", color: "#f59e0b", status: "not_started" as const }
  ];

  const [tasks, setTasks] = useState<Record<number, Task[]>>({
    1: [
      { id: 1, title: "Finaliser le business plan", completed: false, priority: "high", dueDate: "2025-06-10", status: "todo" },
      { id: 2, title: "Préparer la présentation pitch", completed: true, priority: "medium", dueDate: "2025-05-28", status: "completed" }
    ],
    2: [
      { id: 3, title: "Développer le MVP", completed: false, priority: "high", dueDate: "2025-07-15", status: "in_progress" },
      { id: 4, title: "Réaliser des tests utilisateurs", completed: false, priority: "medium", dueDate: "2025-07-20", status: "todo" }
    ],
    3: [
      { id: 5, title: "Rencontrer les mentors", completed: false, priority: "medium", dueDate: "2025-09-01", status: "todo" },
      { id: 6, title: "Affiner la stratégie de scaling", completed: false, priority: "low", dueDate: "", status: "todo" }
    ],
    4: [
      { id: 7, title: "Préparer le rapport final", completed: false, priority: "high", dueDate: "2025-11-15", status: "todo" },
      { id: 8, title: "Présenter les résultats", completed: false, priority: "high", dueDate: "2025-11-30", status: "todo" }
    ]
  });



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
      // For now, we don't have assigned tasks, so return empty
      return false;
    } else if (activeTab === "overdue") {
      return !task.completed && task.dueDate && new Date(task.dueDate) < new Date();
    }

    return true;
  });

  const toggleTask = (id: number | string): void => {
    setTasks(prevTasks => ({
      ...prevTasks,
      [activePhase]: prevTasks[activePhase].map((task: Task) =>
        task.id === id ? {
          ...task,
          completed: !task.completed,
          status: !task.completed ? 'completed' as const : 'todo' as const
        } : task
      )
    }));
  };

  const handleStatusChange = (taskId: number | string, newStatus: 'todo' | 'in_progress' | 'completed'): void => {
    setTasks(prevTasks => ({
      ...prevTasks,
      [activePhase]: prevTasks[activePhase].map((task: Task) =>
        task.id === taskId ? {
          ...task,
          status: newStatus,
          completed: newStatus === 'completed'
        } : task
      )
    }));
  };

  const deleteTask = (id: number | string): void => {
    setTasks(prevTasks => ({
      ...prevTasks,
      [activePhase]: prevTasks[activePhase].filter((task: Task) => task.id !== id)
    }));
  };



  const handlePhaseChange = (phaseId: string | number | null): void => {
    if (typeof phaseId === 'number') {
      setActivePhase(phaseId);
    }
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

  const formatDate = (dateString: string): string => {
    if (!dateString) return "Pas de date";
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short' as const,
      day: 'numeric' as const,
      month: 'short' as const
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Tâches recommandées par phase
  const recommendedTasks: Record<number, string[]> = {
    1: ["Business Plan", "Présentation Pitch", "Étude de marché"],
    2: ["Développement MVP", "Tests utilisateurs", "Levée de fonds"],
    3: ["Rencontres mentors", "Stratégie scaling", "Optimisation processus"],
    4: ["Rapport final", "Présentation résultats", "Plan futur"]
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="tasks-container">
            {/* Main Content */}
            <main className="main-content">
              {/* Header */}
              <header className="tasks-header">
                <div>
                  <h1>Tâches du programme</h1>
                  <p className="subtitle">Gérez vos actions et priorités</p>
                </div>
              </header>

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
                      placeholder="Rechercher des tâches..."
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

              {/* Phase selection */}
              <Card className="mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Chronologie des phases du programme</CardTitle>
                  <CardDescription>Cliquez sur une phase pour filtrer les tâches</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-2">
                    {/* Phase Timeline Bar */}
                    <div className="relative h-12 bg-gray-100 rounded-md overflow-hidden flex">
                      {phases.map((phase) => {
                        // Calculate width based on phase duration (for actual implementation, use date calculation)
                        const width = `${100 / phases.length}%`;

                        return (
                          <div
                            key={phase.id}
                            className={`h-full cursor-pointer hover:opacity-90 flex items-center justify-center
                              ${activePhase === phase.id ? 'ring-2 ring-offset-2 ring-offset-white ring-blue-500 z-10' : ''}
                            `}
                            style={{
                              width,
                              backgroundColor: phase.color,
                              opacity: phase.status === 'not_started' ? 0.5 : 1
                            }}
                            onClick={() => handlePhaseChange(phase.id)}
                          >
                            <span className="text-white font-medium text-sm">
                              {phase.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

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
                  <h2>Tâches recommandées pour la Phase {activePhase}:</h2>
                  <ul>
                    {recommendedTasks[activePhase].map((task: string, index: number) => (
                      <li key={index}>{task}</li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* Task content */}
              <Tabs defaultValue="all" onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="all">Toutes les tâches</TabsTrigger>
                  <TabsTrigger value="my-tasks">Mes tâches</TabsTrigger>
                  <TabsTrigger value="overdue">En retard</TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                  {filteredTasks.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <FaExclamationTriangle className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-lg font-medium text-gray-900">Aucune tâche trouvée</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Essayez d'ajuster votre recherche ou vos filtres pour trouver ce que vous cherchez.
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
                        Toutes les tâches sont à jour. Excellent travail !
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