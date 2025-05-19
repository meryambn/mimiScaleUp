import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Search, Filter, Trophy } from 'lucide-react';
// Import useLocation from wouter
import { useLocation } from 'wouter';
import { useProgramContext } from '@/context/ProgramContext';
import KanbanView from '@/components/teams/KanbanView';
import ViewSelector, { ViewType } from '@/components/teams/ViewSelector';
import WinnerDialog from "@/components/teams/WinnerDialog";
import WinnerTeamWidget from "@/components/widgets/WinnerTeamWidget";
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { getProgramTeams, getTeamCurrentPhase, ensureTeamHasPhase, BackendTeam, BackendStartup } from '@/services/teamService';
import { moveToPhase } from '@/services/phaseService';
import { getPhases } from '@/services/programService';
import { declareWinner, getProgramWinner } from '@/services/winnerService';

interface TeamMember {
  id: number;
  name: string;
  email: string;
}

interface Startup {
  id: number;
  name: string;
  logo: string;
  industry: string;
  currentPhase: string;
  progress: number;
  status: 'active' | 'at_risk' | 'completed';
  programId: string; // Associate startup with a program
  description?: string;
  members?: TeamMember[];
}

const StartupCard: React.FC<{ startup: Startup }> = ({ startup }) => {
  const [, setLocation] = useLocation(); // Add this line to use wouter's navigation

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
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => {
        console.log(`Navigating to team detail: /teams/${startup.id}`);
        setLocation(`/teams/${startup.id}`);
      }}
    >
      <CardHeader className="flex flex-row items-center space-x-4 pb-2">
        <img
          src={startup.logo}
          alt={`${startup.name} logo`}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="flex-1">
          <CardTitle className="text-xl">{startup.name}</CardTitle>
          <p className="text-sm text-gray-500">{startup.industry}</p>
        </div>
        <Badge className={getStatusColor(startup.status)}>
          {startup.status.replace('_', ' ').toUpperCase()}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Phase actuelle:</span>
            <span className="font-medium">{startup.currentPhase}</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Progrès</span>
              <span>{startup.progress}%</span>
            </div>
            <Progress value={startup.progress} className="h-2" />
          </div>

          {startup.members && startup.members.length > 0 && (
            <div className="mt-2 pt-2 border-t">
              <div className="text-sm text-muted-foreground mb-1">Membres de l'équipe: {startup.members.length}</div>
              <div className="flex flex-wrap gap-1">
                {startup.members.slice(0, 3).map((member) => (
                  <Badge key={member.id} variant="outline" className="text-xs">
                    {member.name}
                  </Badge>
                ))}
                {startup.members.length > 3 && (
                  <Badge variant="outline" className="text-xs">+{startup.members.length - 3} de plus</Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const TeamsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState('all');
  const [currentView, setCurrentView] = useState<ViewType>('list');
  const { selectedProgramId, selectedProgram } = useProgramContext();
  const [localStartups, setLocalStartups] = useState<Startup[]>([]);
  const { toast } = useToast();
  const [winner, setWinner] = useState<number | string | null>(null);
  const [winnerDialogOpen, setWinnerDialogOpen] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<Startup | null>(null);
  const [, setLocation] = useLocation(); // Add this line to use wouter's navigation

  // Fetch teams from backend and ensure they all have phases
  const { data: backendTeamsData, isLoading: isLoadingTeams } = useQuery({
    queryKey: ['program-teams', selectedProgramId],
    queryFn: () => selectedProgramId ? getProgramTeams(selectedProgramId, true) : Promise.resolve({ startups_individuelles: [], equipes: [] }),
    enabled: !!selectedProgramId,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true
  });

  // Convert backend teams to frontend format
  const backendStartups = React.useMemo(() => {
    if (!backendTeamsData) return [];

    const startups: Startup[] = [];

    // Add individual startups
    if (backendTeamsData.startups_individuelles && backendTeamsData.startups_individuelles.length > 0) {
      backendTeamsData.startups_individuelles.forEach(startup => {
        // Fetch the current phase for this startup (will be updated asynchronously)
        getTeamCurrentPhase(startup.id).then(phaseData => {
          if (phaseData) {
            // Find the startup in the array and update its phase
            const startupIndex = startups.findIndex(s => s.id === startup.id);
            if (startupIndex >= 0) {
              startups[startupIndex].currentPhase = phaseData.nom || "Non assigné";
              // Force a re-render by updating localStorage
              const storedStartups = localStorage.getItem('startups') || '[]';
              const parsedStartups = JSON.parse(storedStartups);
              const existingIndex = parsedStartups.findIndex((s: any) => String(s.id) === String(startup.id));
              if (existingIndex >= 0) {
                parsedStartups[existingIndex].currentPhase = phaseData.nom || "Non assigné";
              } else {
                parsedStartups.push({
                  id: startup.id,
                  currentPhase: phaseData.nom || "Non assigné"
                });
              }
              localStorage.setItem('startups', JSON.stringify(parsedStartups));
              window.dispatchEvent(new Event('storage'));
            }
          }
        }).catch(error => {
          console.error(`Error fetching phase for startup ${startup.id}:`, error);
        });

        startups.push({
          id: startup.id,
          name: startup.nom || `Startup #${startup.id}`,
          logo: `https://via.placeholder.com/100/${Math.floor(Math.random()*16777215).toString(16)}/FFFFFF?text=${startup.nom?.substring(0, 2) || 'ST'}`,
          industry: "Non spécifié",
          currentPhase: "Chargement...", // Will be updated asynchronously
          progress: 10,
          status: 'active',
          programId: selectedProgramId || ""
        });
      });
    }

    // Add teams
    if (backendTeamsData.equipes && backendTeamsData.equipes.length > 0) {
      backendTeamsData.equipes.forEach(team => {
        // Fetch the current phase for this team (will be updated asynchronously)
        getTeamCurrentPhase(team.id).then(phaseData => {
          if (phaseData) {
            // Find the team in the array and update its phase
            const teamIndex = startups.findIndex(s => s.id === team.id);
            if (teamIndex >= 0) {
              startups[teamIndex].currentPhase = phaseData.nom || "Non assigné";
              // Force a re-render by updating localStorage
              const storedStartups = localStorage.getItem('startups') || '[]';
              const parsedStartups = JSON.parse(storedStartups);
              const existingIndex = parsedStartups.findIndex((s: any) => String(s.id) === String(team.id));
              if (existingIndex >= 0) {
                parsedStartups[existingIndex].currentPhase = phaseData.nom || "Non assigné";
              } else {
                parsedStartups.push({
                  id: team.id,
                  currentPhase: phaseData.nom || "Non assigné"
                });
              }
              localStorage.setItem('startups', JSON.stringify(parsedStartups));
              window.dispatchEvent(new Event('storage'));
            }
          }
        }).catch(error => {
          console.error(`Error fetching phase for team ${team.id}:`, error);
        });

        startups.push({
          id: team.id,
          name: team.nom_equipe || `Équipe #${team.id}`,
          logo: `https://via.placeholder.com/100/${Math.floor(Math.random()*16777215).toString(16)}/FFFFFF?text=${team.nom_equipe?.substring(0, 2) || 'EQ'}`,
          industry: "Équipe",
          currentPhase: "Chargement...", // Will be updated asynchronously
          progress: 20,
          status: 'active',
          programId: selectedProgramId || "",
          members: team.membres.map(memberId => ({
            id: memberId,
            name: `Membre #${memberId}`,
            email: ""
          }))
        });
      });
    }

    return startups;
  }, [backendTeamsData, selectedProgramId]);

  // Fonction pour mettre à jour la phase d'une équipe
  const handlePhaseChange = async (teamId: number | string, newPhase: string) => {
    if (!selectedProgramId) {
      toast({
        title: "Erreur",
        description: "Aucun programme sélectionné.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Trouver l'équipe dans toutes les équipes (sample + local)
      const teamToUpdate = allStartups.find(s => String(s.id) === String(teamId));

      // Récupérer les phases du programme
      const phases = await getPhases(selectedProgramId);

      // Trouver la phase correspondante
      const phaseObj = phases.find(phase =>
        phase.nom.toLowerCase() === newPhase.toLowerCase() ||
        phase.nom.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() ===
        newPhase.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      );

      if (!phaseObj) {
        console.error(`Phase "${newPhase}" not found in program ${selectedProgramId}`);
        toast({
          title: "Erreur",
          description: `Phase "${newPhase}" introuvable dans ce programme.`,
          variant: "destructive"
        });
        return;
      }

      console.log(`Moving team ${teamId} to phase ${phaseObj.nom} (ID: ${phaseObj.id})`);

      // Find the team to get its name
      const teamObj = backendTeamsData?.equipes?.find((t: any) => String(t.id) === String(teamId));
      const teamName = teamObj?.nom_equipe;

      console.log(`Team name for ID ${teamId}: ${teamName || 'Not found'}`);

      // Appeler l'API pour déplacer l'équipe vers la nouvelle phase
      const result = await moveToPhase({
        entiteType: 'equipe',
        entiteId: teamId,
        phaseNextId: phaseObj.id,
        programmeId: selectedProgramId,
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

      // Mettre à jour localStorage pour toutes les équipes
      try {
        const storedStartups = localStorage.getItem('startups') || '[]';
        const parsedStartups = JSON.parse(storedStartups);

        // Vérifier si l'équipe existe déjà dans localStorage
        const existingIndex = parsedStartups.findIndex((s: any) => String(s.id) === String(teamId));

        let updatedStartups;
        if (existingIndex >= 0) {
          // Mettre à jour l'équipe existante
          updatedStartups = parsedStartups.map((s: any) =>
            String(s.id) === String(teamId) ? {
              ...s,
              currentPhase: newPhase,
              // Use our name if the backend used a default name
              name: displayName || s.name
            } : s
          );
        } else if (teamToUpdate) {
          // Ajouter l'équipe au localStorage si elle n'existe pas encore
          updatedStartups = [...parsedStartups, { ...teamToUpdate, currentPhase: newPhase }];
        } else {
          updatedStartups = parsedStartups;
        }

        // Sauvegarder dans localStorage
        localStorage.setItem('startups', JSON.stringify(updatedStartups));

        // Mettre à jour l'état local immédiatement
        setLocalStartups(updatedStartups);
      } catch (error) {
        console.error("Error updating startups in localStorage:", error);
      }

      // Créer un événement personnalisé pour notifier les autres composants
      const event = new CustomEvent('team-phase-changed', {
        detail: { teamId, newPhase }
      });
      document.dispatchEvent(event);

      // Forcer un rechargement des données dans toutes les vues
      window.dispatchEvent(new Event('storage'));

      // Afficher une notification
      toast({
        title: "Phase mise à jour",
        description: `${displayName || 'L\'équipe'} a été déplacée vers ${newPhase}`,
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

  // Fonction pour sélectionner un gagnant
  const handleSelectWinner = async (teamId: number | string) => {
    // Trouver l'équipe sélectionnée comme gagnante
    const winningTeam = allStartups.find(startup => startup.id === teamId);

    if (winningTeam && selectedProgramId) {
      try {
        // Récupérer les phases du programme
        const phases = await getPhases(selectedProgramId);

        // Trouver la dernière phase du programme
        const lastPhase = phases[phases.length - 1];
        if (!lastPhase) {
          toast({
            title: "Erreur",
            description: "Impossible de trouver la dernière phase du programme.",
            variant: "destructive"
          });
          return;
        }

        console.log(`Declaring team ${teamId} as winner of phase ${lastPhase.id} (${lastPhase.nom})`);

        // Appeler l'API pour déclarer le gagnant
        await declareWinner(lastPhase.id, teamId);

        setWinner(teamId);
        setSelectedWinner(winningTeam);

        // Mettre à jour le statut de l'équipe gagnante
        const updatedStartups = allStartups.map(startup =>
          startup.id === teamId ? { ...startup, status: 'completed' as const } : startup
        );

        // Mettre à jour localStorage si l'équipe modifiée est une équipe locale
        const isLocalStartup = localStartups.some(s => s.id === teamId);
        if (isLocalStartup) {
          const updatedLocalStartups = localStartups.map(startup =>
            startup.id === teamId ? { ...startup, status: 'completed' as const } : startup
          );
          setLocalStartups(updatedLocalStartups);
          localStorage.setItem('startups', JSON.stringify(updatedLocalStartups));
        }

        // Afficher une notification
        toast({
          title: "Gagnant sélectionné",
          description: `${winningTeam.name} a été déclaré gagnant du programme.`,
        });

        // Ouvrir le dialogue de félicitations
        setWinnerDialogOpen(true);

        // Invalider le cache pour forcer un rechargement des données
        window.dispatchEvent(new Event('storage'));
      } catch (error) {
        console.error("Error declaring winner:", error);
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la déclaration du gagnant.",
          variant: "destructive"
        });
      }
    }
  };

  // Load startups from localStorage
  React.useEffect(() => {
    try {
      const storedStartups = localStorage.getItem('startups');
      if (storedStartups) {
        const parsedStartups = JSON.parse(storedStartups);
        if (Array.isArray(parsedStartups)) {
          setLocalStartups(parsedStartups);
        }
      }
    } catch (error) {
      console.error("Error loading startups from localStorage:", error);
    }

    // Set up an interval to check for updates
    const interval = setInterval(() => {
      try {
        const storedStartups = localStorage.getItem('startups');
        if (storedStartups) {
          const parsedStartups = JSON.parse(storedStartups);
          if (Array.isArray(parsedStartups) && JSON.stringify(parsedStartups) !== JSON.stringify(localStartups)) {
            setLocalStartups(parsedStartups);
          }
        }
      } catch (error) {
        console.error("Error checking localStorage for startups:", error);
      }
    }, 2000);

    // Écouter les événements de changement de phase
    const handlePhaseChange = (event: CustomEvent) => {
      const { teamId, newPhase } = event.detail;

      // Forcer une mise à jour immédiate depuis localStorage
      try {
        const storedStartups = localStorage.getItem('startups');
        if (storedStartups) {
          const parsedStartups = JSON.parse(storedStartups);
          if (Array.isArray(parsedStartups)) {
            setLocalStartups(parsedStartups);
          }
        }
      } catch (error) {
        console.error("Error refreshing startups from localStorage:", error);
      }
    };

    // Écouter les événements de stockage (pour la synchronisation entre les onglets)
    const handleStorageChange = () => {
      try {
        const storedStartups = localStorage.getItem('startups');
        if (storedStartups) {
          const parsedStartups = JSON.parse(storedStartups);
          if (Array.isArray(parsedStartups)) {
            setLocalStartups(parsedStartups);

            // Ne pas forcer un rafraîchissement de la page pour éviter les rechargements
          }
        }
      } catch (error) {
        console.error("Error refreshing startups from localStorage:", error);
      }
    };

    // Ajouter les écouteurs d'événements
    document.addEventListener('team-phase-changed', handlePhaseChange as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('team-phase-changed', handlePhaseChange as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Sample data - in a real app, this would come from the API
  const sampleStartups: Startup[] = [
    {
      id: 1,
      name: "EcoTech Solutions",
      logo: "https://via.placeholder.com/100/00C853/FFFFFF?text=ET",
      industry: "Clean Technology",
      currentPhase: "Prototypage",
      progress: 65,
      status: 'active',
      programId: "1"
    },
    {
      id: 2,
      name: "HealthAI",
      logo: "https://via.placeholder.com/100/2196F3/FFFFFF?text=HAI",
      industry: "Healthcare Technology",
      currentPhase: "Validation",
      progress: 85,
      status: 'active',
      programId: "1"
    },
    {
      id: 3,
      name: "FinFlow",
      logo: "https://via.placeholder.com/100/FFC107/000000?text=FF",
      industry: "FinTech",
      currentPhase: "Idéation",
      progress: 30,
      status: 'at_risk',
      programId: "1"
    },
    {
      id: 4,
      name: "SmartAgri",
      logo: "https://via.placeholder.com/100/4CAF50/FFFFFF?text=SA",
      industry: "AgriTech",
      currentPhase: "Prototypage",
      progress: 45,
      status: 'active',
      programId: "1"
    },
    {
      id: 5,
      name: "CyberShield",
      logo: "https://via.placeholder.com/100/F44336/FFFFFF?text=CS",
      industry: "Cybersecurity",
      currentPhase: "Lancement",
      progress: 95,
      status: 'active',
      programId: "1"
    },
    {
      id: 6,
      name: "EdTech Innovators",
      logo: "https://via.placeholder.com/100/9C27B0/FFFFFF?text=EDI",
      industry: "Education Technology",
      currentPhase: "Découverte",
      progress: 25,
      status: 'at_risk',
      programId: "2"
    },
    {
      id: 7,
      name: "RoboTech",
      logo: "https://via.placeholder.com/100/607D8B/FFFFFF?text=RT",
      industry: "Robotics",
      currentPhase: "Solution",
      progress: 55,
      status: 'active',
      programId: "2"
    },
    {
      id: 8,
      name: "BlockChain Solutions",
      logo: "https://via.placeholder.com/100/3F51B5/FFFFFF?text=BCS",
      industry: "Blockchain",
      currentPhase: "Impact",
      progress: 75,
      status: 'active',
      programId: "2"
    },
    {
      id: 9,
      name: "IoT Connect",
      logo: "https://via.placeholder.com/100/009688/FFFFFF?text=IOT",
      industry: "Internet of Things",
      currentPhase: "Solution",
      progress: 50,
      status: 'active',
      programId: "2"
    }
  ];

  // Combine sample startups with those from localStorage and backend, with backend taking precedence
  const allStartups = React.useMemo(() => {
    // Create a map of all startups from sample data
    const startupsMap = new Map();

    // Add sample startups to the map
    sampleStartups.forEach(startup => {
      startupsMap.set(String(startup.id), startup);
    });

    // Override with localStorage startups
    localStartups.forEach(startup => {
      startupsMap.set(String(startup.id), startup);
    });

    // Override with backend startups (they take highest precedence)
    backendStartups.forEach(startup => {
      startupsMap.set(String(startup.id), startup);
    });

    // Convert map back to array
    return Array.from(startupsMap.values());
  }, [sampleStartups, localStartups, backendStartups]);

  // Filter startups based on the selected program
  const programStartups = selectedProgramId
    ? allStartups.filter(startup => startup.programId === selectedProgramId)
    : allStartups;

  const filterStartups = (startups: Startup[]) => {
    return startups.filter(startup => {
      const matchesSearch = startup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          startup.industry.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      switch (currentTab) {
        case 'pending':
          return startup.status === 'active' && startup.progress < 100;
        case 'at_risk':
          return startup.status === 'at_risk';
        default:
          return true;
      }
    });
  };

  const filteredStartups = filterStartups(programStartups);

  if (!selectedProgram) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Aucun programme sélectionné</h1>
        <p className="text-gray-500 mb-6">Veuillez sélectionner un programme pour voir ses équipes.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Équipes</h1>
          <p className="text-gray-500">Programme: {selectedProgram.name}</p>
        </div>
      </div>

      {/* Widget de l'équipe gagnante */}
      <Card className="mb-6 cursor-pointer hover:shadow-md transition-shadow w-full" onClick={() => {
        if (winner) {
          console.log(`Navigating to winner team detail: /teams/${winner}`);
          setLocation(`/teams/${winner}`);
        }
      }}>
        <CardContent className="p-0">
          <WinnerTeamWidget />
        </CardContent>
      </Card>

      <div className="flex items-center space-x-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Rechercher des équipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <ViewSelector currentView={currentView} onViewChange={setCurrentView} />
        <button style={{ backgroundColor: 'white', color: '#0c4c80', border: '1px solid #e5e7eb', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <Filter className="h-4 w-4 mr-2" />
          Filtres
        </button>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">Toutes les équipes</TabsTrigger>
          <TabsTrigger value="pending">Évaluation en attente</TabsTrigger>
          <TabsTrigger value="at_risk">En risque</TabsTrigger>
        </TabsList>

        <TabsContent value={currentTab}>
          {isLoadingTeams ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Chargement des équipes...</p>
            </div>
          ) : filteredStartups.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Aucune équipe trouvée pour ce programme.</p>
            </div>
          ) : currentView === 'kanban' ? (
            <KanbanView
              teams={filteredStartups}
              onPhaseChange={handlePhaseChange}
              onSelectWinner={handleSelectWinner}
            />
          ) : (
            <div className="flex flex-col space-y-4">
              {filteredStartups.map((startup) => (
                <Card key={startup.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
                  console.log(`Navigating to team detail: /teams/${startup.id}`);
                  setLocation(`/teams/${startup.id}`);
                }}>
                  <CardContent className="p-4 flex items-center">
                    <img
                      src={startup.logo}
                      alt={`${startup.name} logo`}
                      className="w-10 h-10 rounded-full object-cover mr-4"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium">{startup.name}</h3>
                      <p className="text-sm text-gray-500">{startup.industry}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-right">
                        <div>{startup.currentPhase}</div>
                        <div className="text-xs text-gray-500">Progression: {startup.progress}%</div>
                      </div>
                      <div className="flex space-x-1">
                        {startup.status === 'completed' && (
                          <Badge className="bg-amber-100 text-amber-800">
                            <Trophy className="h-3 w-3 mr-1" />
                            GAGNANT
                          </Badge>
                        )}
                        <Badge className={startup.status === 'active' ? 'bg-green-100 text-green-800' : startup.status === 'at_risk' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
                          {startup.status === 'active' ? 'ACTIF' : startup.status === 'at_risk' ? 'EN RISQUE' : 'COMPLÉTÉ'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

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
    </div>
  );
};

export default TeamsPage;