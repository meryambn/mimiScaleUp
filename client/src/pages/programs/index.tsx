import React from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, BarChart, Users, Target, Check } from "lucide-react";
import { useProgramContext } from "@/context/ProgramContext";
import { format, isValid, parseISO } from "date-fns";
import { Program, Phase } from "@/types/program";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface ProgramCardProps {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  phases: Phase[];
  status: "draft" | "active" | "completed";
  onSelect: () => void;
  program?: any; // Programme complet pour l'édition
}

const ProgramCard: React.FC<ProgramCardProps> = ({
  id,
  name,
  description,
  startDate,
  endDate,
  phases,
  status,
  onSelect,
  program,
}) => {
  const { selectedProgramId, setSelectedProgramId } = useProgramContext();
  const [, setLocation] = useLocation();

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    return isValid(date) ? format(date, "PPP") : "Invalid date";
  };

  const handleSelectProgram = () => {
    setSelectedProgramId(id);
    setLocation('/dashboard');
  };

  // Fonction pour éditer un programme en brouillon
  const handleEditProgram = () => {
    // Stocker les détails du programme dans le localStorage pour les récupérer dans la page de création
    if (program) {
      // Stocker directement le programme sans modifications
      localStorage.setItem('editingProgram', JSON.stringify(program));
    }
    // Rediriger vers la page de création de programme
    setLocation('/programs/create');
  };

  const isSelected = selectedProgramId === id;

  return (
    <Card className={cn(
      "h-full flex flex-col transition-colors",
      isSelected && "border-primary bg-primary/5"
    )}>
      <CardContent className="flex-grow p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium text-gray-900">{name}</h3>
            {isSelected && <Check className="h-5 w-5 text-primary" />}
          </div>
          <Badge variant={status === "draft" ? "outline" : status === "active" ? "default" : "secondary"}>
            {status === "draft" ? "Brouillon" : status === "active" ? "Actif" : "Terminé"}
          </Badge>
        </div>
        <p className="text-sm text-gray-500 mb-4">{description}</p>
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="mr-2 h-4 w-4" />
            <span>
              {startDate && endDate ? (
                `${formatDate(startDate)} - ${formatDate(endDate)}`
              ) : (
                "No dates set"
              )}
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <BarChart className="mr-2 h-4 w-4" />
            <span>{phases.length} Phases</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-6 pt-0">
        {status === "draft" ? (
          <button
            className="w-full"
            onClick={handleEditProgram}
            style={{ backgroundColor: 'white', color: '#0c4c80', border: '1px solid #e5e7eb', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
          >
            Modifier
          </button>
        ) : (
          <button
            className="w-full"
            onClick={handleSelectProgram}
            style={{
              backgroundColor: isSelected ? '#0c4c80' : 'white',
              color: isSelected ? 'white' : '#0c4c80',
              border: '1px solid #e5e7eb',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {isSelected ? "Sélectionné" : "Sélectionner"}
          </button>
        )}
      </CardFooter>
    </Card>
  );
};

const Programs: React.FC = () => {
  const { programs, selectedProgramId, setSelectedProgramId } = useProgramContext();
  const { user } = useAuth();
  const isMentor = user?.role === 'mentor';

  // Filter programs by status
  const draftPrograms = programs.filter(program => program.status === "draft");
  const activePrograms = programs.filter(program => program.status === "active");
  const completedPrograms = programs.filter(program => program.status === "completed");

  // Placeholder for startups count
  const getStartupsCount = (programId: string) => {
    // In a real app, this would come from the program data
    return programId === "1" ? 12 : 8;
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Programmes</h1>
          {!isMentor && (
            <Link href="/programs/create">
              <button
                style={{ background: 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)', color: 'white', display: 'flex', alignItems: 'center', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', border: 'none' }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nouveau programme
              </button>
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-5">
        {/* Programmes en brouillon - visible uniquement pour les admins */}
        {!isMentor && (
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Brouillons</h2>
            {draftPrograms.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-gray-500">Aucun programme en brouillon</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {draftPrograms.map((program) => (
                  <ProgramCard
                    key={program.id}
                    id={program.id}
                    name={program.name}
                    description={program.description}
                    startDate={new Date(program.startDate).toLocaleDateString()}
                    endDate={new Date(program.endDate).toLocaleDateString()}
                    phases={program.phases || []}
                    status={program.status}
                    onSelect={() => setSelectedProgramId(program.id)}
                    program={program}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Programmes actifs */}
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Programmes actifs</h2>
          {activePrograms.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-500">Aucun programme actif trouvé</p>
              {draftPrograms.length === 0 && (
                <Link href="/programs/create">
                  <button
                    className="mt-4"
                    style={{ backgroundColor: 'white', color: '#0c4c80', border: '1px solid #e5e7eb', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Créer votre premier programme
                  </button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activePrograms.map((program) => (
                <ProgramCard
                  key={program.id}
                  id={program.id}
                  name={program.name}
                  description={program.description}
                  startDate={new Date(program.startDate).toLocaleDateString()}
                  endDate={new Date(program.endDate).toLocaleDateString()}
                  phases={program.phases || []}
                  status={program.status}
                  onSelect={() => setSelectedProgramId(program.id)}
                  program={program}
                />
              ))}
            </div>
          )}
        </div>

        {/* Programmes terminés */}
        {completedPrograms.length > 0 && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Programmes terminés</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {completedPrograms.map((program) => (
                <ProgramCard
                  key={program.id}
                  id={program.id}
                  name={program.name}
                  description={program.description}
                  startDate={new Date(program.startDate).toLocaleDateString()}
                  endDate={new Date(program.endDate).toLocaleDateString()}
                  phases={program.phases || []}
                  status={program.status}
                  onSelect={() => setSelectedProgramId(program.id)}
                  program={program}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Programs;
