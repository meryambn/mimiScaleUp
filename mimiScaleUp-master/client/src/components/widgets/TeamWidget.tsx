import React, { useState, useEffect } from 'react';
import { Users, Mail, Building, ChevronRight, Award, Clock, User, Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from '@/hooks/use-toast';
import TeamInvitationNotification from '@/components/application/TeamInvitationNotification';
import {
  getProgramTeams,
  getTeamDetails as getTeamDetailsService,
  getTeamCurrentPhase,
  checkIfTeamIsWinner,
  BackendTeam,
  BackendStartup,
  ProgramTeamsResponse,
  TeamPhaseResponse,
  TeamDetailsResponse
} from '@/services/teamService';
import { getCandidatureIdForUser } from '@/services/userTeamMappingService';
import { getTeamDetails } from '@/services/teamNotificationService';

interface TeamWidgetProps {
  programId?: string | number;
}

interface TeamWithDetails extends BackendTeam {
  phase?: TeamPhaseResponse | null;
  isWinner?: boolean;
  description?: string;
  members?: any[];
  programme_nom?: string;
}

const TeamWidget: React.FC<TeamWidgetProps> = ({ programId }) => {
  const [teams, setTeams] = useState<TeamWithDetails[]>([]);
  const [individualStartups, setIndividualStartups] = useState<BackendStartup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamWithDetails | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!programId) {
        console.log('No program ID provided');
        setIsLoading(false);
        return;
      }

      if (!user?.id) {
        console.log('No user ID available');
        setIsLoading(false);
        return;
      }

      console.log('Fetching team data for user:', user.id, 'in program:', programId);
      setIsLoading(true);
      setError(null);

      try {
        // Get the team ID for the current user in this program
        const teamId = await getCandidatureIdForUser(user.id, programId);

        console.log(`Found team ID ${teamId} for user ${user.id} in program ${programId}`);

        if (!teamId) {
          console.log('No team ID found for user');
          setTeams([]);
          setIndividualStartups([]);
          setIsLoading(false);
          return;
        }

        // Check if the user is an individual startup or part of a team
        const isIndividualStartup = String(teamId) === String(user.id);
        console.log(`User is ${isIndividualStartup ? 'an individual startup' : 'part of a team'}`);

        if (isIndividualStartup) {
          // For individual startups, get program teams to find the startup info
          const programTeamsResult = await getProgramTeams(programId, true);

          if (!programTeamsResult) {
            console.log('No program teams result');
            setTeams([]);
            setIndividualStartups([]);
            setIsLoading(false);
            return;
          }

          // Find the individual startup in the list
          const startup = programTeamsResult.startups_individuelles.find(
            s => String(s.id) === String(user.id)
          );

          if (startup) {
            console.log('Found individual startup:', startup);
            setIndividualStartups([startup]);
            setTeams([]);
          } else {
            console.log('Individual startup not found in program teams');
            setIndividualStartups([]);
            setTeams([]);
          }
        } else {
          // For teams, fetch team details using the teamNotificationService
          let teamDetails;

          // Try to fetch team details directly from the API
          try {
            const response = await fetch(`${API_BASE_URL}/cand/${teamId}`, {
              method: 'GET',
              headers: {
                'Accept': 'application/json'
              },
              credentials: 'include'
            });

            if (response.ok) {
              const data = await response.json();
              console.log(`Fetched team ${teamId} details directly:`, data);

              // Create a TeamDetails object from the response
              teamDetails = {
                id: Number(teamId),
                name: data.nom || `Équipe ${teamId}`,
                description: data.description || '',
                programId: Number(programId),
                programName: data.programme_nom || `Programme ${programId}`,
                members: Array.isArray(data.membres) ? data.membres.map((m: any) => ({
                  id: m.id,
                  name: m.nom || 'Membre',
                  role: m.role || 'Participant',
                  email: m.email
                })) : [],
                reason: 'Vous êtes membre de cette équipe'
              };
            }
          } catch (error) {
            console.error(`Error fetching team ${teamId} details directly:`, error);
            // Continue with normal flow if this fails
          }

          // If we don't have team details yet, try the normal way
          if (!teamDetails) {
            teamDetails = await getTeamDetails(Number(teamId));
            console.log('Fetched team details:', teamDetails);
          }

          if (!teamDetails) {
            console.log('No team details found');
            setTeams([]);
            setIndividualStartups([]);
            setIsLoading(false);
            return;
          }

          // Get additional information about the team
          const phase = await getTeamCurrentPhase(teamId);
          const isWinner = await checkIfTeamIsWinner(teamId, programId);

          // Create a team object with all the details
          const team: TeamWithDetails = {
            id: teamDetails.id,
            nom_equipe: teamDetails.name,
            membres: teamDetails.members.map(m => m.id),
            phase,
            isWinner,
            description: teamDetails.description,
            members: teamDetails.members,
            programme_nom: teamDetails.programName
          };

          console.log('Processed team with details:', team);

          // Set the teams array with just this one team
          setTeams([team]);

          // Clear individual startups since we're showing a team
          setIndividualStartups([]);
        }
      } catch (err) {
        console.error('Error fetching team data:', err);
        setError('Erreur lors du chargement des données de l\'équipe');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamData();
  }, [programId, user?.id]);

  const handleTeamClick = async (team: TeamWithDetails) => {
    try {
      // We already have the team details, so just set the selected team
      setSelectedTeam(team);
      setShowTeamDialog(true);
    } catch (err) {
      console.error('Error handling team click:', err);
    }
  };

  const getPhaseColor = (phaseName: string) => {
    const colors: { [key: string]: string } = {
      'Phase Initiale': 'bg-blue-100 text-blue-800',
      'Phase Intermédiaire': 'bg-yellow-100 text-yellow-800',
      'Phase Finale': 'bg-purple-100 text-purple-800',
      'Non assigné': 'bg-gray-100 text-gray-800'
    };
    return colors[phaseName] || 'bg-gray-100 text-gray-800';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!teams.length && !individualStartups.length) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">Vous n'êtes pas membre d'une équipe dans ce programme</p>
        <p className="text-sm text-gray-400 mt-2">Programme ID: {programId}</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <Users className="h-4 w-4" />
          </div>
          <h3 className="text-lg font-semibold">Mon Profil</h3>
        </div>
      </div>

      {/* Teams Section */}
      {teams.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Détails de l'équipe</h4>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {teams.map((team) => (
                <div
                  key={team.id}
                  onClick={() => handleTeamClick(team)}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  {/* Header with Avatar */}
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(team.nom_equipe)}&background=random`} />
                      <AvatarFallback>{getInitials(team.nom_equipe)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{team.nom_equipe}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={`text-xs ${getPhaseColor(team.phase?.nom || 'Non assigné')}`}>
                          {team.phase?.nom || 'Non assigné'}
                        </Badge>
                        {team.isWinner && (
                          <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                            Gagnant
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {team.description && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Info className="h-4 w-4" />
                        <span>Description</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm text-gray-600">{team.description}</p>
                      </div>
                    </div>
                  )}

                  {/* Members */}
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Users className="h-4 w-4" />
                      <span>Membres ({team.members?.length || 0})</span>
                    </div>
                    {team.members && team.members.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {team.members.map((member, index) => (
                          <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded-md">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.nom || '')}&background=random`} />
                              <AvatarFallback>{getInitials(member.nom || '')}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{member.nom || `Membre ${index + 1}`}</p>
                              {member.role && (
                                <p className="text-xs text-gray-500">{member.role}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Aucun membre</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Individual Startups Section */}
      {individualStartups.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 mb-3">Mon Profil Startup</h4>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {individualStartups.map((startup) => (
                <div
                  key={startup.id}
                  className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <Building className="h-6 w-6 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{startup.nom}</h3>
                      <Badge variant="secondary" className="text-xs">Startup Individuelle</Badge>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-600">
                      Vous participez à ce programme en tant que startup individuelle.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Team Details Modal */}
      <TeamInvitationNotification
        open={showTeamDialog}
        onOpenChange={setShowTeamDialog}
        teamName={selectedTeam?.nom_equipe || 'Équipe'}
        teamDescription={selectedTeam?.description || 'Description de l\'équipe'}
        programName={selectedTeam?.programme_nom || 'Programme'}
        programId={selectedTeam?.phase?.programme?.id}
        teamMembers={selectedTeam?.members || []}
        teamReason={selectedTeam?.description || ''}
        onViewProgram={() => {
          toast({
            title: "Navigation vers le programme",
            description: `Redirection vers le programme "${selectedTeam?.programme_nom}"`,
          });
          setShowTeamDialog(false);
        }}
      />
    </div>
  );
};

export default TeamWidget;