import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, ChevronRight, Loader2 } from 'lucide-react';
import { useProgramContext } from '@/context/ProgramContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getProgramTeams, getTeamCurrentPhase, getTeamDetails, BackendTeam, BackendStartup } from '@/services/teamService';

interface EvaluationCriterion {
  id: number;
  name: string;
  weight: number;
  score: number;
}

interface TeamWithDetails {
  id: number;
  name: string;
  logo: string;
  industry: string;
  currentPhase: string;
  progress: number;
  status: 'active' | 'at_risk' | 'completed';
  programId: string;
  evaluationCriteria?: EvaluationCriterion[];
  description?: string;
  members?: any[];
  isWinner?: boolean;
}

// Calculate overall score from evaluation criteria
const calculateOverallScore = (criteria: EvaluationCriterion[] | undefined): number => {
  if (!criteria || criteria.length === 0) return 0;

  return criteria.reduce((total, criterion) => {
    // Convert score from 0-5 scale to 0-100% scale, then apply weight
    return total + ((criterion.score / 5) * 100 * criterion.weight / 100);
  }, 0);
};

const NumberOfTeamsWidget: React.FC = () => {
  const { selectedProgramId, selectedPhaseId } = useProgramContext();
  const [teams, setTeams] = useState<TeamWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch teams data when the component mounts or when the programId changes
  useEffect(() => {
    const fetchTeamsData = async () => {
      if (!selectedProgramId) {
        console.log('No program ID selected');
        setIsLoading(false);
        return;
      }

      console.log('Fetching teams for program:', selectedProgramId);
      setIsLoading(true);
      setError(null);

      try {
        // Fetch teams from the backend
        const result = await getProgramTeams(selectedProgramId, true);
        console.log('Fetched program teams result:', result);

        if (!result) {
          console.log('No result from getProgramTeams');
          setTeams([]);
          setIsLoading(false);
          return;
        }

        // Process teams with additional details
        const processedTeams: TeamWithDetails[] = [];

        // Process teams
        if (result.equipes && result.equipes.length > 0) {
          for (const team of result.equipes) {
            try {
              // Get team phase
              const phase = await getTeamCurrentPhase(team.id);

              // Generate a random color for the logo
              const randomColor = Math.floor(Math.random() * 16777215).toString(16);
              const initials = team.nom_equipe ? team.nom_equipe.substring(0, 2).toUpperCase() : 'EQ';

              // Create team with details
              processedTeams.push({
                id: team.id,
                name: team.nom_equipe || `Équipe #${team.id}`,
                logo: `https://via.placeholder.com/100/${randomColor}/FFFFFF?text=${initials}`,
                industry: "Équipe",
                currentPhase: phase?.nom || "Non assigné",
                progress: 65, // Default progress
                status: 'active',
                programId: String(selectedProgramId),
                members: team.membres || [],
                // Add mock evaluation criteria for now
                evaluationCriteria: [
                  { id: 1, name: 'Innovation', weight: 35, score: 4 },
                  { id: 2, name: 'Potentiel du marché', weight: 30, score: 3 },
                  { id: 3, name: 'Équipe', weight: 35, score: 4 }
                ]
              });
            } catch (error) {
              console.error(`Error processing team ${team.id}:`, error);
            }
          }
        }

        // Process individual startups
        if (result.startups_individuelles && result.startups_individuelles.length > 0) {
          for (const startup of result.startups_individuelles) {
            try {
              // Get startup phase
              const phase = await getTeamCurrentPhase(startup.id);

              // Generate a random color for the logo
              const randomColor = Math.floor(Math.random() * 16777215).toString(16);
              const initials = startup.nom ? startup.nom.substring(0, 2).toUpperCase() : 'ST';

              // Create startup with details
              processedTeams.push({
                id: startup.id,
                name: startup.nom || `Startup #${startup.id}`,
                logo: `https://via.placeholder.com/100/${randomColor}/FFFFFF?text=${initials}`,
                industry: "Startup individuelle",
                currentPhase: phase?.nom || "Non assigné",
                progress: 50, // Default progress
                status: 'active',
                programId: String(selectedProgramId),
                // Add mock evaluation criteria for now
                evaluationCriteria: [
                  { id: 1, name: 'Innovation', weight: 35, score: 3 },
                  { id: 2, name: 'Potentiel du marché', weight: 30, score: 3 },
                  { id: 3, name: 'Entrepreneur', weight: 35, score: 4 }
                ]
              });
            } catch (error) {
              console.error(`Error processing startup ${startup.id}:`, error);
            }
          }
        }

        console.log('Processed teams with details:', processedTeams);
        setTeams(processedTeams);
      } catch (err) {
        console.error('Error fetching teams data:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamsData();
  }, [selectedProgramId]);

  // Filter teams based on the selected phase
  let filteredTeams = teams;

  // Further filter by phase if a phase is selected
  if (selectedPhaseId) {
    filteredTeams = teams.filter(team => {
      // Extract phase number from the currentPhase string or phase ID
      const teamPhaseMatch = team.currentPhase.match(/Phase (\d+)/);
      const teamPhaseNum = teamPhaseMatch ? teamPhaseMatch[1] : null;

      // Extract phase number from selectedPhaseId
      const selectedPhaseMatch = String(selectedPhaseId).match(/phase(\d+)/);
      const selectedPhaseNum = selectedPhaseMatch ? selectedPhaseMatch[1] : String(selectedPhaseId);

      return teamPhaseNum === selectedPhaseNum;
    });
  }

  // Calculate the number of active and at-risk teams based on evaluation scores
  const teamsWithEvaluation = filteredTeams.filter(team => team.evaluationCriteria && team.evaluationCriteria.length > 0);

  // Count at risk teams (score <= 50%)
  const atRiskCount = teamsWithEvaluation.filter(
    team => calculateOverallScore(team.evaluationCriteria) <= 50
  ).length;

  // Count active teams (score > 50%)
  const activeCount = teamsWithEvaluation.filter(
    team => calculateOverallScore(team.evaluationCriteria) > 50
  ).length;

  // Count teams without evaluation
  const withoutEvaluationCount = filteredTeams.length - teamsWithEvaluation.length;

  const total = filteredTeams.length;
  const activeRatio = total > 0 ? (activeCount / total) * 100 : 0;

  // Sort teams by evaluation score
  const sortedTeams = [...teamsWithEvaluation].sort((a, b) => {
    const scoreA = calculateOverallScore(a.evaluationCriteria);
    const scoreB = calculateOverallScore(b.evaluationCriteria);
    return scoreB - scoreA; // Descending order
  });

  // Get top 3 teams
  const topTeams = sortedTeams.slice(0, 3);

  return (
    <Card>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
              <p className="text-sm text-gray-500">Chargement des équipes...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-red-500">{error}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-4">
                <Users className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm font-medium leading-none">Total</p>
                  <h3 className="text-lg font-semibold">Équipes</h3>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-2xl font-bold">{total}</div>
                <div className="flex items-center text-sm mt-1">
                  <span className="text-green-600 font-medium">{activeCount} Actives</span>
                  <span className="mx-1 text-gray-400">|</span>
                  <span className="text-red-600 font-medium">{atRiskCount} En risque</span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="h-2 bg-red-100 rounded-full">
                <div
                  className="h-2 bg-green-500 rounded-full"
                  style={{ width: `${activeRatio}%` }}
                />
              </div>
            </div>

            {total === 0 ? (
              <div className="mt-6 pt-3 border-t text-center py-4">
                <p className="text-gray-500">Aucune équipe trouvée pour ce programme</p>
              </div>
            ) : topTeams.length > 0 ? (
              <div className="mt-6 pt-3 border-t">
                <p className="text-sm text-gray-500 mb-3">Meilleures Performances</p>
                <ScrollArea className="h-[120px]">
                  <div className="space-y-2">
                    {topTeams.map((team) => {
                      const score = calculateOverallScore(team.evaluationCriteria);
                      const isAtRisk = score <= 50;

                      return (
                        <div key={team.id} className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center space-x-3">
                            <img
                              src={team.logo}
                              alt={`${team.name} logo`}
                              className="w-8 h-8 rounded-full"
                            />
                            <div>
                              <p className="font-medium text-sm">{team.name}</p>
                              <p className="text-xs text-gray-500">{team.industry}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm font-medium ${isAtRisk ? 'text-red-600' : 'text-green-600'}`}>
                              {score.toFixed(1)}%
                            </span>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="mt-6 pt-3 border-t text-center py-4">
                <p className="text-gray-500">Aucune équipe évaluée pour ce programme</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default NumberOfTeamsWidget;