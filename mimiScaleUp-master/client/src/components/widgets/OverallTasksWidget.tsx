import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTasks } from '@/context/TasksContext';
import { useProgramContext } from '@/context/ProgramContext';

const OverallTasksWidget: React.FC = () => {
  const { filteredTasks, priorityColors, statusIcons } = useTasks();
  const { selectedPhaseId } = useProgramContext();

  // Filter tasks by selected phase if applicable
  const phaseFilteredTasks = selectedPhaseId
    ? filteredTasks.filter(task => {
        // If task has phaseId property, filter by it
        if (task.phaseId) {
          return task.phaseId === selectedPhaseId;
        }
        // Otherwise, include all tasks
        return true;
      })
    : filteredTasks;

  // Get counts for each status
  const todoCount = phaseFilteredTasks.filter(t => t.status === 'todo').length;
  const inProgressCount = phaseFilteredTasks.filter(t => t.status === 'in_progress').length;
  const completedCount = phaseFilteredTasks.filter(t => t.status === 'completed').length;

  // Get only the first 4 tasks for display
  const displayTasks = phaseFilteredTasks.slice(0, 4);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Tâches</h3>
        <MessageSquare className="h-5 w-5 text-pink-500" />
      </div>

      <div className="mb-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-green-50 p-2 rounded">
            <div className="text-xl font-bold text-green-600">
              {completedCount}
            </div>
            <div className="text-xs text-green-600">Terminées</div>
          </div>
          <div className="bg-blue-50 p-2 rounded">
            <div className="text-xl font-bold text-blue-600">
              {inProgressCount}
            </div>
            <div className="text-xs text-blue-600">En cours</div>
          </div>
          <div className="bg-yellow-50 p-2 rounded">
            <div className="text-xl font-bold text-yellow-600">
              {todoCount}
            </div>
            <div className="text-xs text-yellow-600">À faire</div>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[220px]">
        <div className="space-y-3">
          {displayTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Aucune tâche trouvée</p>
            </div>
          ) : (
            displayTasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-lg border p-3 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {statusIcons[task.status]}
                    <span className="text-sm font-medium">{task.title || task.name || "Untitled Task"}</span>
                  </div>
                  <Badge className={priorityColors[task.priority]}>
                    {task.priority}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Échéance: {new Date(task.dueDate).toLocaleDateString('fr-FR')}</span>
                  <span>{task.assignee}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default OverallTasksWidget;