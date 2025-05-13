import React, { useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, MoreHorizontal, Calendar, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Types
export interface Task {
  id: number | string;
  title: string;
  completed?: boolean;
  priority: string;
  dueDate: string;
  status?: 'todo' | 'in_progress' | 'completed';
  description?: string;
}

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: number | string, newStatus: 'todo' | 'in_progress' | 'completed') => void;
  onDelete: (taskId: number | string) => void;
}

interface StatusColumnProps {
  title: string;
  icon: React.ReactNode;
  statusKey: 'todo' | 'in_progress' | 'completed';
  tasks: Task[];
  onStatusChange: (taskId: number | string, newStatus: 'todo' | 'in_progress' | 'completed') => void;
  onDelete: (taskId: number | string) => void;
}

interface TaskKanbanBoardProps {
  tasks: Task[];
  onStatusChange: (taskId: number | string, newStatus: 'todo' | 'in_progress' | 'completed') => void;
  onDelete: (taskId: number | string) => void;
}

// Composant pour une carte de tâche
const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusChange, onDelete }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'TASK',
    item: { id: task.id, currentStatus: task.status || 'todo' },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    })
  }));

  const getPriorityColor = (priority: string) => {
    switch(priority.toLowerCase()) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch(priority.toLowerCase()) {
      case "high": return "Haute";
      case "medium": return "Moyenne";
      case "low": return "Basse";
      default: return priority;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  const isOverdue = (dateString: string) => {
    const dueDate = new Date(dateString);
    const today = new Date();
    return dueDate < today && (task.status !== 'completed' && !task.completed);
  };

  return (
    <Card
      ref={drag}
      className={`mb-3 cursor-move hover:shadow-md transition-shadow ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex justify-between items-start">
          <h3 className={`text-sm font-medium ${(task.status === 'completed' || task.completed) ? 'line-through text-gray-500' : ''}`}>
            {task.title}
          </h3>
          <div className="flex space-x-1">
            <button 
              onClick={() => onDelete(task.id)} 
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="flex justify-between items-center text-xs mt-2">
          <Badge className={getPriorityColor(task.priority)}>
            {getPriorityLabel(task.priority)}
          </Badge>
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1 text-gray-500" />
            <span className={`${isOverdue(task.dueDate) ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
              {formatDate(task.dueDate)}
              {isOverdue(task.dueDate) && <AlertTriangle className="h-3 w-3 ml-1 inline" />}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Composant pour une colonne de statut
const StatusColumn: React.FC<StatusColumnProps> = ({ title, icon, statusKey, tasks, onStatusChange, onDelete }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'TASK',
    drop: (item: { id: number | string, currentStatus: 'todo' | 'in_progress' | 'completed' }) => {
      if (item.currentStatus !== statusKey) {
        onStatusChange(item.id, statusKey);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    })
  }));

  return (
    <div
      ref={drop}
      className={`flex-1 p-4 rounded-lg ${isOver ? 'bg-gray-100' : 'bg-gray-50'}`}
    >
      <div className="mb-4 flex items-center">
        {icon}
        <h3 className="font-medium ml-2">{title}</h3>
        <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
          />
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-400 italic">
            Aucune tâche
          </div>
        )}
      </div>
    </div>
  );
};

// Composant principal Kanban
const TaskKanbanBoard: React.FC<TaskKanbanBoardProps> = ({ tasks, onStatusChange, onDelete }) => {
  const { toast } = useToast();
  
  // Organiser les tâches par statut
  const tasksByStatus = {
    todo: tasks.filter(task => task.status === 'todo' || (!task.status && !task.completed)),
    in_progress: tasks.filter(task => task.status === 'in_progress'),
    completed: tasks.filter(task => task.status === 'completed' || task.completed)
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatusColumn
          title="À faire"
          icon={<Clock className="h-5 w-5 text-gray-500" />}
          statusKey="todo"
          tasks={tasksByStatus.todo}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
        />
        <StatusColumn
          title="En cours"
          icon={<Clock className="h-5 w-5 text-blue-500" />}
          statusKey="in_progress"
          tasks={tasksByStatus.in_progress}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
        />
        <StatusColumn
          title="Terminé"
          icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
          statusKey="completed"
          tasks={tasksByStatus.completed}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
        />
      </div>
    </DndProvider>
  );
};

export default TaskKanbanBoard;
