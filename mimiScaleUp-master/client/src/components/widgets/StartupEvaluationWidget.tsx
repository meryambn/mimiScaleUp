import React, { useState, useEffect } from 'react';
import { Award, MessageSquare, Star, Check, X, User, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useProgramContext } from '@/context/ProgramContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { getCriteres } from '@/services/programService';

interface Mentor {
  id: number;
  nom: string;
  prenom: string;
  email?: string;
  avatar?: string;
}

interface Feedback {
  id: number;
  phaseId: number;
  text: string;
  createdAt: string;
  mentor: Mentor;
  score?: number;
}

interface EvaluationCriterion {
  id: string | number;
  name: string;
  description?: string;
  type?: 'numeric' | 'star_rating' | 'yes_no' | 'liste_deroulante' | 'stars' | 'etoiles' | 'oui_non' | 'numerique';
  options?: string[];
  value?: number | string | boolean;
  filledBy?: 'mentors' | 'teams' | 'equipes';
  nom_critere?: string;
  score?: number;
}

const StartupEvaluationWidget: React.FC = () => {
  const { selectedProgram, selectedPhaseId } = useProgramContext();
  const selectedProgramId = selectedProgram?.id;

  // Fetch evaluation criteria from API using the programService
  const { data: apiCriteria = [], isLoading } = useQuery<EvaluationCriterion[]>({
    queryKey: ['evaluation-criteria', selectedProgramId, selectedPhaseId],
    queryFn: async () => {
      console.log('StartupEvaluationWidget - Fetching criteria with:', {
        selectedProgramId,
        selectedPhaseId,
        hasProgram: !!selectedProgram,
        hasPhases: selectedProgram ? !!selectedProgram.phases : false
      });

      // Hardcoded phase ID for testing with program 204
      // This is temporary to test with the criteria we created
      const testPhaseId = 110;
      console.log(`Using test phase ID: ${testPhaseId} for testing`);

      try {
        // Use the getCriteres function from programService with our test phase ID
        console.log(`Fetching criteria for phase ${testPhaseId} using programService.getCriteres`);
        const criteria = await getCriteres(testPhaseId);
        console.log('Fetched criteria from API:', criteria);

        if (!criteria || criteria.length === 0) {
          console.log('No criteria found for phase, trying with program 204');
          // Try with program 204 directly
          const program204Criteria = await getCriteres(110);
          console.log('Fetched criteria for program 204:', program204Criteria);

          if (program204Criteria && program204Criteria.length > 0) {
            // Filter criteria that are accessible to teams (for startup interface)
            const accessibleCriteria = program204Criteria
              .filter((c: any) => c.accessible_equipes)
              .map(normalizeCriterion);

            console.log('Filtered criteria accessible to teams:', accessibleCriteria);
            return accessibleCriteria;
          }
        } else {
          // Filter criteria that are accessible to teams (for startup interface)
          const accessibleCriteria = criteria
            .filter((c: any) => c.accessible_equipes)
            .map(normalizeCriterion);

          console.log('Filtered criteria accessible to teams:', accessibleCriteria);
          return accessibleCriteria;
        }
      } catch (error) {
        console.error('Error fetching criteria from API:', error);
      }

      // Fallback to ProgramContext if API call fails
      if (selectedProgram && selectedProgram.phases) {
        const allCriteria: EvaluationCriterion[] = [];

        // If a specific phase is selected, only get criteria for that phase
        if (selectedPhaseId) {
          const phase = selectedProgram.phases.find(p => p.id === selectedPhaseId);
          if (phase && phase.evaluationCriteria) {
            return phase.evaluationCriteria
              .filter((c: any) => c.accessible_equipes !== false)
              .map(normalizeCriterion);
          }
        } else {
          // Otherwise get all criteria from all phases
          for (const phase of selectedProgram.phases) {
            if (phase.evaluationCriteria) {
              const phaseCriteria = phase.evaluationCriteria
                .filter((c: any) => c.accessible_equipes !== false)
                .map(normalizeCriterion);

              allCriteria.push(...phaseCriteria);
            }
          }

          return allCriteria;
        }
      }

      return [];
    },
    enabled: true, // Always enable the query
  });

  // Sample criteria to show when there's no data
  const sampleCriteria: EvaluationCriterion[] = [
    {
      id: 'sample-1',
      name: '[SAMPLE] Potentiel d\'innovation',
      description: 'Évaluation du caractère innovant du projet (données d\'exemple)',
      score: 4,
      type: 'star_rating',
      value: 4,
      filledBy: 'teams'
    },
    {
      id: 'sample-2',
      name: '[SAMPLE] Viabilité économique',
      description: 'Évaluation de la viabilité économique du projet (données d\'exemple)',
      score: 85,
      type: 'numeric',
      value: 85,
      filledBy: 'mentors'
    },
    {
      id: 'sample-3',
      name: '[SAMPLE] Conformité réglementaire',
      description: 'Le projet est-il conforme aux réglementations en vigueur? (données d\'exemple)',
      score: 100,
      type: 'yes_no',
      value: true,
      filledBy: 'teams'
    },
    {
      id: 'sample-4',
      name: '[SAMPLE] Stade de développement',
      description: 'À quel stade se trouve le développement du projet? (données d\'exemple)',
      score: 60,
      type: 'liste_deroulante',
      options: ['Idée', 'Prototype', 'MVP', 'Commercialisation', 'Croissance'],
      value: 'Prototype',
      filledBy: 'mentors'
    }
  ];

  // Use sample criteria if no real criteria are available
  const criteria = apiCriteria.length > 0 ? apiCriteria : sampleCriteria;

  // Debug log to verify what criteria are being used
  console.log('StartupEvaluationWidget - Using criteria:', {
    count: criteria.length,
    fromApi: apiCriteria.length > 0,
    programId: selectedProgramId,
    phaseId: selectedPhaseId,
    criteria: criteria.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      filledBy: c.filledBy
    }))
  });

  // Normalize criterion data to handle different property names
  const normalizeCriterion = (criterion: any): EvaluationCriterion => {
    // Extract options from the options field if it exists
    let options: string[] = [];
    if (criterion.options) {
      if (typeof criterion.options === 'string') {
        try {
          options = JSON.parse(criterion.options);
        } catch (e) {
          options = criterion.options.split(',').map((opt: string) => opt.trim());
        }
      } else if (Array.isArray(criterion.options)) {
        options = criterion.options;
      }
    }

    return {
      id: criterion.id || '',
      name: criterion.name || criterion.nom_critere || 'Critère sans nom',
      description: criterion.description || '',
      score: criterion.score || 0,
      type: normalizeType(criterion.type),
      options: options,
      value: criterion.value || null,
      filledBy: criterion.filledBy || criterion.rempli_par || 'teams',
    };
  };

  // Normalize type values from different sources
  const normalizeType = (type?: string): EvaluationCriterion['type'] => {
    if (!type) return 'star_rating';

    const typeStr = String(type).toLowerCase();
    if (typeStr.includes('star') || typeStr.includes('etoile')) {
      return 'star_rating';
    } else if (typeStr.includes('yes') || typeStr.includes('oui') || typeStr.includes('no') || typeStr.includes('non')) {
      return 'yes_no';
    } else if (typeStr.includes('num')) {
      return 'numeric';
    } else if (typeStr.includes('list') || typeStr.includes('drop') || typeStr.includes('deroul')) {
      return 'liste_deroulante';
    }

    return 'star_rating'; // Default
  };



  // Render the appropriate input component based on criterion type
  const renderCriterionInput = (criterion: EvaluationCriterion) => {
    const type = normalizeType(criterion.type);
    // Make inputs read-only if they're filled by mentors
    const isReadOnly = criterion.filledBy === 'mentors';

    switch (type) {
      case 'star_rating':
        return <StarRating criterion={criterion} readOnly={isReadOnly} />;
      case 'yes_no':
        return <YesNoButtons criterion={criterion} readOnly={isReadOnly} />;
      case 'numeric':
        return <NumericInput criterion={criterion} readOnly={isReadOnly} />;
      case 'liste_deroulante':
        return <DropdownSelect criterion={criterion} readOnly={isReadOnly} />;
      default:
        return <StarRating criterion={criterion} readOnly={isReadOnly} />;
    }
  };

  // Star Rating Component
  const StarRating = ({ criterion, readOnly = false }: { criterion: EvaluationCriterion, readOnly?: boolean }) => {
    const [rating, setRating] = useState<number>(criterion.value as number || 0);

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "h-5 w-5 transition-colors",
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300",
              !readOnly && "cursor-pointer hover:text-yellow-200"
            )}
            onClick={() => !readOnly && setRating(star)}
          />
        ))}
        <span className="ml-2 text-sm text-gray-500">
          {rating > 0 ? `${rating}/5` : 'Non évalué'}
        </span>
      </div>
    );
  };

  // Yes/No Buttons Component
  const YesNoButtons = ({ criterion, readOnly = false }: { criterion: EvaluationCriterion, readOnly?: boolean }) => {
    const [value, setValue] = useState<boolean | null>(criterion.value as boolean || null);

    return (
      <div className="flex items-center space-x-3">
        <button
          className={cn(
            "flex items-center space-x-1 px-3 py-1 rounded-md",
            value === true ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800",
            !readOnly && "hover:bg-gray-200"
          )}
          onClick={() => !readOnly && setValue(true)}
          disabled={readOnly}
        >
          <Check className="h-4 w-4" />
          <span>Oui</span>
        </button>
        <button
          className={cn(
            "flex items-center space-x-1 px-3 py-1 rounded-md",
            value === false ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800",
            !readOnly && "hover:bg-gray-200"
          )}
          onClick={() => !readOnly && setValue(false)}
          disabled={readOnly}
        >
          <X className="h-4 w-4" />
          <span>Non</span>
        </button>
        <span className="ml-2 text-sm text-gray-500">
          {value === null ? 'Non évalué' : value ? 'Oui' : 'Non'}
        </span>
      </div>
    );
  };

  // Numeric Input Component
  const NumericInput = ({ criterion, readOnly = false }: { criterion: EvaluationCriterion, readOnly?: boolean }) => {
    // Generate a random number if no value is provided
    const [value, setValue] = useState<number>(criterion.value as number || Math.floor(Math.random() * 1000));

    return (
      <div className="flex items-center space-x-2">
        <Input
          type="number"
          value={value || ''}
          onChange={(e) => !readOnly && setValue(Number(e.target.value))}
          className="w-24"
          readOnly={readOnly}
          disabled={readOnly}
        />
      </div>
    );
  };

  // Dropdown Select Component
  const DropdownSelect = ({ criterion, readOnly = false }: { criterion: EvaluationCriterion, readOnly?: boolean }) => {
    const [value, setValue] = useState<string>(criterion.value as string || '');
    const options = criterion.options || ['Option 1', 'Option 2', 'Option 3'];

    if (readOnly) {
      return (
        <div className="px-3 py-2 border rounded-md bg-gray-50 text-gray-700">
          {value || 'Non sélectionné'}
        </div>
      );
    }

    return (
      <Select value={value} onValueChange={setValue} disabled={readOnly}>
        <SelectTrigger className="w-full max-w-xs">
          <SelectValue placeholder="Sélectionner une option" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option, index) => (
            <SelectItem key={index} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  // Sample feedback data
  const sampleFeedback = {
    id: 1,
    phaseId: selectedPhaseId ? Number(selectedPhaseId) : 1,
    text: "L'équipe a montré une excellente compréhension des enjeux du marché. Leur approche est innovante et bien structurée. Je recommande de poursuivre dans cette direction en approfondissant l'analyse de la concurrence.",
    createdAt: new Date().toISOString(),
    mentor: {
      id: 1,
      nom: "Dupont",
      prenom: "Jean",
      email: "jean.dupont@example.com",
      avatar: ""
    },
    score: 85
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Calculate overall score
  const calculateOverallScore = () => {
    if (criteria.length === 0) return 0;
    return Math.round(criteria.reduce((sum, criterion) => sum + (criterion.score || 0), 0) / criteria.length);
  };

  // Group criteria by who fills them
  const teamCriteria = criteria.filter(c => c.filledBy === 'teams' || c.filledBy === 'equipes');
  const mentorCriteria = criteria.filter(c => c.filledBy === 'mentors');

  return (
    <div className="p-4" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold" style={{ color: '#0c4c80' }}>Critères d'Évaluation</h3>
        <Award className="h-5 w-5 text-blue-500" />
      </div>

      {criteria.length === 0 ? (
        <div className="text-center py-6 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-blue-600 font-medium">Aucun critère d'évaluation disponible pour ce programme.</p>
          <p className="text-blue-500 text-sm mt-2">Les critères d'évaluation apparaîtront ici une fois définis.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">Score Global</h4>
              <div className="text-2xl font-bold text-blue-600">{calculateOverallScore()}%</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${calculateOverallScore()}%` }}
              ></div>
            </div>
          </div>

          {/* Tabs for Team and Mentor Criteria */}
          <Tabs defaultValue="team">
            <TabsList className="w-full">
              <TabsTrigger value="team" className="flex-1">Critères à remplir par l'équipe</TabsTrigger>
              <TabsTrigger value="mentor" className="flex-1">Évaluation des mentors</TabsTrigger>
            </TabsList>

            {/* Team Criteria Tab */}
            <TabsContent value="team" className="mt-4">
              {teamCriteria.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  Aucun critère à remplir par l'équipe.
                </div>
              ) : (
                <div className="space-y-4">
                  {teamCriteria.map((criterion) => (
                    <div key={criterion.id} className="bg-white p-4 rounded-lg border">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{criterion.name}</h4>
                          {criterion.description && (
                            <p className="text-sm text-gray-600 mt-1">{criterion.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-4">
                        {renderCriterionInput(criterion)}
                      </div>
                    </div>
                  ))}

                  {/* Send Button for Team Criteria */}
                  <div className="flex justify-end mt-6">
                    <button
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      onClick={() => alert('Évaluation envoyée avec succès!')}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Envoyer l'évaluation
                    </button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Mentor Criteria Tab */}
            <TabsContent value="mentor" className="mt-4">
              {mentorCriteria.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  Aucune évaluation des mentors disponible.
                </div>
              ) : (
                <div className="space-y-4">
                  {mentorCriteria.map((criterion) => (
                    <div key={criterion.id} className="bg-white p-4 rounded-lg border">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{criterion.name}</h4>
                          {criterion.description && (
                            <p className="text-sm text-gray-600 mt-1">{criterion.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-4">
                        {renderCriterionInput(criterion)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Feedback Section */}
          <div className="bg-white p-4 rounded-lg border shadow-sm mt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium flex items-center">
                <MessageSquare className="h-4 w-4 mr-2" />
                Feedback du mentor
              </h4>
              <div className="text-xs text-gray-500">
                {sampleFeedback.createdAt ? new Date(sampleFeedback.createdAt).toLocaleDateString() : ''}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex items-center mb-3">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarFallback>{sampleFeedback.mentor.prenom[0]}{sampleFeedback.mentor.nom[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm">{sampleFeedback.mentor.prenom} {sampleFeedback.mentor.nom}</div>
                  <div className="text-xs text-gray-500">{sampleFeedback.mentor.email}</div>
                </div>
              </div>
              <p className="text-sm text-gray-700">{sampleFeedback.text}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StartupEvaluationWidget;
