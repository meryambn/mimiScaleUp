import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle, AlertCircle, Milestone } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useProgramContext } from '@/context/ProgramContext';
import { Phase } from '@/types/program';

interface TimelinePhase {
  id: number | string;
  name: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: 'completed' | 'in-progress' | 'upcoming';
  description: string;
}

const ProgramTimelineWidget: React.FC = () => {
  const { selectedProgram } = useProgramContext();
  const [phases, setPhases] = useState<TimelinePhase[]>([]);

  useEffect(() => {
    // If we have a selected program with phases, map them to TimelinePhase format
    if (selectedProgram && selectedProgram.phases && selectedProgram.phases.length > 0) {
      const mappedPhases = selectedProgram.phases.map(phase => {
        // Calculate progress based on tasks
        let progress = 0;
        if (phase.tasks && phase.tasks.length > 0) {
          const totalTasks = phase.tasks.length;
          const completedTasks = phase.tasks.filter(task => 
            task.status === 'completed').length;
          progress = Math.round((completedTasks / totalTasks) * 100);
        }

        // Map phase status to timeline status
        let timelineStatus: 'completed' | 'in-progress' | 'upcoming' = 'upcoming';
        if (phase.status === 'completed') {
          timelineStatus = 'completed';
        } else if (phase.status === 'in_progress') {
          timelineStatus = 'in-progress';
        }

        // Format dates
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
          progress: progress,
          status: timelineStatus,
          description: phase.description || ''
        };
      });
      
      setPhases(mappedPhases);
    } else {
      // Use default phases if no program is selected or no phases in program
      setPhases([
        {
          id: 1,
          name: 'Application',
          startDate: '2024-01-15',
          endDate: '2024-02-15',
          progress: 100,
          status: 'completed',
          description: 'Team applications and initial selection process'
        },
        {
          id: 2,
          name: 'Selection',
          startDate: '2024-02-16',
          endDate: '2024-03-15',
          progress: 100,
          status: 'completed',
          description: 'Final interview rounds and team selection'
        },
        {
          id: 3,
          name: 'Mentorship & Workshops',
          startDate: '2024-03-16',
          endDate: '2024-05-15',
          progress: 65,
          status: 'in-progress',
          description: 'Core program with mentorship sessions and skill workshops'
        },
        {
          id: 4,
          name: 'Product Development',
          startDate: '2024-05-16',
          endDate: '2024-06-30',
          progress: 0,
          status: 'upcoming',
          description: 'Focus on building and refining product'
        },
        {
          id: 5,
          name: 'Demo Day Preparation',
          startDate: '2024-07-01',
          endDate: '2024-07-15',
          progress: 0,
          status: 'upcoming',
          description: 'Pitch refinement and demo preparation'
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
        const mappedPhases = program.phases.map((phase: any) => {
          // Calculate progress based on tasks
          let progress = 0;
          if (phase.tasks && phase.tasks.length > 0) {
            const totalTasks = phase.tasks.length;
            const completedTasks = phase.tasks.filter((task: any) => 
              task.status === 'completed').length;
            progress = Math.round((completedTasks / totalTasks) * 100);
          }

          // Map phase status to timeline status
          let timelineStatus: 'completed' | 'in-progress' | 'upcoming' = 'upcoming';
          if (phase.status === 'completed') {
            timelineStatus = 'completed';
          } else if (phase.status === 'in_progress') {
            timelineStatus = 'in-progress';
          }

          // Format dates
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
            progress: progress,
            status: timelineStatus,
            description: phase.description || ''
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

  const getStatusIcon = (status: TimelinePhase['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-300" />;
    }
  };

  const getStatusBadge = (status: TimelinePhase['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">Completed</Badge>;
      case 'in-progress':
        return <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">In Progress</Badge>;
      default:
        return <Badge variant="outline" className="border-gray-200 text-gray-500">Upcoming</Badge>;
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Program Timeline</h3>
        <Milestone className="h-5 w-5 text-indigo-500" />
      </div>

      <div className="relative mt-2 mb-8">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
        
        {phases.map((phase, index) => (
          <div key={phase.id} className="relative mb-8 last:mb-0">
            <div className="flex group">
              {/* Timeline node */}
              <div className={cn(
                "absolute z-10 left-4 w-8 h-8 rounded-full flex items-center justify-center -translate-x-1/2 bg-white border-2",
                phase.status === 'completed' ? "border-green-500" :
                phase.status === 'in-progress' ? "border-blue-500 animate-pulse" :
                "border-gray-300"
              )}>
                {getStatusIcon(phase.status)}
              </div>
              
              {/* Content card */}
              <div className={cn(
                "ml-8 p-4 rounded-lg border shadow-sm w-full transition-all",
                phase.status === 'in-progress' ? "border-blue-200 bg-blue-50" :
                phase.status === 'completed' ? "border-green-200 bg-green-50" :
                "border-gray-200 bg-white"
              )}>
                <div className="flex justify-between mb-2">
                  <h4 className="font-medium">{phase.name}</h4>
                  {getStatusBadge(phase.status)}
                </div>
                
                <p className="text-sm text-gray-600 mb-4">{phase.description}</p>
                
                <div className="mb-2">
                  <div className="text-xs text-gray-500 flex justify-between mb-1">
                    <span>{phase.startDate}</span>
                    <span>{phase.endDate}</span>
                  </div>
                  <Progress
                    value={phase.progress}
                    className={cn(
                      "h-2 bg-gray-100",
                      phase.status === 'completed' ? "[&>div]:bg-green-500" :
                      phase.status === 'in-progress' ? "[&>div]:bg-blue-500" :
                      "[&>div]:bg-gray-300"
                    )}
                  />
                </div>
                
                <div className="text-xs text-right font-medium">
                  {phase.progress}% Complete
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgramTimelineWidget; 