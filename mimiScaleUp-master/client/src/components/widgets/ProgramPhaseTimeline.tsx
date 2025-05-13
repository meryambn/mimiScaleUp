import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

interface Phase {
  id: number | string;
  name: string;
  color: string;
  status?: 'completed' | 'in-progress' | 'upcoming' | 'not_started';
}

interface ProgramPhaseTimelineProps {
  phases: Phase[];
  selectedPhase: number | string | null;
  onPhaseChange: (phaseId: number | string | null) => void;
  title?: string;
  description?: string;
  showCard?: boolean;
}

const ProgramPhaseTimeline: React.FC<ProgramPhaseTimelineProps> = ({
  phases,
  selectedPhase,
  onPhaseChange,
  title = "Chronologie des phases du programme",
  description = "Cliquez sur une phase pour filtrer",
  showCard = true
}) => {
  // Calculate width based on phase count
  const width = `${100 / phases.length}%`;

  const timelineContent = (
    <div className="flex flex-col space-y-2">
      {/* Phase Timeline Bar */}
      <div className="relative h-12 bg-gray-100 rounded-md overflow-hidden flex">
        {phases.map((phase) => (
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
            onClick={() => onPhaseChange(selectedPhase === phase.id ? null : phase.id)}
          >
            <span className="text-white font-medium text-sm">
              {phase.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  // Display selected phase indicator if a phase is selected
  const selectedPhaseIndicator = selectedPhase && (
    <div className="mt-4 p-3 bg-blue-50 rounded-md flex items-center">
      <div
        className="w-3 h-3 rounded-full mr-2"
        style={{ backgroundColor: phases.find(p => p.id === selectedPhase)?.color }}
      ></div>
      <p className="text-sm">
        <span className="font-medium">Filtré par:</span> {phases.find(p => p.id === selectedPhase)?.name} phase
      </p>
      <button
        className="ml-auto"
        onClick={(e) => {
          e.stopPropagation();
          onPhaseChange(null);
        }}
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

  // If showCard is true, wrap in a Card component
  if (showCard) {
    return (
      <div className="mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            {timelineContent}
            {selectedPhaseIndicator}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Otherwise just return the timeline content
  return (
    <div className="mb-6">
      {timelineContent}
      {selectedPhaseIndicator}
    </div>
  );
};

export default ProgramPhaseTimeline;
