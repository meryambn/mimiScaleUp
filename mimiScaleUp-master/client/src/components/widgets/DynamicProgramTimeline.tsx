import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle, AlertCircle, Milestone } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useProgrammePhases } from '@/hooks/useProgrammePhases';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

// Define the phase interface that works for both timeline styles
interface TimelinePhase {
  id: number;
  nom: string;
  date_debut: string;
  date_fin: string;
  description: string;
  programme_id: number;
  gagnant: boolean;
  status?: 'completed' | 'in-progress' | 'upcoming';
  progress?: number;
}

interface DynamicProgramTimelineProps {
  onPhaseSelect?: (phaseId: number | string) => void;
  selectedPhase?: number | string | null;
  title?: string;
  description?: string;
  showCard?: boolean;
  viewType?: 'vertical' | 'horizontal';
}

const DynamicProgramTimeline: React.FC<DynamicProgramTimelineProps> = ({
  onPhaseSelect,
  selectedPhase: externalSelectedPhase,
  title = "Chronologie du Programme",
  description = "Cliquez sur une phase pour filtrer",
  showCard = true,
  viewType = 'vertical'
}) => {
  const [internalSelectedPhase, setInternalSelectedPhase] = useState<number | string | null>(null);
  const { phases, loading, error } = useProgrammePhases();

  // Determine if we're using external or internal state for selected phase
  const selectedPhaseValue = externalSelectedPhase !== undefined ? externalSelectedPhase : internalSelectedPhase;
  
  // Notify parent component when phase is selected
  const handlePhaseSelect = (phaseId: number | string | null) => {
    // Update internal state
    setInternalSelectedPhase(phaseId);
    
    // Notify parent component
    if (phaseId !== null && onPhaseSelect) {
      onPhaseSelect(phaseId);
    }
  };

  // Get the selected phase object
  const getSelectedPhase = () => {
    return phases.find(phase => phase.id === selectedPhaseValue);
  };

  // Calculate phase status and progress
  const calculatePhaseStatus = (phase: TimelinePhase) => {
    const now = new Date();
    const startDate = new Date(phase.date_debut);
    const endDate = new Date(phase.date_fin);

    if (now > endDate) {
      return { status: 'completed' as const, progress: 100 };
    } else if (now >= startDate && now <= endDate) {
      const totalDuration = endDate.getTime() - startDate.getTime();
      const elapsedDuration = now.getTime() - startDate.getTime();
      const progress = Math.min(Math.round((elapsedDuration / totalDuration) * 100), 100);
      return { status: 'in-progress' as const, progress };
    } else {
      return { status: 'upcoming' as const, progress: 0 };
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <p>Erreur: {error}</p>
      </div>
    );
  }

  if (!phases.length) {
    return (
      <div className="p-4 text-gray-500">
        <p>Aucune phase disponible</p>
      </div>
    );
  }

  // Selected phase indicator component
  const SelectedPhaseIndicator = () => {
    if (!selectedPhaseValue || !getSelectedPhase()) return null;
    
    const selectedPhase = getSelectedPhase();
    const { status } = calculatePhaseStatus(selectedPhase!);
    
    return (
      <div className="mt-2 p-3 bg-blue-50 rounded-md flex items-center">
        <div
          className={cn(
            "w-3 h-3 rounded-full mr-2",
            status === 'completed' ? "bg-green-500" :
            status === 'in-progress' ? "bg-blue-500" :
            "bg-gray-400"
          )}
        ></div>
        <p className="text-sm">
          <span className="font-medium">Phase sélectionnée:</span> {selectedPhase?.nom}
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
          {phases.map((phase) => {
            const { status } = calculatePhaseStatus(phase);
            return (
              <div
                key={phase.id}
                className={`h-full cursor-pointer hover:opacity-90 flex items-center justify-center
                  ${selectedPhaseValue === phase.id ? 'ring-2 ring-offset-2 ring-offset-white ring-blue-500 z-10' : ''}
                `}
                style={{
                  width,
                  backgroundColor: getStatusColor(status),
                  opacity: status === 'upcoming' ? 0.5 : 1
                }}
                onClick={() => handlePhaseSelect(selectedPhaseValue === phase.id ? null : phase.id)}
              >
                <span className="text-white font-medium text-sm">
                  {phase.nom}
                </span>
              </div>
            );
          })}
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

          {phases.map((phase) => {
            const { status, progress } = calculatePhaseStatus(phase);
            return (
              <div key={phase.id} className="relative mb-8 last:mb-0">
                <div className="flex group">
                  {/* Timeline node */}
                  <div
                    className={cn(
                      "absolute z-10 left-4 w-8 h-8 rounded-full flex items-center justify-center -translate-x-1/2 bg-white border-2 cursor-pointer",
                      selectedPhaseValue === phase.id ? "ring-2 ring-offset-1 ring-blue-500" : "",
                      status === 'completed' ? "border-green-500" :
                      status === 'in-progress' ? "border-blue-500 animate-pulse" :
                      "border-gray-300"
                    )}
                    onClick={() => handlePhaseSelect(selectedPhaseValue === phase.id ? null : phase.id)}
                  >
                    {getStatusIcon(status)}
                  </div>

                  {/* Content card */}
                  <div
                    className={cn(
                      "ml-8 p-4 rounded-lg border shadow-sm w-full transition-all cursor-pointer",
                      selectedPhaseValue === phase.id ? "ring-2 ring-offset-2 ring-blue-500" : "",
                      status === 'in-progress' ? "border-blue-200 bg-blue-50" :
                      status === 'completed' ? "border-green-200 bg-green-50" :
                      "border-gray-200 bg-white hover:bg-gray-50"
                    )}
                    onClick={() => handlePhaseSelect(selectedPhaseValue === phase.id ? null : phase.id)}
                  >
                    <div className="flex justify-between mb-2">
                      <h4 className="font-medium">{phase.nom}</h4>
                      {getStatusBadge(status)}
                    </div>

                    {phase.description && (
                      <p className="text-sm text-gray-600 mb-4">{phase.description}</p>
                    )}

                    <div className="mb-2">
                      <div className="text-xs text-gray-500 flex justify-between mb-1">
                        <span>{new Date(phase.date_debut).toLocaleDateString()}</span>
                        <span>{new Date(phase.date_fin).toLocaleDateString()}</span>
                      </div>
                      <Progress
                        value={progress}
                        className={cn(
                          "h-2 bg-gray-100",
                          status === 'completed' ? "[&>div]:bg-green-500" :
                          status === 'in-progress' ? "[&>div]:bg-blue-500" :
                          "[&>div]:bg-gray-300"
                        )}
                      />
                      <div className="text-xs text-right font-medium mt-1">
                        {progress}% Terminé
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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
