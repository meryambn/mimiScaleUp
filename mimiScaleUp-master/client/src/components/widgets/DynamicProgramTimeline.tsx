import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle, AlertCircle, Milestone } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useProgramContext } from '@/context/ProgramContext';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

// Define the phase interface that works for both timeline styles
interface TimelinePhase {
  id: number | string;
  name: string;
  startDate?: string | Date;
  endDate?: string | Date;
  progress?: number;
  status: 'completed' | 'in-progress' | 'upcoming' | 'not_started';
  description?: string;
  color?: string;
}

interface DynamicProgramTimelineProps {
  onPhaseSelect?: (phaseId: number | string) => void;
  selectedPhase?: number | string | null;
  phases?: TimelinePhase[];
  title?: string;
  description?: string;
  showCard?: boolean;
  viewType?: 'vertical' | 'horizontal';
}

const DynamicProgramTimeline: React.FC<DynamicProgramTimelineProps> = ({
  onPhaseSelect,
  selectedPhase: externalSelectedPhase,
  phases: externalPhases,
  title = "Chronologie du Programme",
  description = "Cliquez sur une phase pour filtrer",
  showCard = true,
  viewType = 'vertical'
}) => {
  const [phases, setPhases] = useState<TimelinePhase[]>([]);
  const { selectedProgram, selectedPhaseId, setSelectedPhaseId } = useProgramContext();
  const [internalSelectedPhase, setInternalSelectedPhase] = useState<number | string | null>(null);

  // Determine if we're using external or internal state for selected phase
  const selectedPhaseValue = externalSelectedPhase !== undefined ? externalSelectedPhase : selectedPhaseId;

  // Notify parent component when phase is selected
  const handlePhaseSelect = (phaseId: number | string | null) => {
    // Update internal state
    setInternalSelectedPhase(phaseId);

    // Update context if we're using it
    if (setSelectedPhaseId && externalSelectedPhase === undefined) {
      setSelectedPhaseId(phaseId);
    }

    // Notify parent component
    if (phaseId !== null && onPhaseSelect) {
      onPhaseSelect(phaseId);
    }
  };

  // Get the selected phase object
  const getSelectedPhase = () => {
    return phases.find(phase => phase.id === selectedPhaseValue);
  };

  useEffect(() => {
    // Add debugging for phases
    console.log('DynamicProgramTimeline - externalPhases:', externalPhases ? `${externalPhases.length} phases` : 'none');
    console.log('DynamicProgramTimeline - selectedProgram phases:',
      selectedProgram && selectedProgram.phases ? `${selectedProgram.phases.length} phases` : 'none');

    // If external phases are provided, use them
    if (externalPhases && externalPhases.length > 0) {
      console.log('DynamicProgramTimeline - Using external phases:', externalPhases);

      // Process external phases to ensure they have the correct property names
      const processedPhases = externalPhases.map(phase => {
        // Handle case where phase data might have different property names (nom instead of name)
        const phaseName = phase.name || phase.nom || 'Phase sans nom';
        const phaseDescription = phase.description || '';
        // Get the date part only from timestamps
        const formatDateString = (dateStr) => {
          if (!dateStr) return new Date().toISOString().split('T')[0];
          // If it's already just a date (YYYY-MM-DD), return it
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
          // Otherwise, extract the date part from the timestamp
          return dateStr.split('T')[0];
        };

        const phaseStartDate = formatDateString(phase.startDate || phase.date_debut);
        const phaseEndDate = formatDateString(phase.endDate || phase.date_fin);

        // Calculate progress based on dates
        const now = new Date();
        const startDate = new Date(phaseStartDate);
        const endDate = new Date(phaseEndDate);
        const totalDuration = endDate.getTime() - startDate.getTime();
        const elapsedDuration = now.getTime() - startDate.getTime();
        let progress = 0;

        if (now > endDate) {
          progress = 100;
        } else if (now >= startDate && now <= endDate) {
          progress = Math.min(Math.round((elapsedDuration / totalDuration) * 100), 100);
        }

        // Determine status based on dates
        let status: 'completed' | 'in-progress' | 'upcoming' = 'upcoming';
        if (now > endDate) {
          status = 'completed';
        } else if (now >= startDate && now <= endDate) {
          status = 'in-progress';
        }

        return {
          id: phase.id,
          name: phaseName,
          startDate: phaseStartDate,
          endDate: phaseEndDate,
          progress,
          status,
          description: phaseDescription,
          color: phase.color || getStatusColor(status)
        };
      });

      setPhases(processedPhases);
    }
    // Otherwise, use phases from the selected program in context
    else if (selectedProgram && selectedProgram.phases && selectedProgram.phases.length > 0) {
      console.log('DynamicProgramTimeline - Using phases from selectedProgram:', selectedProgram.phases);
      // Convert program phases to timeline phases
      const timelinePhases = selectedProgram.phases.map(phase => {
        // Handle case where phase data might have different property names (nom instead of name)
        const phaseName = phase.name || phase.nom || 'Phase sans nom';
        const phaseDescription = phase.description || '';
        // Get the date part only from timestamps
        const formatDateString = (dateStr) => {
          if (!dateStr) return new Date().toISOString().split('T')[0];
          // If it's already just a date (YYYY-MM-DD), return it
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
          // Otherwise, extract the date part from the timestamp
          return dateStr.split('T')[0];
        };

        const phaseStartDate = formatDateString(phase.startDate || phase.date_debut);
        const phaseEndDate = formatDateString(phase.endDate || phase.date_fin);

        // Calculate progress based on dates
        const now = new Date();
        const startDate = new Date(phaseStartDate);
        const endDate = new Date(phaseEndDate);
        const totalDuration = endDate.getTime() - startDate.getTime();
        const elapsedDuration = now.getTime() - startDate.getTime();
        let progress = 0;

        if (now > endDate) {
          progress = 100;
        } else if (now >= startDate && now <= endDate) {
          progress = Math.min(Math.round((elapsedDuration / totalDuration) * 100), 100);
        }

        // Determine status based on dates
        let status: 'completed' | 'in-progress' | 'upcoming' = 'upcoming';
        if (now > endDate) {
          status = 'completed';
        } else if (now >= startDate && now <= endDate) {
          status = 'in-progress';
        }

        return {
          id: phase.id,
          name: phaseName,
          startDate: phaseStartDate,
          endDate: phaseEndDate,
          progress,
          status,
          description: phaseDescription,
          color: phase.color || getStatusColor(status)
        };
      });

      setPhases(timelinePhases);
    } else {
      // Use default phases if no program is selected
      setPhases([
        {
          id: 1,
          name: 'Phase 1',
          startDate: '2024-01-15',
          endDate: '2024-02-15',
          progress: 100,
          status: 'completed',
          description: 'Sélection et validation du projet',
          color: '#10b981' // green
        },
        {
          id: 2,
          name: 'Phase 2',
          startDate: '2024-02-16',
          endDate: '2024-03-15',
          progress: 100,
          status: 'completed',
          description: 'Développement accéléré et recherche de financement',
          color: '#10b981' // green
        },
        {
          id: 3,
          name: 'Phase 3',
          startDate: '2024-03-16',
          endDate: '2024-05-15',
          progress: 65,
          status: 'in-progress',
          description: 'Accompagnement par des mentors experts',
          color: '#3b82f6' // blue
        },
        {
          id: 4,
          name: 'Phase 4',
          startDate: '2024-05-16',
          endDate: '2024-06-30',
          progress: 0,
          status: 'upcoming',
          description: 'Présentation des résultats et perspectives',
          color: '#6b7280' // gray
        }
      ]);
    }
  }, [selectedProgram, externalPhases]);

  // Helper function to get status color
  const getStatusColor = (status: TimelinePhase['status']) => {
    switch (status) {
      case 'completed':
        return '#10b981'; // green
      case 'in-progress':
        return '#3b82f6'; // blue
      default:
        return '#6b7280'; // gray
    }
  };

  // Helper function to get status icon
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

  // Helper function to get status badge
  const getStatusBadge = (status: TimelinePhase['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Terminé</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">En cours</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">À venir</Badge>;
    }
  };

  // Selected phase indicator component
  const SelectedPhaseIndicator = () => {
    if (!selectedPhaseValue || !getSelectedPhase()) return null;

    return (
      <div className="mt-2 p-3 bg-blue-50 rounded-md flex items-center">
        <div
          className={cn(
            "w-3 h-3 rounded-full mr-2",
            getSelectedPhase()?.status === 'completed' ? "bg-green-500" :
            getSelectedPhase()?.status === 'in-progress' ? "bg-blue-500" :
            "bg-gray-400"
          )}
        ></div>
        <p className="text-sm">
          <span className="font-medium">Phase sélectionnée:</span> {getSelectedPhase()?.name}
        </p>
        <button
          className="ml-auto"
          onClick={() => handlePhaseSelect(null)}
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
    );
  };

  // Horizontal timeline content
  const HorizontalTimelineContent = () => {
    // Calculate width based on phase count
    const width = `${100 / phases.length}%`;

    return (
      <div className="flex flex-col space-y-2">
        {/* Phase Timeline Bar */}
        <div className="relative h-12 bg-gray-100 rounded-md overflow-hidden flex">
          {phases.map((phase) => (
            <div
              key={phase.id}
              className={`h-full cursor-pointer hover:opacity-90 flex items-center justify-center
                ${selectedPhaseValue === phase.id ? 'ring-2 ring-offset-2 ring-offset-white ring-blue-500 z-10' : ''}
              `}
              style={{
                width,
                backgroundColor: phase.color || getStatusColor(phase.status),
                opacity: phase.status === 'not_started' || phase.status === 'upcoming' ? 0.5 : 1
              }}
              onClick={() => handlePhaseSelect(selectedPhaseValue === phase.id ? null : phase.id)}
            >
              <span className="text-white font-medium text-sm">
                {phase.name}
              </span>
            </div>
          ))}
        </div>
        <SelectedPhaseIndicator />
      </div>
    );
  };

  // Vertical timeline content
  const VerticalTimelineContent = () => {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Milestone className="h-5 w-5 text-indigo-500" />
        </div>

        <SelectedPhaseIndicator />

        <div className="relative mt-2 mb-8">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

          {phases.map((phase) => (
            <div key={phase.id} className="relative mb-8 last:mb-0">
              <div className="flex group">
                {/* Timeline node */}
                <div
                  className={cn(
                    "absolute z-10 left-4 w-8 h-8 rounded-full flex items-center justify-center -translate-x-1/2 bg-white border-2 cursor-pointer",
                    selectedPhaseValue === phase.id ? "ring-2 ring-offset-1 ring-blue-500" : "",
                    phase.status === 'completed' ? "border-green-500" :
                    phase.status === 'in-progress' ? "border-blue-500 animate-pulse" :
                    "border-gray-300"
                  )}
                  onClick={() => handlePhaseSelect(selectedPhaseValue === phase.id ? null : phase.id)}
                >
                  {getStatusIcon(phase.status)}
                </div>

                {/* Content card */}
                <div
                  className={cn(
                    "ml-8 p-4 rounded-lg border shadow-sm w-full transition-all cursor-pointer",
                    selectedPhaseValue === phase.id ? "ring-2 ring-offset-2 ring-blue-500" : "",
                    phase.status === 'in-progress' ? "border-blue-200 bg-blue-50" :
                    phase.status === 'completed' ? "border-green-200 bg-green-50" :
                    "border-gray-200 bg-white hover:bg-gray-50"
                  )}
                  onClick={() => handlePhaseSelect(selectedPhaseValue === phase.id ? null : phase.id)}
                >
                  <div className="flex justify-between mb-2">
                    <h4 className="font-medium">{phase.name}</h4>
                    {getStatusBadge(phase.status)}
                  </div>

                  {phase.description && (
                    <p className="text-sm text-gray-600 mb-4">{phase.description}</p>
                  )}

                  {phase.progress !== undefined && phase.startDate && phase.endDate && (
                    <div className="mb-2">
                      <div className="text-xs text-gray-500 flex justify-between mb-1">
                        <span>{typeof phase.startDate === 'string' ? phase.startDate : phase.startDate.toLocaleDateString()}</span>
                        <span>{typeof phase.endDate === 'string' ? phase.endDate : phase.endDate.toLocaleDateString()}</span>
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
                      <div className="text-xs text-right font-medium mt-1">
                        {phase.progress}% Terminé
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render the appropriate timeline based on viewType
  const timelineContent = viewType === 'vertical'
    ? <VerticalTimelineContent />
    : <HorizontalTimelineContent />;

  // If showCard is true, wrap in a Card component
  if (showCard) {
    return (
      <div className="mb-6">
        <Card>
          {viewType === 'horizontal' && (
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
          )}
          <CardContent className={viewType === 'horizontal' ? '' : 'p-0'}>
            {timelineContent}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Otherwise just return the timeline content
  return (
    <div className="mb-6">
      {timelineContent}
    </div>
  );
};

export default DynamicProgramTimeline;
