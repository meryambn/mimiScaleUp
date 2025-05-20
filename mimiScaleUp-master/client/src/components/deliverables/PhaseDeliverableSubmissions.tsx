import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getPhases } from '@/services/programService';
import TeamDeliverableSubmissions from './TeamDeliverableSubmissions';

interface PhaseDeliverableSubmissionsProps {
  teamId: string;
  phaseName: string;
  programId: string;
}

/**
 * Component that fetches the phase ID from the backend and renders the TeamDeliverableSubmissions component
 * This solves the issue of the frontend using different phase IDs than the backend
 */
const PhaseDeliverableSubmissions: React.FC<PhaseDeliverableSubmissionsProps> = ({
  teamId,
  phaseName,
  programId
}) => {
  console.log('🔵🔵🔵 PHASEDELIVERABLESUBMISSIONS COMPONENT RENDERED 🔵🔵🔵');
  console.log('PhaseDeliverableSubmissions component props:', { teamId, phaseName, programId });

  // Add a useEffect to log when the component mounts
  React.useEffect(() => {
    console.log('🔵🔵🔵 PHASEDELIVERABLESUBMISSIONS COMPONENT MOUNTED 🔵🔵🔵');
    console.log('PhaseDeliverableSubmissions props at mount:', { teamId, phaseName, programId });

    return () => {
      console.log('🔵🔵🔵 PHASEDELIVERABLESUBMISSIONS COMPONENT UNMOUNTED 🔵🔵🔵');
    };
  }, [teamId, phaseName, programId]);

  // Add a global console log that will be visible even if the component isn't fully rendered
  if (typeof window !== 'undefined') {
    window.console.log('🔵🔵🔵 PHASEDELIVERABLESUBMISSIONS GLOBAL LOG 🔵🔵🔵');
    window.console.log('PhaseDeliverableSubmissions props:', { teamId, phaseName, programId });

    // Add a direct alert to see if the component is being rendered
    setTimeout(() => {
      console.log('Showing alert from PhaseDeliverableSubmissions');
      // Uncomment the line below to show an alert
      // alert(`PhaseDeliverableSubmissions rendered with: teamId=${teamId}, phaseName=${phaseName}, programId=${programId}`);
    }, 1000);
  }

  const queryClient = useQueryClient();

  // Validate inputs
  const isValidTeamId = teamId && !isNaN(Number(teamId));
  const isValidProgramId = programId && !isNaN(Number(programId));

  // Fetch phases from the backend to get the correct phase ID
  const {
    data: phases = [],
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['backend-phases', programId],
    queryFn: async () => {
      if (!isValidProgramId) {
        console.error('Invalid program ID:', programId);
        return [];
      }

      console.log('Fetching phases from backend for program ID:', programId);
      try {
        const result = await getPhases(programId);
        console.log('Backend phases result:', result);
        return result;
      } catch (error) {
        console.error('Error fetching phases from backend:', error);
        throw error;
      }
    },
    enabled: isValidProgramId,
    staleTime: 60000, // 1 minute
    retry: 2
  });

  // Find the phase that matches the selected phase name
  const matchedPhase = React.useMemo(() => {
    if (!phases || phases.length === 0 || !phaseName) return null;

    console.log('Finding phase with name:', phaseName, 'in phases:', phases);

    // Try exact match first
    let match = phases.find(p =>
      p.nom.toLowerCase() === phaseName.toLowerCase()
    );

    // If no exact match, try partial match
    if (!match) {
      match = phases.find(p =>
        p.nom.toLowerCase().includes(phaseName.toLowerCase()) ||
        phaseName.toLowerCase().includes(p.nom.toLowerCase())
      );
    }

    // If still no match, try normalized match (remove accents)
    if (!match) {
      match = phases.find(p =>
        p.nom.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() ===
        phaseName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      );
    }

    if (match) {
      console.log('Found matching phase:', match);
    } else {
      console.error('No matching phase found for:', phaseName);
    }

    return match;
  }, [phases, phaseName]);

  // Get the phase ID
  const phaseId = matchedPhase?.id?.toString() || '';
  const isValidPhaseId = phaseId && !isNaN(Number(phaseId));

  // Log the phase ID for debugging
  React.useEffect(() => {
    console.log('PhaseDeliverableSubmissions - Phase ID:', {
      phaseName,
      phaseId,
      isValidPhaseId,
      matchedPhase
    });
  }, [phaseName, phaseId, isValidPhaseId, matchedPhase]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-gray-50 p-4 rounded-md text-center">
        <p className="text-gray-500">Chargement des informations de phase...</p>
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <h3 className="font-bold text-red-800">Erreur</h3>
        <p className="text-red-700 mb-2">
          {error instanceof Error ? error.message : "Erreur lors du chargement des phases"}
        </p>
        <button
          className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['backend-phases', programId] });
          }}
        >
          Réessayer
        </button>
      </div>
    );
  }

  // Show warning if no matching phase found
  if (!matchedPhase) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md">
        <h3 className="font-bold text-yellow-800">Phase non trouvée</h3>
        <p className="text-yellow-700 mb-2">
          Impossible de trouver la phase "{phaseName}" dans le programme.
        </p>
        <div className="mt-4 p-3 bg-white rounded-md border border-yellow-200">
          <h4 className="font-medium text-yellow-800 mb-2">Phases disponibles:</h4>
          {phases.length > 0 ? (
            <ul className="list-disc list-inside text-sm text-yellow-700">
              {phases.map((phase, index) => (
                <li key={index}>
                  {phase.nom} (ID: {phase.id})
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-yellow-700">Aucune phase trouvée pour ce programme.</p>
          )}
        </div>
      </div>
    );
  }

  // Show warning if IDs are invalid
  if (!isValidTeamId || !isValidPhaseId) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md">
        <h3 className="font-bold text-yellow-800">Attention</h3>
        <p className="text-yellow-700 mb-2">
          Impossible de charger les livrables car les identifiants ne sont pas valides.
        </p>
        <ul className="list-disc list-inside text-sm text-yellow-700">
          {!isValidTeamId && <li>ID d'équipe invalide: {teamId}</li>}
          {!isValidPhaseId && <li>ID de phase invalide: {phaseId}</li>}
        </ul>
      </div>
    );
  }

  // If everything is valid, render the TeamDeliverableSubmissions component
  // We'll also add a debug button to help troubleshoot
  return (
    <>
      <div className="mb-4 p-3 bg-blue-50 rounded text-xs">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-bold mb-1">Phase Debug Information</h4>
            <p><span className="font-semibold">Team ID:</span> {teamId} ({typeof teamId}) {!isNaN(Number(teamId)) ? '✓' : '❌'}</p>
            <p><span className="font-semibold">Phase Name:</span> {phaseName}</p>
            <p><span className="font-semibold">Program ID:</span> {programId} ({typeof programId}) {!isNaN(Number(programId)) ? '✓' : '❌'}</p>
            <p><span className="font-semibold">Matched Phase:</span> {matchedPhase ? `${matchedPhase.nom} (ID: ${matchedPhase.id})` : 'None'}</p>
            <p><span className="font-semibold">Phase ID:</span> {phaseId} ({typeof phaseId}) {!isNaN(Number(phaseId)) ? '✓' : '❌'}</p>
            <p><span className="font-semibold">Total Phases:</span> {phases.length}</p>
          </div>
          <div className="flex space-x-2">
            <button
              className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
              onClick={() => {
                console.log('Debug - PhaseDeliverableSubmissions:', {
                  teamId,
                  phaseId,
                  phaseName,
                  matchedPhase,
                  programId,
                  phases
                });
              }}
            >
              Log State
            </button>
            <button
              className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs"
              onClick={() => {
                // Force refresh
                queryClient.invalidateQueries({ queryKey: ['backend-phases', programId] });
                queryClient.invalidateQueries({ queryKey: ['team-deliverable-submissions', teamId] });
                queryClient.invalidateQueries({ queryKey: ['phase-deliverables', phaseId] });
              }}
            >
              Refresh Data
            </button>
            <button
              className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs"
              onClick={async () => {
                try {
                  // Manually fetch data from the API
                  console.log('Manually fetching phases from API...');

                  // Fetch phases
                  const phasesResponse = await fetch(`/api/phase/programme/${programId}`);
                  const phasesData = await phasesResponse.json();
                  console.log('API phases:', phasesData);

                  // Find matching phase
                  const matchingPhase = phasesData.find(p =>
                    p.nom.toLowerCase() === phaseName.toLowerCase()
                  );
                  console.log('Matching phase:', matchingPhase);

                  // If we found a matching phase, check deliverables and submissions
                  let deliverablesData = [];
                  let submissionsData = [];
                  let filteredSubmissions = [];

                  if (matchingPhase) {
                    // Fetch deliverables for the phase
                    const deliverablesResponse = await fetch(`/api/liverable/get/${matchingPhase.id}`);
                    deliverablesData = await deliverablesResponse.json();
                    console.log('API deliverables for phase:', deliverablesData);

                    // Fetch submissions for the team
                    const submissionsResponse = await fetch(`/api/livrable-soumissions/equipe/${teamId}`);
                    submissionsData = await submissionsResponse.json();
                    console.log('API submissions for team:', submissionsData);

                    // Filter submissions by phase
                    const phaseDeliverableIds = deliverablesData.map(d => d.id);
                    console.log('Phase deliverable IDs:', phaseDeliverableIds);

                    // Check each submission's livrable_id
                    submissionsData.forEach(s => {
                      console.log(`Submission ID ${s.id} - livrable_id: ${s.livrable_id}, matches phase: ${phaseDeliverableIds.includes(s.livrable_id)}`);
                    });

                    filteredSubmissions = submissionsData.filter(s =>
                      phaseDeliverableIds.includes(s.livrable_id)
                    );
                    console.log('Filtered submissions:', filteredSubmissions);
                  }

                  // Show alert with results
                  alert(
                    `Manual API check:\n` +
                    `- Team ID: ${teamId}\n` +
                    `- Program ID: ${programId}\n` +
                    `- Phase Name: ${phaseName}\n` +
                    `- Total phases: ${phasesData.length}\n` +
                    `- Matching phase: ${matchingPhase ? `${matchingPhase.nom} (ID: ${matchingPhase.id})` : 'None'}\n\n` +
                    (matchingPhase ?
                      `- Deliverables for phase: ${deliverablesData.length}\n` +
                      `- Total submissions for team: ${submissionsData.length}\n` +
                      `- Filtered submissions: ${filteredSubmissions.length}\n\n` +
                      `See console for details.` :
                      `No matching phase found. Check the phase name.`)
                  );
                } catch (error) {
                  console.error('Error in manual API check:', error);
                  alert(`Error in manual API check: ${error.message}`);
                }
              }}
            >
              Check Phases API
            </button>
            <button
              className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs"
              onClick={async () => {
                try {
                  // Directly render TeamDeliverableSubmissions
                  console.log('Attempting to directly render TeamDeliverableSubmissions...');

                  // Fetch phases to get the phase ID
                  const phasesResponse = await fetch(`/api/phase/programme/${programId}`);
                  const phasesData = await phasesResponse.json();

                  // Find matching phase
                  const matchingPhase = phasesData.find(p =>
                    p.nom.toLowerCase() === phaseName.toLowerCase()
                  );

                  if (matchingPhase) {
                    const phaseId = matchingPhase.id.toString();
                    console.log('Found matching phase with ID:', phaseId);

                    // Create a div to render the component
                    const div = document.createElement('div');
                    div.style.padding = '20px';
                    div.style.backgroundColor = '#f8f9fa';
                    div.style.border = '1px solid #ddd';
                    div.style.borderRadius = '5px';
                    div.style.marginTop = '20px';

                    // Add a heading
                    const heading = document.createElement('h3');
                    heading.textContent = 'Direct TeamDeliverableSubmissions Rendering';
                    heading.style.marginBottom = '10px';
                    div.appendChild(heading);

                    // Add the component info
                    const info = document.createElement('p');
                    info.textContent = `Rendering TeamDeliverableSubmissions with teamId=${teamId} and phaseId=${phaseId}`;
                    div.appendChild(info);

                    // Add the div to the document
                    document.body.appendChild(div);

                    // Alert the user
                    alert(`Direct rendering attempted with:\n- teamId: ${teamId}\n- phaseId: ${phaseId}\n\nCheck the console for details.`);
                  } else {
                    alert('No matching phase found. Cannot render TeamDeliverableSubmissions.');
                  }
                } catch (error) {
                  console.error('Error in direct rendering:', error);
                  alert(`Error in direct rendering: ${error.message}`);
                }
              }}
            >
              Direct Render
            </button>
          </div>
        </div>
      </div>
      <TeamDeliverableSubmissions
        teamId={teamId}
        phaseId={phaseId}
      />
    </>
  );
};

export default PhaseDeliverableSubmissions;
