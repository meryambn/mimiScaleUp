import React, { useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MessageSquare, ArrowRight, ArrowLeft, Trophy, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProgramContext } from '@/context/ProgramContext';
import WinnerDialog from "@/components/teams/WinnerDialog";
import { getProgramTeams, getTeamCurrentPhase, ensureTeamHasPhase } from '@/services/teamService';
import { moveToPhase } from '@/services/phaseService';
import { getPhases } from '@/services/programService';
import { declareWinner, isTeamWinner, getProgramWinner } from '@/services/winnerService';
import { useAuth } from '@/context/AuthContext';

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

// Interface for the team phase response from the backend
interface TeamPhaseResponse {
  phase_id: number;
  nom: string;
  description: string;
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
  const { user } = useAuth();
  const isMentor = user?.role === 'mentor';

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

          {isLastPhase && team.status !== 'completed' && !isMentor && (
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
          {isLastPhase && team.status === 'completed' && (
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
  const [isLoadingFromBackend, setIsLoadingFromBackend] = useState(false);

  // Mettre à jour les équipes locales lorsque les équipes changent
  React.useEffect(() => {
    setLocalTeams(teams);
  }, [teams]);

  // Check winner status when the component mounts
  React.useEffect(() => {
    if (selectedProgram?.id) {
      console.log('Component mounted, checking winner status for all teams');
      // Force a refresh from the backend to get the latest winner status
      loadTeamsFromBackend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProgram?.id]);

  // Check if any teams are winners when the component loads or when teams change
  React.useEffect(() => {
    const checkWinnerStatus = async () => {
      if (!selectedProgram?.id || localTeams.length === 0) return;

      console.log('Checking winner status for all teams in Kanban view');

      try {
        // Get the winner for the program directly from the backend
        const winner = await getProgramWinner(selectedProgram.id);

        if (winner && winner.candidature_id) {
          console.log(`Found winner for program ${selectedProgram.id}: ${winner.candidature_id}`);

          // Create a copy of the teams to update
          const updatedTeams = localTeams.map(team => {
            // If this team is the winner, mark it as completed
            if (String(team.id) === String(winner.candidature_id)) {
              console.log(`Team ${team.name} (${team.id}) is the winner, updating status`);
              return {
                ...team,
                status: 'completed',
                progress: 100 // Set progress to 100% for winners
              };
            }
            return team;
          });

          // Update the state with the winner status
          console.log('Updating teams with winner status');
          setLocalTeams(updatedTeams);
        } else {
          console.log(`No winner found for program ${selectedProgram.id}`);
        }
      } catch (error) {
        console.error(`Error checking winner status for program ${selectedProgram.id}:`, error);
      }
    };

    // Run the check immediately
    checkWinnerStatus();

    // Also set up an interval to check periodically
    const intervalId = setInterval(checkWinnerStatus, 5000); // Check every 5 seconds

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProgram?.id]);

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
    const handleStorageChange = async () => {
      console.log('KanbanView: Changement de stockage détecté, mise à jour des équipes');

      // Instead of relying on localStorage, force a refresh from the backend
      if (selectedProgram?.id) {
        console.log('Forcing a refresh from the backend after storage change');
        await loadTeamsFromBackend();
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

  // Instead of loading from localStorage, we'll rely on the backend data
  React.useEffect(() => {
    // If we have a selected program, load teams from the backend
    if (selectedProgram?.id && teams.length > 0) {
      console.log('Initial teams loaded, checking winner status');

      // Check if any of the teams are winners
      const checkWinnerStatus = async () => {
        try {
          const winner = await getProgramWinner(selectedProgram.id);
          if (winner && winner.candidature_id) {
            console.log(`Found winner for program ${selectedProgram.id}: ${winner.candidature_id}`);

            // Update the winner status in the teams array
            const updatedTeams = teams.map(team => {
              if (String(team.id) === String(winner.candidature_id)) {
                console.log(`Team ${team.name} (${team.id}) is the winner, updating status`);
                return {
                  ...team,
                  status: 'completed',
                  progress: 100
                };
              }
              return team;
            });

            // Set the teams with winner status
            setLocalTeams(updatedTeams);
          } else {
            // If no winner, just use the teams as is
            setLocalTeams(teams);
          }
        } catch (error) {
          console.error(`Error checking winner status during initial load:`, error);
          // If there's an error, just use the teams as is
          setLocalTeams(teams);
        }
      };

      checkWinnerStatus();
    } else {
      // If no selected program or no teams, just use the teams as is
      setLocalTeams(teams);
    }
  }, [teams, selectedProgram?.id]);

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
  const handleMoveTeam = async (teamId: number | string, newPhaseIndex: number) => {
    if (newPhaseIndex < 0 || newPhaseIndex >= phases.length) return;
    if (!selectedProgram?.id) return;

    const newPhase = phases[newPhaseIndex];
    console.log(`Moving team ${teamId} to phase ${newPhase.name} (index ${newPhaseIndex})`);

    try {
      // Find the team to get its name
      const team = localTeams.find(t => t.id === teamId);
      const teamName = team?.name;

      console.log(`Team name for ID ${teamId}: ${teamName || 'Not found'}`);

      // Appeler l'API pour déplacer l'équipe vers la nouvelle phase
      const result = await moveToPhase({
        entiteType: 'equipe',
        entiteId: teamId,
        phaseNextId: newPhase.id,
        programmeId: selectedProgram.id,
        ...(teamName && {
          nom_entreprise: teamName,
          // Also include it in the format the backend is looking for
          soumission: {
            nom_entreprise: teamName
          }
        })
      });

      // If we sent a name but the backend still used a default name, use our name
      const displayName = teamName && result.nom && result.nom.startsWith('Startup ')
        ? teamName
        : result.nom || teamName;

      // Mettre à jour l'état local
      setLocalTeams(prevTeams =>
        prevTeams.map(team => {
          if (team.id === teamId) {
            console.log(`Updating team ${team.name} from phase ${team.currentPhase} to ${newPhase.name}`);
            return {
              ...team,
              currentPhase: newPhase.name,
              // Use our name if the backend used a default name
              name: displayName || team.name
            };
          }
          return team;
        })
      );

      // Appeler le callback si fourni
      if (onPhaseChange) {
        console.log(`Calling onPhaseChange callback for team ${teamId} to phase ${newPhase.name}`);
        onPhaseChange(teamId, newPhase.name);
      }

      toast({
        title: "Phase mise à jour",
        description: `L'équipe a été déplacée vers ${newPhase.name}`,
      });
    } catch (error) {
      console.error('Error moving team to phase:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du déplacement de l'équipe.",
        variant: "destructive"
      });
    }
  };

  // Cette fonction est remplacée par l'utilisation de getProgramTeams avec ensurePhases=true

  // Fonction pour charger les équipes depuis le backend
  const loadTeamsFromBackend = async () => {
    if (!selectedProgram?.id) {
      toast({
        title: "Erreur",
        description: "Aucun programme sélectionné.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoadingFromBackend(true);
      console.log('Loading teams from backend for program:', selectedProgram.id);

      // Charger les équipes et s'assurer qu'elles ont toutes une phase assignée
      console.log('Loading teams data from backend and ensuring all teams have phases...');
      const backendData = await getProgramTeams(selectedProgram.id, true);

      // Tableau temporaire pour stocker les équipes pendant que nous récupérons les phases
      const tempTeams: Team[] = [];

      // Traiter les équipes
      for (const team of backendData.equipes) {
        // Récupérer la phase actuelle de l'équipe
        const phaseData = await getTeamCurrentPhase(team.id);

        console.log(`Phase data for team ${team.id} (${team.nom_equipe}):`, phaseData);

        // Trouver la phase correspondante dans le programme
        let phaseName = 'Non assigné';
        if (phaseData && phaseData.nom) {
          // Chercher une phase correspondante dans les phases du programme
          const matchingProgramPhase = programPhases.find(phase =>
            phase.name.toLowerCase() === phaseData.nom.toLowerCase() ||
            phase.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() ===
            phaseData.nom.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
          );

          // Utiliser le nom exact de la phase du programme si trouvé, sinon utiliser le nom de la phase de la BD
          phaseName = matchingProgramPhase ? matchingProgramPhase.name : phaseData.nom;
          console.log(`Matched phase name for team ${team.nom_equipe}: ${phaseName}`);
        }

        // Check if this team is a winner
        const isWinner = await isTeamWinner(selectedProgram.id, team.id);
        console.log(`Team ${team.nom_equipe} (${team.id}) is ${isWinner ? '' : 'not '}a winner`);

        tempTeams.push({
          id: team.id,
          name: team.nom_equipe,
          currentPhase: phaseName,
          progress: isWinner ? 100 : 0, // 100% progress for winners
          status: isWinner ? 'completed' : 'active', // 'completed' status for winners
          description: `Équipe avec ${team.membres.length} membres`
        });
      }

      // Traiter les startups individuelles
      for (const startup of backendData.startups_individuelles) {
        // Récupérer la phase actuelle de la startup
        const phaseData = await getTeamCurrentPhase(startup.id, startup.nom);

        console.log(`Phase data for startup ${startup.id} (${startup.nom}):`, phaseData);

        // Trouver la phase correspondante dans le programme
        let phaseName = 'Non assigné';
        if (phaseData && phaseData.nom) {
          // Chercher une phase correspondante dans les phases du programme
          const matchingProgramPhase = programPhases.find(phase =>
            phase.name.toLowerCase() === phaseData.nom.toLowerCase() ||
            phase.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() ===
            phaseData.nom.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
          );

          // Utiliser le nom exact de la phase du programme si trouvé, sinon utiliser le nom de la phase de la BD
          phaseName = matchingProgramPhase ? matchingProgramPhase.name : phaseData.nom;
          console.log(`Matched phase name for startup ${startup.nom}: ${phaseName}`);
        }

        // Use the teamName from phaseData if available, otherwise use startup.nom
        const displayName = phaseData?.teamName || startup.nom;

        // Check if this startup is a winner
        const isWinner = await isTeamWinner(selectedProgram.id, startup.id);
        console.log(`Startup ${displayName} (${startup.id}) is ${isWinner ? '' : 'not '}a winner`);

        tempTeams.push({
          id: startup.id,
          name: displayName,
          currentPhase: phaseName,
          progress: isWinner ? 100 : 0, // 100% progress for winners
          status: isWinner ? 'completed' : 'active', // 'completed' status for winners
          description: 'Startup individuelle'
        });
      }

      console.log('Teams loaded from backend with phases:', tempTeams);

      // Log all available phases for debugging
      console.log('Available program phases:', programPhases.map(p => ({ id: p.id, name: p.name })));

      // Log all available kanban phases for debugging
      console.log('Available kanban phases:', phases.map(p => ({ id: p.id, name: p.name })));

      // Before setting the teams, check if any of them are winners
      try {
        const winner = await getProgramWinner(selectedProgram.id);
        if (winner && winner.candidature_id) {
          console.log(`Found winner for program ${selectedProgram.id}: ${winner.candidature_id}`);

          // Update the winner status in the tempTeams array
          for (let i = 0; i < tempTeams.length; i++) {
            if (String(tempTeams[i].id) === String(winner.candidature_id)) {
              console.log(`Team ${tempTeams[i].name} (${tempTeams[i].id}) is the winner, updating status`);
              tempTeams[i].status = 'completed';
              tempTeams[i].progress = 100;
            }
          }
        }
      } catch (error) {
        console.error(`Error checking winner status during team loading:`, error);
      }

      // Set the teams with winner status already checked
      setLocalTeams(tempTeams);

      toast({
        title: "Équipes chargées",
        description: `${tempTeams.length} équipes chargées depuis le backend.`,
      });
    } catch (error) {
      console.error('Error loading teams from backend:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les équipes depuis le backend.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingFromBackend(false);
    }
  };

  // Fonction pour déterminer la phase d'une équipe
  const getTeamPhase = (team: Team) => {
    if (!team.currentPhase) return phases[0]?.id || 'unassigned';

    // Essayer de trouver une correspondance exacte avec le nom de la phase
    const exactMatch = phases.find(phase =>
      phase.name.toLowerCase() === team.currentPhase.toLowerCase() ||
      phase.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() ===
      team.currentPhase.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
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
  const handleSelectWinner = async (teamId: number | string) => {
    // Trouver l'équipe sélectionnée
    const team = localTeams.find(t => t.id === teamId);
    if (!team) return;

    // Trouver la dernière phase du programme
    const lastPhase = programPhases[programPhases.length - 1];
    if (!lastPhase) {
      toast({
        title: "Erreur",
        description: "Impossible de trouver la dernière phase du programme.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Appeler l'API pour déclarer le gagnant
      await declareWinner(lastPhase.id, teamId);

      // Mettre à jour l'état local immédiatement
      setLocalTeams(prevTeams =>
        prevTeams.map(t =>
          t.id === teamId
            ? { ...t, status: 'completed', progress: 100 } // Also update progress to 100%
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

      // Afficher une notification
      toast({
        title: "Gagnant sélectionné",
        description: `${team.name} a été déclaré gagnant du programme.`,
      });

      // Force a refresh from the backend after a short delay to ensure the winner status is updated
      setTimeout(() => {
        console.log('Forcing a refresh from the backend after selecting a winner');
        loadTeamsFromBackend();
      }, 1000);
    } catch (error) {
      console.error("Error declaring winner:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la déclaration du gagnant.",
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
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Tableau Kanban des Équipes</h2>
          <div className="flex gap-2">
            <button
              onClick={loadTeamsFromBackend}
              disabled={isLoadingFromBackend}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoadingFromBackend ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Chargement...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Charger depuis le backend
                </>
              )}
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('startups');
                toast({
                  title: "Cache effacé",
                  description: "Le cache local a été effacé. Rechargez les données.",
                });
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2"
            >
              Effacer le cache
            </button>
          </div>
        </div>

        {phases.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Aucune phase définie dans ce programme.</p>
          </div>
        ) : (
          <div className="flex overflow-x-auto gap-4 pb-4 min-h-[70vh]">
            {teamsByPhase.map((phase, index) => {
              // Vérifier si c'est la dernière phase
              const isLastPhase = index === phases.length - 1;
              // Nous n'avons plus besoin de vérifier si la phase a un gagnant
              const hasWinner = true; // Toujours vrai pour permettre la sélection d'un gagnant

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
          isAdmin={true}
        />
      )}
    </DndProvider>
  );
};

export default KanbanView;
