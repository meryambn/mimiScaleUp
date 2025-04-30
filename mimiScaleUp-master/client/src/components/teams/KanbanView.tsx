import React, { useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MessageSquare, ArrowRight, ArrowLeft, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProgramContext } from '@/context/ProgramContext';
import WinnerDialog from "@/components/teams/WinnerDialog";

// Types
interface Team {
  id: number | string;
  name: string;
  logo?: string;
  industry?: string;
  currentPhase: string;
  progress: number;
  status: string;
  description?: string;
}

interface KanbanPhase {
  id: string;
  name: string;
  description: string;
  color: string;
}

interface KanbanViewProps {
  teams: Team[];
  onPhaseChange?: (teamId: number | string, newPhase: string) => void;
  onSelectWinner?: (teamId: number | string) => void;
}

// Couleurs de secours pour les phases sans couleur définie
const fallbackColors = [
  '#818cf8', // Indigo
  '#60a5fa', // Blue
  '#34d399', // Emerald
  '#fbbf24', // Amber
  '#f87171', // Red
  '#a78bfa', // Purple
  '#ec4899', // Pink
  '#14b8a6', // Teal
];

import { useLocation } from 'wouter';

// Interface pour les props de TeamCard
interface TeamCardProps {
  team: Team;
  phaseIndex: number;
  onMoveTeam: (teamId: number | string, newPhaseIndex: number) => void;
  phasesCount: number;
  isLastPhase: boolean;
  hasWinner: boolean;
  onSelectWinner?: (teamId: number | string) => void;
}

// Composant pour une carte d'équipe
const TeamCard: React.FC<TeamCardProps> = ({ team, phaseIndex, onMoveTeam, phasesCount, isLastPhase, hasWinner, onSelectWinner }) => {
  const [, setLocation] = useLocation(); // Add this line to use wouter's navigation
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'TEAM',
    item: { id: team.id, currentPhaseIndex: phaseIndex },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    })
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'at_risk':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card
      ref={drag}
      className={`mb-3 cursor-move hover:shadow-md transition-shadow ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      <CardHeader className="p-3 pb-0 flex flex-row items-center space-x-2">
        {team.logo ? (
          <img
            src={team.logo}
            alt={`${team.name} logo`}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
            {team.name.charAt(0)}
          </div>
        )}
        <div className="flex-1">
          <CardTitle className="text-sm font-medium">{team.name}</CardTitle>
          {team.industry && (
            <p className="text-xs text-gray-500">{team.industry}</p>
          )}
        </div>
        <div className="flex space-x-1">
          {team.status === 'completed' && (
            <Badge className="bg-amber-100 text-amber-800">
              <Trophy className="h-3 w-3 mr-1" />
              GAGNANT
            </Badge>
          )}
          <Badge className={getStatusColor(team.status)}>
            {team.status === 'active' ? 'ACTIF' : team.status === 'at_risk' ? 'EN RISQUE' : 'COMPLÉTÉ'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="text-xs text-gray-500 mb-1">
            Phase actuelle: <span className="font-medium text-gray-700">{team.currentPhase || 'Non définie'}</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Progression</span>
              <span>{team.progress}%</span>
            </div>
            <Progress value={team.progress} className="h-1" />
          </div>

          {team.description && (
            <div className="text-xs text-gray-600 mt-2 line-clamp-2">
              {team.description}
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button
              className="h-7 px-2"
              onClick={() => onMoveTeam(team.id, phaseIndex - 1)}
              disabled={phaseIndex === 0}
              style={{ backgroundColor: 'transparent', color: '#0c4c80', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: phaseIndex === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.875rem', opacity: phaseIndex === 0 ? '0.5' : '1' }}
            >
              <ArrowLeft className="h-3 w-3 mr-1" />
              Retour
            </button>
            <button
              className="h-7 px-2"
              onClick={(e) => {
                e.stopPropagation(); // Prevent drag event
                console.log(`Navigating to team detail from kanban: /teams/${team.id}`);
                setLocation(`/teams/${team.id}`);
              }}
              style={{ backgroundColor: 'transparent', color: '#0c4c80', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.875rem' }}
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              Détails
            </button>
            <button
              className="h-7 px-2"
              onClick={() => onMoveTeam(team.id, phaseIndex + 1)}
              disabled={phaseIndex === phasesCount - 1}
              style={{ backgroundColor: 'transparent', color: '#0c4c80', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: phaseIndex === phasesCount - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.875rem', opacity: phaseIndex === phasesCount - 1 ? '0.5' : '1' }}
            >
              Avancer
              <ArrowRight className="h-3 w-3 ml-1" />
            </button>
          </div>

          {isLastPhase && hasWinner && team.status !== 'completed' && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <button
                className="w-full h-7"
                onClick={() => onSelectWinner && onSelectWinner(team.id)}
                style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #f59e0b', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', width: '100%' }}
              >
                <Trophy className="h-3 w-3 mr-1" />
                Sélectionner comme gagnant
              </button>
            </div>
          )}
          {isLastPhase && hasWinner && team.status === 'completed' && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <button
                className="w-full h-7"
                disabled
                style={{ backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #22c55e', padding: '4px 8px', borderRadius: '4px', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', width: '100%', opacity: '0.7' }}
              >
                <Trophy className="h-3 w-3 mr-1" />
                Gagnant sélectionné
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Interface pour les props de PhaseColumn
interface PhaseColumnProps {
  phase: KanbanPhase;
  teams: Team[];
  phaseIndex: number;
  onMoveTeam: (teamId: number | string, newPhaseIndex: number) => void;
  phasesCount: number;
  isLastPhase: boolean;
  hasWinner: boolean;
  onSelectWinner?: (teamId: number | string) => void;
}

// Composant pour une colonne de phase
const PhaseColumn: React.FC<PhaseColumnProps> = ({ phase, teams, phaseIndex, onMoveTeam, phasesCount, isLastPhase, hasWinner, onSelectWinner }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'TEAM',
    drop: (item: { id: number | string, currentPhaseIndex: number }) => {
      if (item.currentPhaseIndex !== phaseIndex) {
        onMoveTeam(item.id, phaseIndex);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    })
  }));

  return (
    <div
      ref={drop}
      className={`flex-1 min-w-[280px] p-3 rounded-lg ${isOver ? 'bg-gray-100' : 'bg-gray-50'}`}
      style={{ borderTop: `3px solid ${phase.color}` }}
    >
      <div className="mb-3">
        <h3 className="font-medium text-sm" style={{ color: phase.color }}>{phase.name}</h3>
        <p className="text-xs text-gray-500">{phase.description}</p>
        <div className="flex items-center mt-2">
          <span className="text-xs text-gray-400 mr-1">Équipes:</span>
          <span className="text-xs font-medium">{teams.length}</span>
        </div>
      </div>
      <div className="space-y-2">
        {teams.map((team: Team) => (
          <TeamCard
            key={team.id}
            team={team}
            phaseIndex={phaseIndex}
            onMoveTeam={onMoveTeam}
            phasesCount={phasesCount}
            isLastPhase={isLastPhase}
            hasWinner={hasWinner}
            onSelectWinner={onSelectWinner}

          />
        ))}
        {teams.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-400 italic">
            Aucune équipe dans cette phase
          </div>
        )}
      </div>
    </div>
  );
};

// Composant principal Kanban
const KanbanView: React.FC<KanbanViewProps> = ({ teams, onPhaseChange, onSelectWinner }) => {
  const { toast } = useToast();
  const { selectedProgram } = useProgramContext();
  const [localTeams, setLocalTeams] = useState<Team[]>(teams);
  const [winnerDialogOpen, setWinnerDialogOpen] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<Team | null>(null);

  // Mettre à jour les équipes locales lorsque les équipes changent
  React.useEffect(() => {
    setLocalTeams(teams);
  }, [teams]);

  // Écouter les événements de changement de phase
  React.useEffect(() => {
    const handlePhaseChange = (event: CustomEvent) => {
      const { teamId, newPhase } = event.detail;

      console.log(`KanbanView: Événement team-phase-changed reçu pour l'équipe ${teamId} vers la phase ${newPhase}`);

      // Mettre à jour l'équipe locale immédiatement
      setLocalTeams(prevTeams => {
        const updatedTeams = prevTeams.map(team => {
          if (String(team.id) === String(teamId)) {
            console.log(`KanbanView: Mise à jour de l'équipe ${team.name} de ${team.currentPhase} à ${newPhase}`);
            return { ...team, currentPhase: newPhase };
          }
          return team;
        });
        return updatedTeams;
      });
    };

    // Écouter les événements de stockage (pour la synchronisation entre les onglets)
    const handleStorageChange = () => {
      console.log('KanbanView: Changement de stockage détecté, mise à jour des équipes');
      try {
        const storedStartups = localStorage.getItem('startups');
        if (storedStartups) {
          const parsedStartups = JSON.parse(storedStartups);
          if (Array.isArray(parsedStartups)) {
            // Mettre à jour les équipes locales avec les données du localStorage
            setLocalTeams(prevTeams => {
              const updatedTeams = prevTeams.map(team => {
                const storedTeam = parsedStartups.find(s => String(s.id) === String(team.id));
                if (storedTeam) {
                  console.log(`KanbanView: Mise à jour de l'équipe ${team.name} depuis localStorage`);
                  return { ...team, ...storedTeam };
                }
                return team;
              });
              return updatedTeams;
            });

            // Ne pas forcer un rafraîchissement de la page pour éviter les rechargements
          }
        }
      } catch (error) {
        console.error("Error refreshing teams from localStorage:", error);
      }
    };

    // Ajouter les écouteurs d'événements
    document.addEventListener('team-phase-changed', handlePhaseChange as EventListener);
    window.addEventListener('storage', handleStorageChange);

    // Nettoyer les écouteurs d'événements lors du démontage
    return () => {
      document.removeEventListener('team-phase-changed', handlePhaseChange as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Forcer une mise à jour des équipes depuis localStorage au montage
  React.useEffect(() => {
    try {
      const storedStartups = localStorage.getItem('startups');
      if (storedStartups) {
        const parsedStartups = JSON.parse(storedStartups);
        if (Array.isArray(parsedStartups)) {
          // Mettre à jour les équipes locales avec les données du localStorage
          const updatedTeams = teams.map(team => {
            const storedTeam = parsedStartups.find(s => String(s.id) === String(team.id));
            if (storedTeam) {
              console.log(`KanbanView: Initialisation de l'équipe ${team.name} depuis localStorage`);
              return { ...team, ...storedTeam };
            }
            return team;
          });
          setLocalTeams(updatedTeams);
        }
      }
    } catch (error) {
      console.error("Error refreshing teams from localStorage:", error);
    }
  }, [teams]);

  // Convertir les phases du programme en phases Kanban
  const programPhases = selectedProgram?.phases || [];

  // Créer les phases Kanban à partir des phases du programme
  const kanbanPhases: KanbanPhase[] = programPhases.map((phase, index) => ({
    id: phase.id,
    name: phase.name,
    description: phase.description,
    color: phase.color || fallbackColors[index % fallbackColors.length]
  }));

  // Ajouter une phase "Non assigné" si aucune phase n'est définie
  const phases = kanbanPhases.length > 0 ? kanbanPhases : [
    {
      id: 'unassigned',
      name: 'Non assigné',
      description: 'Équipes sans phase assignée',
      color: fallbackColors[0]
    }
  ];

  // Fonction pour déplacer une équipe vers une nouvelle phase
  const handleMoveTeam = (teamId: number | string, newPhaseIndex: number) => {
    if (newPhaseIndex < 0 || newPhaseIndex >= phases.length) return;

    const newPhase = phases[newPhaseIndex].name;

    // Mettre à jour l'état local
    setLocalTeams(prevTeams =>
      prevTeams.map(team =>
        team.id === teamId
          ? { ...team, currentPhase: newPhase }
          : team
      )
    );

    // Appeler le callback si fourni
    if (onPhaseChange) {
      onPhaseChange(teamId, newPhase);
    }
  };

  // Fonction pour déterminer la phase d'une équipe
  const getTeamPhase = (team: Team) => {
    if (!team.currentPhase) return phases[0]?.id || 'unassigned';

    // Essayer de trouver une correspondance exacte avec le nom de la phase
    const exactMatch = phases.find(phase =>
      phase.name.toLowerCase() === team.currentPhase.toLowerCase()
    );
    if (exactMatch) return exactMatch.id;

    // Essayer de trouver une correspondance partielle avec le nom de la phase
    const partialMatch = phases.find(phase =>
      team.currentPhase.toLowerCase().includes(phase.name.toLowerCase()) ||
      phase.name.toLowerCase().includes(team.currentPhase.toLowerCase())
    );
    if (partialMatch) return partialMatch.id;

    // Vérifier si la phase contient un numéro (ex: "Phase 2")
    const phaseNumberMatch = team.currentPhase.match(/phase\s*(\d+)/i);
    if (phaseNumberMatch && phaseNumberMatch[1]) {
      const phaseNumber = parseInt(phaseNumberMatch[1], 10) - 1; // -1 car les indices commencent à 0
      if (phaseNumber >= 0 && phaseNumber < phases.length) {
        return phases[phaseNumber].id;
      }
    }

    // Afficher un avertissement pour le débogage
    console.warn(`Phase non trouvée pour l'équipe ${team.name}: ${team.currentPhase}`);
    console.warn('Phases disponibles:', phases.map(p => p.name));

    // Par défaut, mettre dans la première phase
    return phases[0]?.id || 'unassigned';
  };

  // Fonction pour gérer la sélection d'un gagnant
  const handleSelectWinner = (teamId: number | string) => {
    // Trouver l'équipe sélectionnée
    const team = localTeams.find(t => t.id === teamId);
    if (!team) return;

    // Mettre à jour l'état local
    setLocalTeams(prevTeams =>
      prevTeams.map(t =>
        t.id === teamId
          ? { ...t, status: 'completed' }
          : t
      )
    );

    // Stocker l'équipe sélectionnée pour le dialogue
    setSelectedWinner(team);

    // Ouvrir le dialogue de félicitations
    setWinnerDialogOpen(true);

    // Appeler le callback si fourni
    if (onSelectWinner) {
      onSelectWinner(teamId);
    }

    // Mettre à jour le statut de l'équipe dans localStorage
    try {
      const storedStartups = localStorage.getItem('startups');
      if (storedStartups) {
        const parsedStartups = JSON.parse(storedStartups);
        if (Array.isArray(parsedStartups)) {
          const updatedStartups = parsedStartups.map(s =>
            String(s.id) === String(teamId) ? { ...s, status: 'completed' } : s
          );
          localStorage.setItem('startups', JSON.stringify(updatedStartups));
        }
      }

      // Afficher une notification
      toast({
        title: "Gagnant sélectionné",
        description: `${team.name} a été sélectionné comme gagnant du programme.`,
      });
    } catch (error) {
      console.error("Error updating startup in localStorage:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sélection du gagnant.",
        variant: "destructive"
      });
    }
  };

  // Organiser les équipes par phase
  const teamsByPhase = phases.map(phase => ({
    ...phase,
    teams: localTeams.filter(team => getTeamPhase(team) === phase.id)
  }));

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col">
        {phases.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Aucune phase définie dans ce programme.</p>
          </div>
        ) : (
          <div className="flex overflow-x-auto gap-4 pb-4 min-h-[70vh]">
            {teamsByPhase.map((phase, index) => {
              // Vérifier si c'est la dernière phase et si elle a un gagnant
              const isLastPhase = index === phases.length - 1;
              const lastPhaseInProgram = programPhases[programPhases.length - 1];
              const hasWinner = !!(isLastPhase && lastPhaseInProgram?.hasWinner);

              return (
                <PhaseColumn
                  key={phase.id}
                  phase={phase}
                  teams={phase.teams}
                  phaseIndex={index}
                  onMoveTeam={handleMoveTeam}
                  phasesCount={phases.length}
                  isLastPhase={isLastPhase}
                  hasWinner={hasWinner}
                  onSelectWinner={handleSelectWinner}

                />
              );
            })}
          </div>
        )}
      </div>

      {/* Dialogue de félicitations pour le gagnant */}
      {selectedWinner && (
        <WinnerDialog
          open={winnerDialogOpen}
          onOpenChange={setWinnerDialogOpen}
          teamName={selectedWinner.name}
          programName={selectedProgram?.name || ""}
        />
      )}
    </DndProvider>
  );
};

export default KanbanView;
