import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useProgramContext } from '@/context/ProgramContext';

interface ProgramDetailsWidgetProps {
  standalone?: boolean;
  isStartupInterface?: boolean;
  submissionProgram?: any;
  programId?: string | number;
}

const ProgramDetailsWidget: React.FC<ProgramDetailsWidgetProps> = ({
  standalone = false,
  isStartupInterface = false,
  submissionProgram = null,
  programId = null
}) => {
  const { selectedProgram } = useProgramContext();

  // Priority: 1. submissionProgram (passed from Dashboard), 2. selectedProgram (from context), 3. default program
  let programToDisplay = submissionProgram || selectedProgram || {
    name: "Programme ScaleUp 2024",
    description: "Programme d'accélération pour les startups innovantes dans le domaine de la technologie",
    startDate: "2024-01-15",
    endDate: "2024-12-15",
    phases: [
      { id: "1", name: "Phase 1", startDate: "2024-01-15", endDate: "2024-03-15" },
      { id: "2", name: "Phase 2", startDate: "2024-03-16", endDate: "2024-06-15" },
      { id: "3", name: "Phase 3", startDate: "2024-06-16", endDate: "2024-09-15" },
      { id: "4", name: "Phase 4", startDate: "2024-09-16", endDate: "2024-12-15" }
    ]
  };

  // Format date function to get only the date part
  const formatDateString = (dateStr) => {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    // If it's already just a date (YYYY-MM-DD), return it
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    // Otherwise, extract the date part from the timestamp
    return dateStr.split('T')[0];
  };

  // Handle case where program data might have different property names (nom instead of name)
  if (programToDisplay) {
    programToDisplay = {
      ...programToDisplay,
      name: programToDisplay.nom || programToDisplay.name || 'Programme sans nom',
      description: programToDisplay.description || '',
      startDate: formatDateString(programToDisplay.date_debut || programToDisplay.startDate),
      endDate: formatDateString(programToDisplay.date_fin || programToDisplay.endDate)
    };
  }

  // Log the program data for debugging
  console.log('ProgramDetailsWidget - submissionProgram:', submissionProgram ? {
    id: submissionProgram.id,
    name: submissionProgram.name,
    description: submissionProgram.description,
    startDate: submissionProgram.startDate,
    endDate: submissionProgram.endDate,
    phasesCount: submissionProgram.phases ? submissionProgram.phases.length : 0,
    resourcesCount: submissionProgram.resources ? submissionProgram.resources.length : 0
  } : null);

  console.log('ProgramDetailsWidget - selectedProgram:', selectedProgram ? {
    id: selectedProgram.id,
    name: selectedProgram.name,
    description: selectedProgram.description,
    startDate: selectedProgram.startDate,
    endDate: selectedProgram.endDate,
    phasesCount: selectedProgram.phases ? selectedProgram.phases.length : 0
  } : null);

  console.log('ProgramDetailsWidget - programToDisplay:', {
    id: programToDisplay.id,
    name: programToDisplay.name,
    description: programToDisplay.description,
    startDate: programToDisplay.startDate,
    endDate: programToDisplay.endDate,
    phasesCount: programToDisplay.phases ? programToDisplay.phases.length : 0
  });

  if (!programToDisplay && !isStartupInterface) {
    return (
      <Card className={standalone ? "mb-6" : ""}>
        <CardHeader>
          <CardTitle>Détails du Programme</CardTitle>
          <CardDescription>Aucun programme sélectionné</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Veuillez sélectionner un programme pour voir ses détails.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={standalone ? "mb-6" : ""}>
      <CardHeader>
        <CardTitle>{programToDisplay.name}</CardTitle>
        <CardDescription>{programToDisplay.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Date de début</p>
            <p>{new Date(programToDisplay.startDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Date de fin</p>
            <p>{new Date(programToDisplay.endDate).toLocaleDateString()}</p>
          </div>

          {/* Only show status for admin interface */}
          {!isStartupInterface && programToDisplay.status && (
            <div>
              <p className="text-sm font-medium text-gray-500">Statut</p>
              <div className="flex items-center space-x-2 mt-1">
                <div className={`
                  px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${programToDisplay.status === "draft"
                    ? "bg-gray-100 text-gray-800 border border-gray-300"
                    : programToDisplay.status === "active"
                      ? "bg-green-100 text-green-800 border border-green-300"
                      : "bg-blue-100 text-blue-800 border border-blue-300"}
                `}>
                  {programToDisplay.status === "active" ? "Actif" : programToDisplay.status === "draft" ? "Brouillon" : "Terminé"}
                </div>
              </div>
            </div>
          )}
        </div>

        {programToDisplay.phases && programToDisplay.phases.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-500 mb-2">Phases</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {programToDisplay.phases.map((phase) => {
                // Handle case where phase data might have different property names (nom instead of name)
                const phaseName = phase.name || phase.nom || 'Phase sans nom';
                const phaseStartDate = formatDateString(phase.startDate || phase.date_debut);
                const phaseEndDate = formatDateString(phase.endDate || phase.date_fin);

                return (
                  <div key={phase.id} className="text-sm">
                    <span className="font-medium">{phaseName}</span>
                    <span className="text-gray-500 ml-2">
                      {new Date(phaseStartDate).toLocaleDateString()} - {new Date(phaseEndDate).toLocaleDateString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProgramDetailsWidget;
