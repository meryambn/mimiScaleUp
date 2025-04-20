import React, { useEffect, useState } from 'react';
import { BarChart2, CheckCircle, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useProgramContext } from '@/context/ProgramContext';

interface Phase {
  id: number | string;
  name: string;
  startDate: string | Date;
  endDate: string | Date;
  progress: number;
  status: 'completed' | 'in-progress' | 'upcoming' | 'not_started';
  tasks: {
    total: number;
    completed: number;
  };
}

const PhasesWidget: React.FC = () => {
  const { selectedProgram } = useProgramContext();
  const [phases, setPhases] = useState<Phase[]>([]);

  useEffect(() => {
    if (selectedProgram && selectedProgram.phases) {
      // Map program phases to the format needed by the widget
      const mappedPhases = selectedProgram.phases.map(phase => {
        // Calculate tasks stats
        const totalTasks = Array.isArray(phase.tasks) ? phase.tasks.length : 0;
        const completedTasks = Array.isArray(phase.tasks)
          ? phase.tasks.filter(task => task.status === 'completed').length
          : 0;

        // Calculate progress percentage
        let progress = 0;
        if (totalTasks > 0) {
          progress = Math.round((completedTasks / totalTasks) * 100);
        }

        // Map status
        let mappedStatus: 'completed' | 'in-progress' | 'upcoming' = 'upcoming';
        if (phase.status === 'completed') {
          mappedStatus = 'completed';
        } else if (phase.status === 'in_progress') {
          mappedStatus = 'in-progress';
        } else if (phase.status === 'not_started') {
          mappedStatus = 'upcoming';
        }

        // Format dates if needed
        const formatDate = (date: Date | string) => {
          if (date instanceof Date) {
            return date.toISOString().split('T')[0];
          }
          return date;
        };

        return {
          id: phase.id,
          name: phase.name,
          startDate: formatDate(phase.startDate),
          endDate: formatDate(phase.endDate),
          progress,
          status: mappedStatus,
          tasks: {
            total: totalTasks,
            completed: completedTasks
          }
        };
      });

      setPhases(mappedPhases);
    } else {
      // Use default phases if no program is selected
      setPhases([
        {
          id: 1,
          name: 'Application & Selection',
          startDate: '2024-01-15',
          endDate: '2024-02-15',
          progress: 100,
          status: 'completed',
          tasks: {
            total: 10,
            completed: 10
          }
        },
        {
          id: 2,
          name: 'Onboarding & Setup',
          startDate: '2024-02-16',
          endDate: '2024-03-15',
          progress: 75,
          status: 'in-progress',
          tasks: {
            total: 8,
            completed: 6
          }
        },
        {
          id: 3,
          name: 'Core Program',
          startDate: '2024-03-16',
          endDate: '2024-06-15',
          progress: 0,
          status: 'upcoming',
          tasks: {
            total: 15,
            completed: 0
          }
        },
        {
          id: 4,
          name: 'Demo Day Preparation',
          startDate: '2024-06-16',
          endDate: '2024-07-15',
          progress: 0,
          status: 'upcoming',
          tasks: {
            total: 12,
            completed: 0
          }
        }
      ]);
    }
  }, [selectedProgram]);

  // Listen for program creation events
  useEffect(() => {
    const handleProgramCreated = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { program } = customEvent.detail;

      if (program && program.phases && Array.isArray(program.phases)) {
        // Same mapping as above but for newly created program
        const mappedPhases = program.phases.map((phase: any) => {
          const totalTasks = Array.isArray(phase.tasks) ? phase.tasks.length : 0;
          const completedTasks = Array.isArray(phase.tasks)
            ? phase.tasks.filter((task: any) => task.status === 'completed').length
            : 0;

          let progress = 0;
          if (totalTasks > 0) {
            progress = Math.round((completedTasks / totalTasks) * 100);
          }

          let mappedStatus: 'completed' | 'in-progress' | 'upcoming' = 'upcoming';
          if (phase.status === 'completed') {
            mappedStatus = 'completed';
          } else if (phase.status === 'in_progress') {
            mappedStatus = 'in-progress';
          } else if (phase.status === 'not_started') {
            mappedStatus = 'upcoming';
          }

          const formatDate = (date: Date | string) => {
            if (date instanceof Date) {
              return date.toISOString().split('T')[0];
            }
            return date;
          };

          return {
            id: phase.id,
            name: phase.name,
            startDate: formatDate(phase.startDate),
            endDate: formatDate(phase.endDate),
            progress,
            status: mappedStatus,
            tasks: {
              total: totalTasks,
              completed: completedTasks
            }
          };
        });

        setPhases(mappedPhases);
      }
    };

    document.addEventListener('program-created', handleProgramCreated);

    return () => {
      document.removeEventListener('program-created', handleProgramCreated);
    };
  }, []);

  const getStatusIcon = (status: Phase['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Program Phases</h3>
        <BarChart2 className="h-5 w-5 text-indigo-500" />
      </div>

      <div className="space-y-6">
        {phases.map((phase) => (
          <div key={phase.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon(phase.status)}
                <span className="font-medium">{phase.name}</span>
              </div>
              <span className="text-sm text-gray-500">
                {phase.tasks.completed}/{phase.tasks.total} tasks
              </span>
            </div>

            <div className="text-xs text-gray-500 flex justify-between mb-2">
              <span>{typeof phase.startDate === 'string' ? phase.startDate : phase.startDate instanceof Date ? phase.startDate.toLocaleDateString() : ''}</span>
              <span>{typeof phase.endDate === 'string' ? phase.endDate : phase.endDate instanceof Date ? phase.endDate.toLocaleDateString() : ''}</span>
            </div>

            <Progress
              value={phase.progress}
              className={cn(
                "h-2",
                phase.progress >= 80
                  ? "[&>div]:bg-green-500"
                  : phase.progress >= 40
                  ? "[&>div]:bg-yellow-500"
                  : "[&>div]:bg-gray-500"
              )}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhasesWidget;