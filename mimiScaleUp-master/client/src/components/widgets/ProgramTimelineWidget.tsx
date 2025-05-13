import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle, AlertCircle, Milestone } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TimelinePhase {
  id: number | string;
  name: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: 'completed' | 'in-progress' | 'upcoming';
  description: string;
}

interface ProgramTimelineWidgetProps {
  onPhaseSelect?: (phaseId: number | string) => void;
}

const ProgramTimelineWidget: React.FC<ProgramTimelineWidgetProps> = ({ onPhaseSelect }) => {
  const [selectedPhaseId, setSelectedPhaseId] = useState<number | string | null>(null);
  const [phases, setPhases] = useState<TimelinePhase[]>([]);

  // Notify parent component when phase is selected
  const handlePhaseSelect = (phaseId: number | string | null) => {
    setSelectedPhaseId(phaseId);
    if (phaseId !== null && onPhaseSelect) {
      onPhaseSelect(phaseId);
    }
  };

  useEffect(() => {
    // Use default phases since we're not using ProgramContext
    setPhases([
        {
          id: 1,
          name: 'Phase 1',
          startDate: '2024-01-15',
          endDate: '2024-02-15',
          progress: 100,
          status: 'completed',
          description: 'Sélection et validation du projet'
        },
        {
          id: 2,
          name: 'Phase 2',
          startDate: '2024-02-16',
          endDate: '2024-03-15',
          progress: 100,
          status: 'completed',
          description: 'Développement accéléré et recherche de financement'
        },
        {
          id: 3,
          name: 'Phase 3',
          startDate: '2024-03-16',
          endDate: '2024-05-15',
          progress: 65,
          status: 'in-progress',
          description: 'Accompagnement par des mentors experts'
        },
        {
          id: 4,
          name: 'Phase 4',
          startDate: '2024-05-16',
          endDate: '2024-06-30',
          progress: 0,
          status: 'upcoming',
          description: 'Présentation des résultats et perspectives'
        }
      ]);
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
        return <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">Terminé</Badge>;
      case 'in-progress':
        return <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">En cours</Badge>;
      default:
        return <Badge variant="outline" className="border-gray-200 text-gray-500">À venir</Badge>;
    }
  };

  // Function to get the selected phase details
  const getSelectedPhase = () => {
    if (!selectedPhaseId) return null;
    return phases.find(phase => phase.id === selectedPhaseId);
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Chronologie du Programme</h3>
        <Milestone className="h-5 w-5 text-indigo-500" />
      </div>

      {/* Selected Phase Indicator */}
      {selectedPhaseId && getSelectedPhase() && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md flex items-center">
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
      )}

      <div className="relative mt-2 mb-8">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

        {phases.map((phase) => (
          <div key={phase.id} className="relative mb-8 last:mb-0">
            <div className="flex group">
              {/* Timeline node */}
              <div
                className={cn(
                  "absolute z-10 left-4 w-8 h-8 rounded-full flex items-center justify-center -translate-x-1/2 bg-white border-2 cursor-pointer",
                  selectedPhaseId === phase.id ? "ring-2 ring-offset-1 ring-blue-500" : "",
                  phase.status === 'completed' ? "border-green-500" :
                  phase.status === 'in-progress' ? "border-blue-500 animate-pulse" :
                  "border-gray-300"
                )}
                onClick={() => handlePhaseSelect(selectedPhaseId === phase.id ? null : phase.id)}
              >
                {getStatusIcon(phase.status)}
              </div>

              {/* Content card */}
              <div
                className={cn(
                  "ml-8 p-4 rounded-lg border shadow-sm w-full transition-all cursor-pointer",
                  selectedPhaseId === phase.id ? "ring-2 ring-offset-2 ring-blue-500" : "",
                  phase.status === 'in-progress' ? "border-blue-200 bg-blue-50" :
                  phase.status === 'completed' ? "border-green-200 bg-green-50" :
                  "border-gray-200 bg-white hover:bg-gray-50"
                )}
                onClick={() => handlePhaseSelect(selectedPhaseId === phase.id ? null : phase.id)}
              >
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
                  {phase.progress}% Terminé
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