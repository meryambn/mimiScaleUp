import * as React from 'react';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import PhaseDetailView, { PhaseDetails } from './PhaseDetailView';
import { HorizontalTimeline, TimelineStep } from '@/components/ui/horizontal-timeline';

interface ProgramPhaseProps {
  phases: PhaseDetails[];
  onPhasesChange: (phases: PhaseDetails[]) => void;
}

const ProgramPhase: React.FC<ProgramPhaseProps> = ({ phases = [], onPhasesChange }) => {
  const [expandedPhase, setExpandedPhase] = useState<string | null>(phases && phases.length > 0 ? phases[0].id : null);
  const [newPhaseName, setNewPhaseName] = useState('');
  const [newPhaseStartDate, setNewPhaseStartDate] = useState<Date>(new Date());
  const [newPhaseEndDate, setNewPhaseEndDate] = useState<Date>(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // 30 days from now

  const toggleExpandPhase = (phaseId: string) => {
    setExpandedPhase(expandedPhase === phaseId ? null : phaseId);
  };

  const handleAddPhase = () => {
    if (!newPhaseName.trim()) return;

    const newPhase: PhaseDetails = {
      id: `phase-${Date.now()}`, // Simple ID generation for now
      name: newPhaseName,
      description: '',
      startDate: newPhaseStartDate,
      endDate: newPhaseEndDate,
      tasks: [],
      meetings: [],
      evaluationCriteria: [],
      deliverables: [],
      status: 'not_started'
    };

    onPhasesChange([...phases, newPhase]);
    setNewPhaseName('');
    setExpandedPhase(newPhase.id);
  };

  const handleRemovePhase = (phaseId: string) => {
    const updatedPhases = phases.filter(phase => phase.id !== phaseId);
    onPhasesChange(updatedPhases);
    if (expandedPhase === phaseId) {
      setExpandedPhase(updatedPhases.length > 0 ? updatedPhases[0].id : null);
    }
  };

  const handleUpdatePhase = (updatedPhase: PhaseDetails) => {
    const updatedPhases = phases.map(phase =>
      phase.id === updatedPhase.id ? updatedPhase : phase
    );
    onPhasesChange(updatedPhases);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Phases du programme</h2>
        <Button onClick={() => setExpandedPhase(null)}>Tout réduire</Button>
      </div>

      {/* Phase Cards */}
      {/* Horizontal Timeline Display */}
      {Array.isArray(phases) && phases.length > 0 && (
        <div className="mb-6">
          <HorizontalTimeline
            steps={phases.map((phase, index) => ({
              label: phase.name,
              state: expandedPhase === phase.id
                ? 'current'
                : index < phases.findIndex(p => p.id === expandedPhase)
                  ? 'completed'
                  : 'upcoming',
              color: expandedPhase === phase.id
                ? 'bg-primary'
                : index < phases.findIndex(p => p.id === expandedPhase)
                  ? 'bg-green-500'
                  : 'bg-blue-300'
            }))}
          />
        </div>
      )}

      <div className="space-y-4 relative">
        {/* Vertical timeline with dots - keep for visual reference */}
        {Array.isArray(phases) && phases.length > 0 && (
          <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gray-200 z-0">
            {phases.map((phase, index) => (
              <div
                key={`dot-${phase.id}`}
                className={`absolute w-4 h-4 rounded-full z-10 -ml-2 ${
                  expandedPhase === phase.id ? 'bg-blue-500' : 'bg-gray-400'
                }`}
                style={{
                  top: `${(index / (phases.length - 1)) * 100}%`,
                  transform: index === 0 ? 'translateY(24px)' : index === phases.length - 1 ? 'translateY(-24px)' : 'translateY(0)'
                }}
              />
            ))}
          </div>
        )}

        {Array.isArray(phases) && phases.map((phase, index) => (
          <Card
            key={phase.id}
            className={`
              ${expandedPhase === phase.id ? "border-blue-400" : ""}
              relative z-10 transition-all duration-300 hover:shadow-md
              ${expandedPhase === phase.id ? 'shadow-blue-100' : ''}
            `}
          >
            <CardHeader
              className="cursor-pointer flex flex-row justify-between items-center p-4"
              onClick={() => toggleExpandPhase(phase.id)}
            >
              <div className="flex items-center">
                <div className={`
                  flex-shrink-0 w-6 h-6 rounded-full mr-4 flex items-center justify-center
                  ${expandedPhase === phase.id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}
                `}>
                  {index + 1}
                </div>
                <div>
                  <CardTitle>{phase.name}</CardTitle>
                  <CardDescription>
                    {format(phase.startDate, 'MMM d, yyyy')} - {format(phase.endDate, 'MMM d, yyyy')}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemovePhase(phase.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  {expandedPhase === phase.id ?
                    <ChevronUp className="h-4 w-4" /> :
                    <ChevronDown className="h-4 w-4" />
                  }
                </Button>
              </div>
            </CardHeader>

            {expandedPhase === phase.id && (
              <CardContent className="pb-4 ml-10">
                <PhaseDetailView
                  phase={phase}
                  onUpdate={handleUpdatePhase}
                />
              </CardContent>
            )}
          </Card>
        ))}

        {(!phases || !Array.isArray(phases) || phases.length === 0) && (
          <div className="text-center py-8 border border-dashed rounded-md">
            <p className="text-gray-500 mb-2">Aucune phase ajoutée pour l'instant</p>
            <p className="text-sm text-gray-400">Ajoutez des phases pour structurer le calendrier de votre programme</p>
          </div>
        )}
      </div>

      {/* Add New Phase Form */}
      <Card>
        <CardHeader>
          <CardTitle>Ajouter une nouvelle phase</CardTitle>
          <CardDescription>
            Définissez la prochaine phase de votre programme
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom de la phase</label>
            <Input
              value={newPhaseName}
              onChange={(e) => setNewPhaseName(e.target.value)}
              placeholder="ex: Intégration, Formation, Jour de démonstration, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date de début</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newPhaseStartDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newPhaseStartDate ? format(newPhaseStartDate, "PPP") : <span>Choisir une date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newPhaseStartDate}
                    onSelect={(date) => date && setNewPhaseStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Date de fin</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newPhaseEndDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newPhaseEndDate ? format(newPhaseEndDate, "PPP") : <span>Choisir une date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newPhaseEndDate}
                    onSelect={(date) => date && setNewPhaseEndDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={handleAddPhase}
            disabled={!newPhaseName.trim()}
          >
            <Plus className="mr-2 h-4 w-4" /> Ajouter une phase
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ProgramPhase;