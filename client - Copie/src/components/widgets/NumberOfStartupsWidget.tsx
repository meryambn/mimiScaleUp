import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, ChevronRight } from 'lucide-react';
import { useProgramContext } from '@/context/ProgramContext';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EvaluationCriterion {
  id: number;
  name: string;
  weight: number;
  score: number;
}

interface Startup {
  id: number;
  name: string;
  logo: string;
  industry: string;
  currentPhase: string;
  progress: number;
  status: 'active' | 'at_risk' | 'completed';
  programId: string;
  evaluationCriteria?: EvaluationCriterion[];
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
  const { selectedProgramId } = useProgramContext();
  
  // Mock data - this would come from an API in a real application
  const startups: Startup[] = [
    {
      id: 1,
      name: "EcoTech Solutions",
      logo: "https://via.placeholder.com/100/00C853/FFFFFF?text=ET",
      industry: "Clean Technology",
      currentPhase: "Phase 2: Development",
      progress: 65,
      status: 'active',
      programId: "1",
      evaluationCriteria: [
        { id: 1, name: 'Technology Innovation', weight: 35, score: 5 },
        { id: 2, name: 'Market Potential', weight: 30, score: 4 },
        { id: 3, name: 'Team Capability', weight: 20, score: 5 },
        { id: 4, name: 'Environmental Impact', weight: 15, score: 5 }
      ]
    },
    {
      id: 2,
      name: "HealthAI",
      logo: "https://via.placeholder.com/100/2196F3/FFFFFF?text=HAI",
      industry: "Healthcare Technology",
      currentPhase: "Phase 3: Market Testing",
      progress: 85,
      status: 'active',
      programId: "1",
      evaluationCriteria: [
        { id: 1, name: 'Clinical Efficacy', weight: 40, score: 5 },
        { id: 2, name: 'Technical Innovation', weight: 30, score: 4 },
        { id: 3, name: 'Market Readiness', weight: 30, score: 5 }
      ]
    },
    {
      id: 3,
      name: "FinFlow",
      logo: "https://via.placeholder.com/100/FFC107/000000?text=FF",
      industry: "FinTech",
      currentPhase: "Phase 1: Validation",
      progress: 30,
      status: 'at_risk',
      programId: "1",
      evaluationCriteria: [
        { id: 1, name: 'Financial Innovation', weight: 40, score: 2 },
        { id: 2, name: 'Market Fit', weight: 30, score: 1 },
        { id: 3, name: 'Team Experience', weight: 30, score: 3 }
      ]
    },
    {
      id: 4,
      name: "SmartAgri",
      logo: "https://via.placeholder.com/100/4CAF50/FFFFFF?text=SA",
      industry: "AgriTech",
      currentPhase: "Phase 2: Development",
      progress: 45,
      status: 'active',
      programId: "1",
      evaluationCriteria: [
        { id: 1, name: 'Agricultural Impact', weight: 35, score: 3 },
        { id: 2, name: 'Technical Feasibility', weight: 35, score: 2 },
        { id: 3, name: 'Scalability', weight: 30, score: 3 }
      ]
    },
    {
      id: 5,
      name: "CyberShield",
      logo: "https://via.placeholder.com/100/F44336/FFFFFF?text=CS",
      industry: "Cybersecurity",
      currentPhase: "Phase 4: Scaling",
      progress: 95,
      status: 'completed',
      programId: "1"
    }
  ];

  // Filter startups based on the selected program
  const programStartups = selectedProgramId 
    ? startups.filter(startup => startup.programId === selectedProgramId)
    : startups;

  // Calculate the number of active and at-risk startups based on evaluation scores
  const teamsWithEvaluation = programStartups.filter(startup => startup.evaluationCriteria && startup.evaluationCriteria.length > 0);
  
  // Count at risk teams (score <= 50%)
  const atRiskCount = teamsWithEvaluation.filter(
    startup => calculateOverallScore(startup.evaluationCriteria) <= 50
  ).length;
  
  // Count active teams (score > 50%)
  const activeCount = teamsWithEvaluation.filter(
    startup => calculateOverallScore(startup.evaluationCriteria) > 50
  ).length;
  
  // Count teams without evaluation
  const withoutEvaluationCount = programStartups.length - teamsWithEvaluation.length;
  
  const total = programStartups.length;
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
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-4">
            <Users className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm font-medium leading-none">Total</p>
              <h3 className="text-lg font-semibold">Teams</h3>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-2xl font-bold">{total}</div>
            <div className="flex items-center text-sm mt-1">
              <span className="text-green-600 font-medium">{activeCount} Active</span>
              <span className="mx-1 text-gray-400">|</span>
              <span className="text-red-600 font-medium">{atRiskCount} At Risk</span>
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

        {topTeams.length > 0 && (
          <div className="mt-6 pt-3 border-t">
            <p className="text-sm text-gray-500 mb-3">Top Performers</p>
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
        )}
      </CardContent>
    </Card>
  );
};

export default NumberOfTeamsWidget; 