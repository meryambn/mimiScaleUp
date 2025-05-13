import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  User,
  Filter,
  GripVertical,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useProgramContext } from "@/context/ProgramContext";
import { format } from "date-fns";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useTasks, Task, TaskStatus } from "@/context/TasksContext";

// Mock phase data
// interface Phase {
//   id: string;
//   name: string;
//   color: string;
//   startDate: string;
//   endDate: string;
//   status: 'not_started' | 'in_progress' | 'completed';
// }

// Mock task data
// interface Task {
//   id: string;
//   title: string;
//   description: string;
//   dueDate: string;
//   status: 'todo' | 'in_progress' | 'completed';
//   priority: 'low' | 'medium' | 'high';
//   assignee: string;
//   phaseId: string;
//   phaseName: string;
//   tags: string[];
//   isOverdue: boolean;
//   programId: string;
//   forAllTeams: boolean;
// }

const TasksPage: React.FC = () => {
  const { selectedProgram } = useProgramContext();
  const [showFilters, setShowFilters] = useState(false);
  const [activeView, setActiveView] = useState<"list" | "board">("board");

  // Use the TasksContext
  const {
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
    statusIcons
  } = useTasks();

  // Handle drag end for the kanban board
  const handleDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;

    // If the item was dropped outside a droppable area
    if (!destination) {
      return;
    }

    // If the item was dropped in the same place
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Update the task status based on the destination droppable ID
    const newStatus = destination.droppableId as TaskStatus;
    updateTaskStatus(draggableId, newStatus);
  };

  // Force refresh tasks when program changes
  React.useEffect(() => {
    if (selectedProgram) {
      // Clear any filters that might be applied
      setSearchQuery('');
      setSelectedStatuses([]);
      setSelectedPriorities([]);
      setSelectedPhase(null);
    }
  }, [selectedProgram, setSearchQuery, setSelectedStatuses, setSelectedPriorities, setSelectedPhase]);

  if (!selectedProgram) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">No Program Selected</h1>
        <p className="text-gray-500 mb-6">Please select a program to view its tasks.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tâches du programme</h1>
          <p className="text-gray-500">{selectedProgram.name}</p>
        </div>

      </div>

      {/* View toggle and filters */}
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView("board")}
            className="flex-1 md:flex-none"
            style={{
              backgroundColor: activeView === "board" ? '#0c4c80' : 'white',
              color: activeView === "board" ? 'white' : '#0c4c80',
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
        <div className="flex gap-2 flex-1 md:flex-none md:w-1/3">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher des tâches..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
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
            <Filter className="h-4 w-4 mr-2" />
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
                      ${selectedPhase === phase.id ? 'ring-2 ring-offset-2 ring-offset-white ring-blue-500 z-10' : ''}
                    `}
                    style={{
                      width,
                      backgroundColor: phase.color,
                      opacity: phase.status === 'not_started' ? 0.5 : 1
                    }}
                    onClick={() => setSelectedPhase(selectedPhase === String(phase.id) ? null : String(phase.id))}
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
      {showFilters && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-3">Statut de la tâche</h3>
                <div className="space-y-2">
                  {(['todo', 'in_progress', 'completed'] as TaskStatus[]).map(status => (
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
                        {status.replace('_', ' ')}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Priorité</h3>
                <div className="space-y-2">
                  {['high', 'medium', 'low'].map(priority => (
                    <div key={priority} className="flex items-center">
                      <Checkbox
                        id={`priority-${priority}`}
                        checked={selectedPriorities.includes(priority)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPriorities([...selectedPriorities, priority]);
                          } else {
                            setSelectedPriorities(selectedPriorities.filter(p => p !== priority));
                          }
                        }}
                      />
                      <label htmlFor={`priority-${priority}`} className="ml-2 text-sm">
                        <Badge className={priorityColors[priority]}>
                          {priority}
                        </Badge>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedPhase && (
        <div className="mb-6 p-3 bg-blue-50 rounded-md flex items-center">
          <div
            className="w-3 h-3 rounded-full mr-2"
            style={{ backgroundColor: getPhaseById(selectedPhase)?.color }}
          ></div>
          <p className="text-sm">
            <span className="font-medium">Filtré par:</span> phase {getPhaseById(selectedPhase)?.name}
          </p>
          <button
            className="ml-auto"
            onClick={() => setSelectedPhase(null)}
            style={{
              backgroundColor: 'transparent',
              color: '#0c4c80',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Effacer
          </button>
        </div>
      )}

      {/* Task content */}
      <Tabs defaultValue="all">
        <TabsList className="mb-6">
          <TabsTrigger value="all">Toutes les tâches</TabsTrigger>
          <TabsTrigger value="my-tasks">Mes tâches</TabsTrigger>
          <TabsTrigger value="overdue">En retard</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Aucune tâche trouvée</h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedPhase
                  ? `Il n'y a pas de tâches dans la phase ${getPhaseById(selectedPhase)?.name} correspondant à vos filtres.`
                  : "Essayez d'ajuster votre recherche ou vos filtres pour trouver ce que vous cherchez."
                }
              </p>
            </div>
          ) : activeView === "board" ? (
            // Kanban Board View
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* To Do Column */}
                <div>
                  <div className="flex items-center mb-4">
                    <Clock className="h-4 w-4 text-gray-500 mr-2" />
                    <h2 className="font-medium">À faire</h2>
                  </div>
                  <Droppable droppableId="todo">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="bg-gray-50 rounded-lg p-3 min-h-[300px]"
                      >
                        {tasksByStatus.todo.map((task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`mb-3 ${snapshot.isDragging ? 'opacity-70' : ''}`}
                              >
                                <TaskCard task={task} dragHandleProps={provided.dragHandleProps} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>

                {/* In Progress Column */}
                <div>
                  <div className="flex items-center mb-4">
                    <Clock className="h-4 w-4 text-blue-500 mr-2" />
                    <h2 className="font-medium">En cours</h2>
                  </div>
                  <Droppable droppableId="in_progress">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="bg-gray-50 rounded-lg p-3 min-h-[300px]"
                      >
                        {tasksByStatus.in_progress.map((task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`mb-3 ${snapshot.isDragging ? 'opacity-70' : ''}`}
                              >
                                <TaskCard task={task} dragHandleProps={provided.dragHandleProps} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>

                {/* Completed Column */}
                <div>
                  <div className="flex items-center mb-4">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                    <h2 className="font-medium">Terminé</h2>
                  </div>
                  <Droppable droppableId="completed">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="bg-gray-50 rounded-lg p-3 min-h-[300px]"
                      >
                        {tasksByStatus.completed.map((task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`mb-3 ${snapshot.isDragging ? 'opacity-70' : ''}`}
                              >
                                <TaskCard task={task} dragHandleProps={provided.dragHandleProps} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
            </DragDropContext>
          ) : (
            // List View
            <div>
              {/* Tasks by Status */}
              {(['todo', 'in_progress', 'completed'] as TaskStatus[]).map(status => {
                const statusTasks = filteredTasks.filter(task => task.status === status);
                if (statusTasks.length === 0) return null;

                return (
                  <div key={status} className="mb-8">
                    <div className="flex items-center mb-4">
                      {statusIcons[status]}
                      <h2 className="text-lg font-medium ml-2">
                        {status === 'todo' ? 'À faire' :
                         status === 'in_progress' ? 'En cours' :
                         'Terminé'}
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {statusTasks.map(task => (
                        <TaskCard key={task.id} task={task} />
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
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Mes tâches</h3>
            <p className="mt-1 text-sm text-gray-500">
              L'attribution de tâches personnelles sera bientôt disponible.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="overdue">
          {filteredTasks.filter(task => task.isOverdue).length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Aucune tâche en retard</h3>
              <p className="mt-1 text-sm text-gray-500">
                Toutes les tâches sont à jour. Excellent travail !
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredTasks
                .filter(task => task.isOverdue)
                .map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Task Card Component
const TaskCard = ({
  task,
  dragHandleProps = {}
}: {
  task: Task,
  dragHandleProps?: any
}) => {
  const { statusIcons } = useTasks();

  // Calculate days remaining
  const dueDate = new Date(task.dueDate);
  const today = new Date();
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            {dragHandleProps ? (
              <div className="flex items-center">
                <div {...dragHandleProps} className="cursor-grab mr-2">
                  <GripVertical className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex items-center">
                  {statusIcons[task.status]}
                  <span className="ml-2 font-medium">{task.title || task.name || "Tâche sans titre"}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center">
                {statusIcons[task.status]}
                <span className="ml-2 font-medium">{task.title || task.name || "Tâche sans titre"}</span>
              </div>
            )}

          </div>

          <div className="p-4">
            <p className="text-sm text-gray-600 mb-4">
              {task.description}
            </p>

            <div className="flex items-center mb-2 text-sm">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                <span className={`${task.isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                  {format(new Date(task.dueDate), 'd MMM yyyy')}
                </span>
              </div>
            </div>

            {diffDays > 0 && (
              <div className="text-xs text-gray-500">
                {diffDays} {diffDays === 1 ? 'jour' : 'jours'} restant{diffDays > 1 ? 's' : ''}
              </div>
            )}

            {task.isOverdue && (
              <div className="text-xs text-red-600 font-medium">
                En retard de {Math.abs(diffDays)} {Math.abs(diffDays) === 1 ? 'jour' : 'jours'}
              </div>
            )}
          </div>


        </div>
      </CardContent>
    </Card>
  );
};

export default TasksPage;