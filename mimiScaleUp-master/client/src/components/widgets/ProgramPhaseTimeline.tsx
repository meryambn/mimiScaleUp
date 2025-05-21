import React, { useEffect } from 'react';
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

// Default phases to use as fallback when no phases are provided
const defaultPhases: Phase[] = [
  {
    id: 1,
    name: 'Phase 1',
    color: '#818cf8',
    status: 'in-progress'
  },
  {
    id: 2,
    name: 'Phase 2',
    color: '#60a5fa',
    status: 'upcoming'
  },
  {
    id: 3,
    name: 'Phase 3',
    color: '#34d399',
    status: 'upcoming'
  }
];

const ProgramPhaseTimeline: React.FC<ProgramPhaseTimelineProps> = ({
  phases,
  selectedPhase,
  onPhaseChange,
  title = "Chronologie des phases du programme",
  description = "Cliquez sur une phase pour filtrer",
  showCard = true
}) => {
  // Debug log
  console.log('ProgramPhaseTimeline received phases:', phases);

  // Use provided phases or fallback to default phases if empty
  const displayPhases = phases && phases.length > 0 ? phases : defaultPhases;

  // Log if we're using fallback phases
  useEffect(() => {
    if (!phases || phases.length === 0) {
      console.log('Using fallback phases in ProgramPhaseTimeline');
    }
  }, [phases]);

  // Calculate width based on phase count
  const width = displayPhases.length > 0 ? `${100 / displayPhases.length}%` : '100%';

  const timelineContent = (
    <div className="flex flex-col space-y-2">
      {/* Phase Timeline Bar */}
      <div className="relative h-12 bg-gray-100 rounded-md overflow-hidden flex">
        {displayPhases.map((phase) => (
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
        style={{ backgroundColor: displayPhases.find(p => p.id === selectedPhase)?.color }}
      ></div>
      <p className="text-sm">
        <span className="font-medium">Filtré par:</span> {displayPhases.find(p => p.id === selectedPhase)?.name} phase
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
