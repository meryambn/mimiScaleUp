import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useProgramContext } from '@/context/ProgramContext';

interface ProgramDetailsWidgetProps {
  standalone?: boolean;
  isStartupInterface?: boolean;
}

const ProgramDetailsWidget: React.FC<ProgramDetailsWidgetProps> = ({
  standalone = false,
  isStartupInterface = false
}) => {
  const { selectedProgram } = useProgramContext();

  // Mock program data for startup interface
  const mockProgram = {
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

  // For startup interface, always use the mock program
  const programToDisplay = isStartupInterface ? mockProgram : selectedProgram;

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
              {programToDisplay.phases.map((phase) => (
                <div key={phase.id} className="text-sm">
                  <span className="font-medium">{phase.name}</span>
                  <span className="text-gray-500 ml-2">
                    {new Date(phase.startDate).toLocaleDateString()} - {new Date(phase.endDate).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProgramDetailsWidget;
