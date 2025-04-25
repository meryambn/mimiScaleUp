import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Star, Filter, ChevronRight } from 'lucide-react';
import { useProgramContext } from '@/context/ProgramContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

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
  programId: string;
  description?: string;
  members?: TeamMember[];
  evaluationCriteria?: any[];
}

const MentorEvaluationsPage: React.FC = () => {
  const { selectedProgram } = useProgramContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [teams, setTeams] = useState<Startup[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Startup[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [phases, setPhases] = useState<{ id: string; name: string; color: string }[]>([]);

  // Load teams from localStorage
  useEffect(() => {
    try {
      const storedStartups = localStorage.getItem('startups');
      if (storedStartups) {
        const parsedStartups = JSON.parse(storedStartups);
        if (Array.isArray(parsedStartups)) {
          // Filter startups by selected program if available
          const programStartups = selectedProgram
            ? parsedStartups.filter((s) => s.programId === selectedProgram.id)
            : parsedStartups;
          
          setTeams(programStartups);
          setFilteredTeams(programStartups);
        }
      }
    } catch (error) {
      console.error('Error loading startups:', error);
    }
  }, [selectedProgram]);

  // Extract unique phases from teams
  useEffect(() => {
    const uniquePhases = Array.from(
      new Set(teams.map((team) => team.currentPhase))
    ).map((phase) => {
      // Generate a color based on the phase name
      const colors = [
        '#4f46e5', // indigo
        '#0ea5e9', // sky
        '#10b981', // emerald
        '#f59e0b', // amber
        '#ef4444', // red
      ];
      const index = Math.abs(phase.charCodeAt(0) + phase.charCodeAt(phase.length - 1)) % colors.length;
      
      return {
        id: phase,
        name: phase,
        color: colors[index],
      };
    });

    setPhases(uniquePhases);
  }, [teams]);

  // Filter teams based on search query and selected phase
  useEffect(() => {
    let filtered = [...teams];
    
    if (searchQuery) {
      filtered = filtered.filter(
        (team) =>
          team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          team.industry.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedPhase) {
      filtered = filtered.filter((team) => team.currentPhase === selectedPhase);
    }
    
    setFilteredTeams(filtered);
  }, [searchQuery, selectedPhase, teams]);

  if (!selectedProgram) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Aucun programme sélectionné</h1>
        <p className="text-gray-500 mb-6">Veuillez sélectionner un programme pour voir les équipes à évaluer.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Évaluations des équipes</h1>
          <p className="text-gray-500">{selectedProgram.name}</p>
        </div>
      </div>

      {/* Phase Timeline */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Phases du programme</CardTitle>
          <p className="text-sm text-gray-500">Cliquez sur une phase pour filtrer les équipes</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-2">
            {/* Phase Timeline Bar */}
            <div className="relative h-12 bg-gray-100 rounded-md overflow-hidden flex">
              {phases.map((phase) => (
                <div
                  key={phase.id}
                  className={`h-full cursor-pointer hover:opacity-90 flex items-center justify-center
                    ${selectedPhase === phase.id ? 'ring-2 ring-offset-2 ring-offset-white ring-blue-500 z-10' : ''}
                  `}
                  style={{
                    width: `${100 / phases.length}%`,
                    backgroundColor: phase.color,
                  }}
                  onClick={() => setSelectedPhase(phase.id === selectedPhase ? null : phase.id)}
                >
                  <span className="text-white font-medium text-xs md:text-sm truncate px-2">
                    {phase.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Rechercher des équipes..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtrer
          </Button>
        </div>
      </div>

      {/* Selected Phase Filter Display */}
      {selectedPhase && (
        <div className="mb-6 px-4 py-3 bg-blue-50 rounded-lg flex justify-between items-center">
          <div className="flex items-center">
            <div
              className="w-4 h-4 rounded-full mr-2"
              style={{ 
                backgroundColor: phases.find(p => p.id === selectedPhase)?.color || '#4f46e5' 
              }}
            ></div>
            <span className="font-medium">
              Filtré par phase : {selectedPhase}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedPhase(null)}
          >
            Effacer
          </Button>
        </div>
      )}

      {/* Teams List */}
      <div className="space-y-4">
        {filteredTeams.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Star className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Aucune équipe trouvée</h3>
            <p className="mt-1 text-sm text-gray-500">
              {selectedPhase
                ? `Il n'y a pas d'équipes dans la phase ${selectedPhase} correspondant à vos filtres.`
                : "Essayez d'ajuster vos filtres pour voir les équipes."}
            </p>
          </div>
        ) : (
          filteredTeams.map((team) => (
            <Card key={team.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="p-4 md:p-6 md:w-1/4 border-b md:border-r md:border-b-0 border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {team.logo ? (
                          <img src={team.logo} alt={team.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-lg font-bold text-gray-500">
                            {team.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{team.name}</h3>
                        <p className="text-sm text-gray-500">{team.industry}</p>
                      </div>
                    </div>
                    <div
                      className="mt-4 px-2 py-1 text-xs font-medium rounded-full inline-flex items-center"
                      style={{
                        backgroundColor: phases.find(p => p.id === team.currentPhase)?.color + '20',
                        color: phases.find(p => p.id === team.currentPhase)?.color
                      }}
                    >
                      {team.currentPhase}
                    </div>
                  </div>
                  <div className="flex-1 p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {team.description || "Aucune description disponible."}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {team.members && team.members.length > 0 && (
                            <div className="text-sm text-gray-500">
                              <span className="font-medium">Membres:</span> {team.members.length}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 md:mt-0">
                        <Link href={`/teams/${team.id}`}>
                          <Button className="w-full md:w-auto">
                            Évaluer <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default MentorEvaluationsPage;
