import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, BarChart, Users, Target, Check, Trash2 } from "lucide-react";
import { useProgramContext } from "@/context/ProgramContext";
import { format, isValid, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
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
  onDelete?: (id: string) => Promise<void>;
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
  onDelete,
  program,
}) => {
  const { selectedProgramId, setSelectedProgramId } = useProgramContext();
  const [, setLocation] = useLocation();
  const [isDeleting, setIsDeleting] = useState(false);

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    return isValid(date) ? format(date, "dd MMMM yyyy", { locale: fr }) : "Date invalide";
  };

  const handleSelectProgram = () => {
    setSelectedProgramId(id);
    setLocation('/dashboard');
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDelete) return;

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le programme "${name}" ?`)) {
      setIsDeleting(true);
      try {
        await onDelete(id);
      } catch (error) {
        console.error("Error deleting program:", error);
      } finally {
        setIsDeleting(false);
      }
    }
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border border-green-300">Actif</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 border border-blue-300">Terminé</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800 border border-gray-300">Brouillon</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Inconnu</Badge>;
    }
  };

  return (
    <Card className="h-full transition-all hover:shadow-md">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{name}</CardTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge(status)}
            {onDelete && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-500 hover:text-red-700 transition-colors p-1 rounded-full hover:bg-red-50"
                title="Supprimer ce programme"
              >
                {isDeleting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Date de début:</span>
            <span className="font-medium">{formatDate(startDate)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Date de fin:</span>
            <span className="font-medium">{formatDate(endDate)}</span>
          </div>
          <div className="mt-4">
            <span className="text-gray-500 text-sm">Phases:</span>
            <div className="mt-2 space-y-2">
              {phases.map((phase) => (
                <div key={phase.id} className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: phase.color || '#818cf8' }}
                  />
                  <span className="text-sm font-medium">{phase.name}</span>
                  <span className="text-xs text-gray-500">
                    ({format(new Date(phase.startDate), "dd/MM/yyyy")} - {format(new Date(phase.endDate), "dd/MM/yyyy")})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-xs text-gray-500">ID: {id}</div>
        {status === "draft" ? (
          <button
            onClick={handleEditProgram}
            className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
          >
            Modifier
          </button>
        ) : (
          <button
            onClick={handleSelectProgram}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              isSelected
                ? "bg-blue-700 text-white"
                : "text-blue-700 bg-blue-50 hover:bg-blue-100"
            }`}
          >
            {isSelected ? "Sélectionné" : "Sélectionner"}
          </button>
        )}
      </CardFooter>
    </Card>
  );
};

const Programs: React.FC = () => {
  const { programs, selectedProgramId, setSelectedProgramId, deleteProgram, isLoading } = useProgramContext();
  const { user } = useAuth();
  const isMentor = user?.role === 'mentor';

  // Separate backend programs from example programs
  const backendPrograms = programs.filter(program => !isNaN(Number(program.id)));
  const examplePrograms = programs.filter(program => isNaN(Number(program.id)));

  // Filter programs by status
  const draftPrograms = programs.filter(program => program.status === "draft");
  const activePrograms = programs.filter(program => program.status === "active");
  const completedPrograms = programs.filter(program => program.status === "completed");

  // For mentors, we only show programs they're assigned to (already filtered in ProgramContext)

  // Placeholder for startups count
  const getStartupsCount = (programId: string) => {
    // In a real app, this would come from the program data
    return programId === "1" ? 12 : 8;
  };

  // Handle program deletion
  const handleDeleteProgram = async (programId: string) => {
    try {
      const success = await deleteProgram(programId);
      if (success) {
        console.log(`Program deleted with ID: ${programId}`);
      } else {
        console.error(`Failed to delete program with ID: ${programId}`);
      }
    } catch (error) {
      console.error("Error in handleDeleteProgram:", error);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Programmes</h1>
        </div>
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

      <div>
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          </div>
        )}

        {/* Backend Programs Section - without the heading */}
        {backendPrograms.length > 0 && (
          <div className="mb-10">
            {/* Programmes en brouillon - visible uniquement pour les admins */}
            {!isMentor && backendPrograms.filter(p => p.status === "draft").length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Brouillons</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {backendPrograms
                    .filter(program => program.status === "draft")
                    .map((program) => (
                      <ProgramCard
                        key={program.id}
                        id={program.id}
                        name={program.name}
                        description={program.description}
                        startDate={program.startDate}
                        endDate={program.endDate}
                        phases={program.phases || []}
                        status={program.status}
                        onSelect={() => setSelectedProgramId(program.id)}
                        onDelete={handleDeleteProgram}
                        program={program}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Programmes actifs du backend */}
            {backendPrograms.filter(p => p.status === "active").length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Programmes actifs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {backendPrograms
                    .filter(program => program.status === "active")
                    .map((program) => (
                      <ProgramCard
                        key={program.id}
                        id={program.id}
                        name={program.name}
                        description={program.description}
                        startDate={program.startDate}
                        endDate={program.endDate}
                        phases={program.phases || []}
                        status={program.status}
                        onSelect={() => setSelectedProgramId(program.id)}
                        onDelete={handleDeleteProgram}
                        program={program}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Programmes terminés du backend */}
            {backendPrograms.filter(p => p.status === "completed").length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Programmes terminés</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {backendPrograms
                    .filter(program => program.status === "completed")
                    .map((program) => (
                      <ProgramCard
                        key={program.id}
                        id={program.id}
                        name={program.name}
                        description={program.description}
                        startDate={program.startDate}
                        endDate={program.endDate}
                        phases={program.phases || []}
                        status={program.status}
                        onSelect={() => setSelectedProgramId(program.id)}
                        onDelete={handleDeleteProgram}
                        program={program}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Example Programs Section - without the heading */}
        <div className="mb-10">
          {/* Programmes en brouillon - visible uniquement pour les admins */}
          {!isMentor && examplePrograms.filter(p => p.status === "draft").length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Brouillons</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {examplePrograms
                  .filter(program => program.status === "draft")
                  .map((program) => (
                    <ProgramCard
                      key={program.id}
                      id={program.id}
                      name={program.name}
                      description={program.description}
                      startDate={program.startDate}
                      endDate={program.endDate}
                      phases={program.phases || []}
                      status={program.status}
                      onSelect={() => setSelectedProgramId(program.id)}
                      onDelete={handleDeleteProgram}
                      program={program}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Programmes actifs d'exemple */}
          {examplePrograms.filter(p => p.status === "active").length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Programmes actifs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {examplePrograms
                  .filter(program => program.status === "active")
                  .map((program) => (
                    <ProgramCard
                      key={program.id}
                      id={program.id}
                      name={program.name}
                      description={program.description}
                      startDate={program.startDate}
                      endDate={program.endDate}
                      phases={program.phases || []}
                      status={program.status}
                      onSelect={() => setSelectedProgramId(program.id)}
                      onDelete={handleDeleteProgram}
                      program={program}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Programmes terminés d'exemple */}
          {examplePrograms.filter(p => p.status === "completed").length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Programmes terminés</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {examplePrograms
                  .filter(program => program.status === "completed")
                  .map((program) => (
                    <ProgramCard
                      key={program.id}
                      id={program.id}
                      name={program.name}
                      description={program.description}
                      startDate={program.startDate}
                      endDate={program.endDate}
                      phases={program.phases || []}
                      status={program.status}
                      onSelect={() => setSelectedProgramId(program.id)}
                      onDelete={handleDeleteProgram}
                      program={program}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* No programs message */}
          {examplePrograms.length === 0 && backendPrograms.length === 0 && !isLoading && (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-500">Aucun programme trouvé</p>
              {!isMentor && (
                <Link href="/programs/create">
                  <button
                    className="mt-4 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    Créer votre premier programme
                  </button>
                </Link>
              )}
              {isMentor && (
                <p className="mt-4 text-gray-500">Vous n'avez pas encore été invité à participer à un programme.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Programs;
