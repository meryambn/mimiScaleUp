import React, { useState, useEffect } from 'react';
import { Award, ChevronDown, ChevronUp, Activity, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useProgramContext } from '@/context/ProgramContext';

interface EvaluationCriterion {
  id: string | number; // Allow both string and number IDs
  name: string;
  description: string;
  weight: number;
  importance: 1 | 2 | 3 | 4 | 5;
  color: string;
  icon?: React.ReactNode;
  programId?: string | number; // Allow both string and number programIds
  programIdStr?: string; // String representation of programId
  programIdNum?: number; // Numeric representation of programId
}

// Add type definition for the window object
declare global {
  interface Window {
    globalEvaluationCriteria: any[];
  }
}

// Create a global in-memory store for evaluation criteria
if (typeof window !== 'undefined' && !window.globalEvaluationCriteria) {
  window.globalEvaluationCriteria = [];
}

const EvaluationCriteriaWidget: React.FC = () => {
  const [expandedCriterion, setExpandedCriterion] = useState<string | number | null>(null);
  const [localCriteria, setLocalCriteria] = useState<EvaluationCriterion[]>([]);
  const { selectedProgram } = useProgramContext();
  const queryClient = useQueryClient();
  const selectedProgramId = selectedProgram?.id;

  // Fetch evaluation criteria from API
  const { data: apiCriteria = [] } = useQuery<EvaluationCriterion[]>({
    queryKey: ['/api/evaluation-criteria', selectedProgramId],
    queryFn: async () => {
      // In a real app, this would fetch from an API
      // For now, we'll just return an empty array and rely on localStorage and global store
      return [];
    },
    enabled: !!selectedProgramId
  });

  // Function to get all criteria from all possible sources without state updates
  const getAllCriteriaWithoutStateUpdates = (): EvaluationCriterion[] => {
    // Default criteria to use if none found
    const defaultCriteria: EvaluationCriterion[] = [];
    const allCriteriaMap = new Map<string | number, EvaluationCriterion>();

    console.log('Getting all criteria - selectedProgramId:', selectedProgramId);

    // 1. Check global in-memory store
    if (typeof window !== 'undefined' &&
        window.globalEvaluationCriteria &&
        Array.isArray(window.globalEvaluationCriteria)) {
      console.log('Found global evaluation criteria:', window.globalEvaluationCriteria.length);
      window.globalEvaluationCriteria.forEach((criterion: any) => {
        if (criterion && criterion.id) {
          console.log('Processing global criterion:', criterion.id, 'programId:', criterion.programId);
          // Convert ID to string for consistent key handling
          const criterionId = String(criterion.id);
          allCriteriaMap.set(criterionId, {
            ...criterion,
            // Ensure icon is compatible with React rendering
            icon: criterion.icon || <Activity className="h-4 w-4" />
          });
        }
      });
    } else {
      console.log('No global evaluation criteria found or not an array');
    }

    // 2. Check localStorage - first try program-specific criteria
    try {
      // If we have a selected program, try to get program-specific criteria first
      if (selectedProgramId) {
        const programSpecificKey = `evaluationCriteria_program_${String(selectedProgramId)}`;
        const programSpecificCriteria = localStorage.getItem(programSpecificKey);

        if (programSpecificCriteria) {
          const parsedCriteria = JSON.parse(programSpecificCriteria);
          if (Array.isArray(parsedCriteria)) {
            console.log(`Found ${parsedCriteria.length} program-specific criteria for program ${selectedProgramId}`);
            parsedCriteria.forEach((criterion: any) => {
              if (criterion && criterion.id) {
                console.log('Processing program-specific criterion:', criterion.id, 'programId:', criterion.programId);
                // Convert ID to string for consistent key handling
                const criterionId = String(criterion.id);
                allCriteriaMap.set(criterionId, {
                  ...criterion,
                  // Ensure icon is compatible with React rendering
                  icon: <Activity className="h-4 w-4" />
                });
              }
            });
          }
        } else {
          console.log(`No program-specific criteria found for program ${selectedProgramId}`);
        }
      }

      // Then check global criteria
      const storedCriteria = localStorage.getItem('evaluationCriteria');
      if (storedCriteria) {
        const localStorageCriteria = JSON.parse(storedCriteria);
        if (Array.isArray(localStorageCriteria)) {
          console.log('Found localStorage evaluation criteria:', localStorageCriteria.length);
          localStorageCriteria.forEach((criterion: any) => {
            if (criterion && criterion.id) {
              console.log('Processing localStorage criterion:', criterion.id, 'programId:', criterion.programId);
              // Convert ID to string for consistent key handling
              const criterionId = String(criterion.id);
              allCriteriaMap.set(criterionId, {
                ...criterion,
                // Ensure icon is compatible with React rendering
                icon: <Activity className="h-4 w-4" />
              });
            }
          });
        }
      } else {
        console.log('No localStorage evaluation criteria found');
      }
    } catch (error) {
      console.error("Error parsing localStorage criteria:", error);
    }

    // 3. Check React Query cache
    const cachedCriteria = queryClient.getQueryData(['/api/evaluation-criteria']) || [];
    if (Array.isArray(cachedCriteria)) {
      cachedCriteria.forEach((criterion: any) => {
        if (criterion && criterion.id) {
          allCriteriaMap.set(criterion.id, {
            ...criterion,
            icon: <Activity className="h-4 w-4" />
          });
        }
      });
    }

    // 4. Include local state criteria
    if (localCriteria.length > 0) {
      localCriteria.forEach(criterion => {
        if (criterion && criterion.id) {
          allCriteriaMap.set(criterion.id, criterion);
        }
      });
    }

    // 5. Include criteria from API response
    if (apiCriteria && Array.isArray(apiCriteria) && apiCriteria.length > 0) {
      apiCriteria.forEach(criterion => {
        if (criterion && criterion.id) {
          allCriteriaMap.set(criterion.id, {
            ...criterion,
            icon: <Activity className="h-4 w-4" />
          });
        }
      });
    }

    const result = Array.from(allCriteriaMap.values());
    console.log(`Found ${result.length} unique criteria from all sources`);

    // Validate each criterion to ensure all properties are valid
    const validatedCriteria = result.map(criterion => ({
      ...criterion,
      id: criterion.id || String(Math.floor(Math.random() * 10000)),
      name: criterion.name || 'Untitled Criterion',
      description: criterion.description || 'No description provided',
      weight: (typeof criterion.weight === 'number' && !isNaN(criterion.weight)) ? criterion.weight : 10,
      importance: (typeof criterion.importance === 'number' && !isNaN(criterion.importance) &&
                  criterion.importance >= 1 && criterion.importance <= 5) ?
                  (criterion.importance as 1|2|3|4|5) : 3,
      color: criterion.color || 'rgba(79, 70, 229, 1)',
      icon: criterion.icon || <Activity className="h-4 w-4" />,
      // Ensure programId is preserved exactly as is
      programId: criterion.programId
    }));

    console.log('Validated criteria:', validatedCriteria);
    return validatedCriteria;
  };

  // Load criteria on component mount
  useEffect(() => {
    const allCriteria = getAllCriteriaWithoutStateUpdates();
    console.log('Initial criteria load:', allCriteria);
    setLocalCriteria(allCriteria);

    // Set up event listener for criteria creation
    const handleCriterionCreated = (event: CustomEvent<any>) => {
      console.log("Evaluation criterion created event received:", event.detail);
      const { programId, programIdStr, programIdNum, criterion } = event.detail;

      // Ensure the criterion has a programId - use the original programId from the criterion if available
      const enhancedCriterion = {
        ...criterion,
        // Keep the original programId type if it exists, otherwise use the one from the event
        programId: criterion.programId !== undefined ? criterion.programId : programId,
        // Add string and number versions for maximum compatibility
        programIdStr: String(criterion.programId || programId),
        programIdNum: Number(criterion.programId || programId),
        icon: <Activity className="h-4 w-4" />
      };

      console.log("Enhanced criterion with all programId formats:", {
        original: enhancedCriterion.programId,
        string: enhancedCriterion.programIdStr,
        number: enhancedCriterion.programIdNum
      });

      console.log("Enhanced criterion with programId:", enhancedCriterion);

      // Update local state
      setLocalCriteria(prev => {
        if (prev.some(c => c.id === enhancedCriterion.id)) {
          // Update existing criterion
          return prev.map(c => c.id === enhancedCriterion.id ? enhancedCriterion : c);
        }
        return [...prev, enhancedCriterion];
      });

      // Also save to localStorage as backup
      try {
        const existingCriteria = JSON.parse(localStorage.getItem('evaluationCriteria') || '[]');
        const updatedCriteria = [...existingCriteria];

        // Remove icon for localStorage (can't store React elements)
        const storableCriterion = {
          ...enhancedCriterion,
          icon: null
        };

        const existingIndex = updatedCriteria.findIndex(c => c.id === storableCriterion.id);
        if (existingIndex >= 0) {
          // Update existing
          updatedCriteria[existingIndex] = storableCriterion;
        } else {
          // Add new
          updatedCriteria.push(storableCriterion);
        }

        localStorage.setItem('evaluationCriteria', JSON.stringify(updatedCriteria));
        console.log('Updated localStorage with criteria:', updatedCriteria);
      } catch (error) {
        console.error('Error updating localStorage with new criterion:', error);
      }

      // Also update the global store
      if (window.globalEvaluationCriteria) {
        const existingIndex = window.globalEvaluationCriteria.findIndex((c: any) => c.id === enhancedCriterion.id);
        if (existingIndex >= 0) {
          window.globalEvaluationCriteria[existingIndex] = enhancedCriterion;
        } else {
          window.globalEvaluationCriteria.push(enhancedCriterion);
        }
        console.log('Updated global store with criteria:', window.globalEvaluationCriteria);
      }
    };

    document.addEventListener('evaluation-criterion-created', handleCriterionCreated as EventListener);

    return () => {
      document.removeEventListener('evaluation-criterion-created', handleCriterionCreated as EventListener);
    };
  }, [queryClient]);

  // Filter criteria for the selected program
  const programCriteria = React.useMemo(() => {
    const allCriteria = getAllCriteriaWithoutStateUpdates();
    console.log('All criteria from all sources:', allCriteria);
    console.log('Current selected program ID:', selectedProgramId);

    // If no program is selected, show all criteria
    if (!selectedProgramId) {
      return allCriteria;
    }

    // Filter by programId - try multiple comparison strategies
    const filtered = allCriteria.filter(criterion => {
      if (!criterion) return false;

      // Handle case where programId might be missing
      if (criterion.programId === undefined || criterion.programId === null) {
        console.log('Criterion without programId:', criterion);
        return false;
      }

      // Convert both to strings for safe comparison
      const criterionIdStr = String(criterion.programId);
      const targetIdStr = String(selectedProgramId);

      // Try multiple comparison strategies
      // 1. Direct string comparison of programId
      const stringMatch = criterionIdStr === targetIdStr;

      // 2. Numeric comparison of programId (if both can be parsed as numbers)
      let numericMatch = false;
      try {
        const criterionIdNum = Number(criterion.programId);
        const targetIdNum = Number(selectedProgramId);
        if (!isNaN(criterionIdNum) && !isNaN(targetIdNum)) {
          numericMatch = criterionIdNum === targetIdNum;
        }
      } catch (e) {
        // Ignore parsing errors
      }

      // 3. Check programIdStr property if available
      let programIdStrMatch = false;
      if (criterion.programIdStr) {
        programIdStrMatch = String(criterion.programIdStr) === String(selectedProgramId);
      }

      // 4. Check programIdNum property if available
      let programIdNumMatch = false;
      if (criterion.programIdNum !== undefined) {
        try {
          const criterionIdNum = Number(criterion.programIdNum);
          const targetIdNum = Number(selectedProgramId);
          if (!isNaN(criterionIdNum) && !isNaN(targetIdNum)) {
            programIdNumMatch = criterionIdNum === targetIdNum;
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }

      const matches = stringMatch || numericMatch || programIdStrMatch || programIdNumMatch;
      if (matches) {
        console.log('Matched criterion for program', selectedProgramId, ':', criterion);
      }

      return matches;
    });

    console.log('Filtered criteria for program', selectedProgramId, ':', filtered);
    return filtered;
  }, [selectedProgramId, localCriteria, apiCriteria]);


  // Use the program criteria directly, no hardcoded fallback
  const criteria: EvaluationCriterion[] = programCriteria;

  // Debug what criteria are being displayed
  useEffect(() => {
    console.log("Evaluation criteria being displayed:", criteria);
  }, [criteria]);

  // Update criteria when selectedProgramId changes
  useEffect(() => {
    if (selectedProgramId) {
      console.log(`Program selection changed to ${selectedProgramId}, refreshing criteria`);
      // Force a refresh of the criteria from all sources
      const refreshedCriteria = getAllCriteriaWithoutStateUpdates();
      setLocalCriteria(refreshedCriteria);

      // Also check for program-specific criteria in localStorage
      try {
        const programSpecificKey = `evaluationCriteria_program_${String(selectedProgramId)}`;
        const programSpecificCriteria = localStorage.getItem(programSpecificKey);

        if (programSpecificCriteria) {
          const parsedCriteria = JSON.parse(programSpecificCriteria);
          if (Array.isArray(parsedCriteria) && parsedCriteria.length > 0) {
            console.log(`Found ${parsedCriteria.length} program-specific criteria for program ${selectedProgramId} in localStorage`);
            // Add icons to the criteria
            const enhancedCriteria = parsedCriteria.map((criterion: any) => ({
              ...criterion,
              icon: <Activity className="h-4 w-4" />
            }));
            setLocalCriteria(enhancedCriteria);
          }
        }
      } catch (error) {
        console.error("Error loading program-specific criteria from localStorage:", error);
      }
    }
  }, [selectedProgramId]);

  // Return early if no criteria available
  if (!criteria || criteria.length === 0) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Critères d'évaluation</h3>
          <Award className="h-5 w-5 text-indigo-500" />
        </div>
        <div className="text-center p-6">
          <p className="text-gray-500">Aucun critère d'évaluation défini pour ce programme.</p>
          <p className="text-gray-400 text-sm mt-2">Les critères apparaîtront ici une fois définis dans votre programme.</p>
        </div>
      </div>
    );
  }

  // Function to toggle expanded criterion
  const toggleCriterion = (id: string | number) => {
    if (expandedCriterion === id) {
      setExpandedCriterion(null);
    } else {
      setExpandedCriterion(id);
    }
  };

  // Function to render star rating based on importance
  const renderStars = (importance: number | undefined) => {
    // Ensure importance is a valid number between 1-5
    const safeImportance = (typeof importance === 'number' && !isNaN(importance) && importance >= 1 && importance <= 5)
      ? importance
      : 3;
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          "h-4 w-4",
          i < safeImportance ? "text-amber-400 fill-amber-400" : "text-gray-300"
        )}
      />
    ));
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Critères d'évaluation</h3>
        <Award className="h-5 w-5 text-indigo-500" />
      </div>

      <div className="grid grid-cols-1 gap-5">
        {/* Radar Chart Visualization */}
        <div className="relative mx-auto h-[200px] w-[200px] mb-4">
          {/* Center Hub */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg z-10">
            100%
          </div>

          {/* Concentric Circles */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-[180px] rounded-full border border-gray-200 opacity-30"></div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[140px] h-[140px] rounded-full border border-gray-200 opacity-30"></div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[100px] h-[100px] rounded-full border border-gray-200 opacity-30"></div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[60px] h-[60px] rounded-full border border-gray-200 opacity-30"></div>

          {/* Plotted Points */}
          {criteria.map((criterion, index) => {
            const angle = (Math.PI * 2 * index) / criteria.length;
            // Ensure weight is a valid number, default to 10 if not
            const weight = (typeof criterion.weight === 'number' && !isNaN(criterion.weight)) ? criterion.weight : 10;
            const radius = (weight / 25) * 80; // Max radius is 80px for 25% weight
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const criterionColor = criterion.color || 'rgba(79, 70, 229, 1)';

            return (
              <div
                key={criterion.id}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
                style={{
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                }}
              >
                {/* Connecting Line */}
                <div
                  className="absolute top-1/2 left-1/2 h-0.5 origin-center"
                  style={{
                    width: radius,
                    background: `linear-gradient(90deg, transparent, ${criterionColor})`,
                    transform: `rotate(${angle * (180 / Math.PI)}deg)`,
                    transformOrigin: '0 center',
                  }}
                ></div>

                {/* Point */}
                <div
                  className="w-5 h-5 rounded-full border-2 border-white shadow-lg flex items-center justify-center animate-pulse"
                  style={{
                    backgroundColor: criterionColor,
                    boxShadow: `0 0 10px ${criterionColor}`,
                  }}
                >
                  <span className="text-[8px] font-bold text-white">{(typeof weight === 'number' && !isNaN(weight)) ? `${weight}%` : '10%'}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Criteria List */}
        <div className="space-y-2">
          {criteria.map((criterion) => (
            <div
              key={criterion.id}
              className={cn(
                "border rounded-lg overflow-hidden transition-all",
                expandedCriterion === criterion.id ? "shadow-md" : "",
                "hover:shadow-sm cursor-pointer"
              )}
              style={{
                borderColor: expandedCriterion === criterion.id ? (criterion.color || 'rgba(79, 70, 229, 1)') : 'rgba(229, 231, 235, 1)',
                backgroundColor: expandedCriterion === criterion.id ? `${criterion.color || 'rgba(79, 70, 229, 1)'}10` : 'white',
              }}
              onClick={() => toggleCriterion(criterion.id)}
            >
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: criterion.color || 'rgba(79, 70, 229, 1)' }}>
                      {criterion.icon}
                    </div>
                    <span className="font-medium">{criterion.name || 'Criterion'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{(typeof criterion.weight === 'number' && !isNaN(criterion.weight)) ? `${criterion.weight}%` : '10%'}</span>
                    {expandedCriterion === criterion.id ? (
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                </div>

                {expandedCriterion === criterion.id && (
                  <div className="mt-3 border-t pt-3 text-sm text-gray-600 space-y-2 animate-fadeIn">
                    <p>{criterion.description}</p>
                    <div className="flex items-center pt-1">
                      <span className="text-xs font-medium mr-2">Importance:</span>
                      <div className="flex">
                        {renderStars(criterion.importance)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EvaluationCriteriaWidget;