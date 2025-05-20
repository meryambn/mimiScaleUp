import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getTeamDeliverableSubmissions, getPhaseDeliverables } from '@/services/deliverableService';
import DeliverableSubmissionCard from './DeliverableSubmissionCard';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileCheck, AlertCircle, Clock } from 'lucide-react';

interface TeamDeliverableSubmissionsProps {
  teamId: string;
  phaseId: string;
}

const TeamDeliverableSubmissions: React.FC<TeamDeliverableSubmissionsProps> = ({
  teamId,
  phaseId
}) => {


  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin' || user?.role === 'mentor';
  const [activeTab, setActiveTab] = useState<string>('all');

  // Add state to track the current phase ID
  const [currentPhaseId, setCurrentPhaseId] = useState<string>(phaseId);

  // Force invalidate queries when props change to ensure fresh data
  React.useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['team-deliverable-submissions', teamId] });
    queryClient.invalidateQueries({ queryKey: ['phase-deliverables', phaseId] });
  }, [teamId, phaseId, queryClient]);

  // Fetch deliverable submissions for the team
  const {
    data: submissions = [],
    isLoading: isLoadingSubmissions,
    isError: isErrorSubmissions,
    error: submissionsError,
    refetch: refetchSubmissions
  } = useQuery({
    queryKey: ['team-deliverable-submissions', teamId],
    queryFn: async () => {
      try {
        if (!teamId) {
          return [];
        }

        // Validate teamId is a number or can be converted to a number
        if (isNaN(Number(teamId))) {
          throw new Error('ID d\'équipe invalide. L\'ID doit être un nombre.');
        }

        // Make sure we're using the correct parameter name (candidatureId)
        // This is the ID expected by the backend API
        const candidatureId = teamId;

        const result = await getTeamDeliverableSubmissions(candidatureId);

        // Validate the result
        if (!Array.isArray(result)) {
          return [];
        }

        return result;
      } catch (error) {
        throw error;
      }
    },
    enabled: !!teamId && teamId !== '' && !isNaN(Number(teamId)),
    staleTime: 30000, // 30 seconds
    retry: 2, // Retry failed requests up to 2 times
  });

  // Fetch deliverables for the phase to get their names
  const {
    data: deliverables = [],
    isLoading: isLoadingDeliverables,
    isError: isErrorDeliverables,
    error: deliverablesError,
    refetch: refetchDeliverables
  } = useQuery({
    queryKey: ['phase-deliverables', phaseId],
    queryFn: async () => {
      try {
        if (!phaseId) {
          return [];
        }

        // Validate phaseId is a number or can be converted to a number
        if (isNaN(Number(phaseId))) {
          throw new Error('ID de phase invalide. L\'ID doit être un nombre.');
        }

        const result = await getPhaseDeliverables(phaseId);

        // Validate the result
        if (!Array.isArray(result)) {
          return [];
        }

        return result;
      } catch (error) {
        return []; // Return empty array to prevent component crashes
      }
    },
    enabled: !!phaseId && phaseId !== '' && !isNaN(Number(phaseId)),
    staleTime: 30000, // 30 seconds
    retry: 2, // Retry failed requests up to 2 times
  });

  // Update the current phase ID when the props change
  React.useEffect(() => {
    if (phaseId !== currentPhaseId) {
      setCurrentPhaseId(phaseId);

      // Force refetch data when phase changes
      queryClient.invalidateQueries({ queryKey: ['team-deliverable-submissions', teamId] });
      queryClient.invalidateQueries({ queryKey: ['phase-deliverables', phaseId] });

      // Add a small delay before refetching to ensure state updates have propagated
      setTimeout(() => {
        refetchSubmissions();
        refetchDeliverables();
      }, 100);
    }
  }, [phaseId, currentPhaseId, teamId, queryClient, refetchSubmissions, refetchDeliverables]);

  // Function to get deliverable name by ID
  const getLivrableName = (livrableId: number) => {
    // Validate input
    if (!livrableId || isNaN(Number(livrableId))) {
      return 'Livrable inconnu';
    }

    // Convert to number to ensure consistent comparison
    const livrableIdNum = Number(livrableId);

    // Check if deliverables array is valid
    if (!Array.isArray(deliverables) || deliverables.length === 0) {
      return 'Livrable inconnu';
    }

    // Try to find the deliverable by ID
    const deliverable = deliverables.find(d => {
      // Handle both string and number IDs
      const deliverableId = typeof d.id === 'string' ? parseInt(d.id) : d.id;
      return deliverableId === livrableIdNum;
    });

    // If found, return the name
    if (deliverable) {
      if (deliverable.nom) {
        return deliverable.nom;
      } else if (deliverable.name) {
        return deliverable.name;
      }
    }

    // If not found, return a default value
    return 'Livrable inconnu';
  };

  // Handle status update
  const handleStatusUpdate = () => {
    // Invalidate the query to refetch the data
    queryClient.invalidateQueries({ queryKey: ['team-deliverable-submissions', teamId] });
  };

  // First filter submissions by phase ID if provided
  const phaseFilteredSubmissions = React.useMemo(() => {
    if (!phaseId || !submissions || submissions.length === 0) {
      return submissions;
    }

    // DYNAMIC APPROACH: Filter based on the phase ID using the API data
    // First try to filter by livrable_id matching the phase's deliverables

    // Get the deliverable IDs for this phase from the API
    const phaseDeliverableIds = Array.isArray(deliverables)
      ? deliverables.map(d => d.id)
      : [];

    if (phaseDeliverableIds.length > 0) {
      const filteredByDeliverableId = submissions.filter(s =>
        phaseDeliverableIds.includes(s.livrable_id)
      );

      if (filteredByDeliverableId.length > 0) {
        return filteredByDeliverableId;
      }
    }

    // If no matches by deliverable ID, try filtering by phase_id
    const submissionsWithMatchingPhaseId = submissions.filter(s =>
      s.phase_id && s.phase_id.toString() === phaseId.toString()
    );

    if (submissionsWithMatchingPhaseId.length > 0) {
      return submissionsWithMatchingPhaseId;
    }

    // Fallback to filtering by name if needed
    if (phaseId === '109') {
      // Candidature phase - filter submissions with "Candidature" in the name
      const candidatureSubmissions = submissions.filter(s =>
        s.nom_livrable && s.nom_livrable.includes('Candidature')
      );
      return candidatureSubmissions;
    }
    else if (phaseId === '110') {
      // New Phase - filter submissions with "New Phase" in the name
      const newPhaseSubmissions = submissions.filter(s =>
        s.nom_livrable && s.nom_livrable.includes('New Phase')
      );
      return newPhaseSubmissions;
    }

    // Fallback to the original filtering logic

    // Check if any submissions have a phase_id property
    const submissionsWithPhaseId = submissions.filter(s => s.phase_id);

    // Check if any submissions have a phase_id that matches the current phase
    const submissionsWithMatchingPhaseIdFallback = submissions.filter(s =>
      s.phase_id && s.phase_id.toString() === phaseId.toString()
    );

    // Check if any submissions have a nom_livrable that contains the phase name
    const phaseNameMatches = submissions.filter(s => {
      if (s.nom_livrable && typeof s.nom_livrable === 'string') {
        // Try to extract phase name from the livrable name
        // For example, "Rapport technique - Phase Candidature" contains "Candidature"
        const match = s.nom_livrable.match(/Phase\s+(\w+)/i);
        if (match && match[1]) {
          const phaseNameInLivrable = match[1].toLowerCase();

          // Get the current phase name
          let currentPhaseName = '';
          if (phaseId === '109') {
            currentPhaseName = 'candidature';
          } else if (phaseId === '110') {
            currentPhaseName = 'new phase';
          }

          const matches = phaseNameInLivrable.includes(currentPhaseName.toLowerCase());
          return matches;
        }
      }
      return false;
    });

    // If we have submissions with matching phase name, return them
    if (phaseNameMatches.length > 0) {
      return phaseNameMatches;
    }

    // If we have submissions with matching phase_id, return them
    if (submissionsWithMatchingPhaseIdFallback.length > 0) {
      return submissionsWithMatchingPhaseIdFallback;
    }

    // Get the livrable_ids from the deliverables for this phase
    const phaseDeliverableIdsFallback = Array.isArray(deliverables)
      ? deliverables.map(d => d.id)
      : [];

    // If there are no deliverables for this phase, we'll try to match by livrable_id pattern
    if (phaseDeliverableIdsFallback.length === 0) {
      // First, check if any submissions have a phase_id property that matches the current phase
      const submissionsWithMatchingPhaseIdNoDeliverables = submissions.filter(submission =>
        submission.phase_id && submission.phase_id.toString() === phaseId.toString()
      );

      if (submissionsWithMatchingPhaseIdNoDeliverables.length > 0) {
        return submissionsWithMatchingPhaseIdNoDeliverables;
      }

      // Try to find submissions that might be for this phase based on their livrable name
      // This is a fallback mechanism when the deliverables API doesn't return data
      const filtered = submissions.filter(submission => {
        // If the submission has a phase_id property, use that
        if (submission.phase_id) {
          const matches = submission.phase_id.toString() === phaseId.toString();
          return matches;
        }

        // If the submission has a nom_livrable property that contains the phase name
        // This is a heuristic approach and might not be 100% accurate
        if (submission.nom_livrable && typeof submission.nom_livrable === 'string') {
          // Extract phase name from the URL or context
          const phaseNameFromUrl = window.location.pathname.split('/').pop();
          const phaseNameLower = phaseNameFromUrl ? phaseNameFromUrl.toLowerCase() : '';

          // Check if the livrable name contains the phase name
          const matches = submission.nom_livrable.toLowerCase().includes(phaseNameLower);
          return matches;
        }

        return false;
      });

      // If we still couldn't find any submissions, just return all submissions
      // This ensures that at least something is displayed
      if (filtered.length === 0) {
        return submissions;
      }

      return filtered;
    }

    // Filter submissions that match the phase's deliverables
    const filtered = submissions.filter(submission => {
      // If the submission already has a phase_id property, use that
      if (submission.phase_id) {
        const matches = submission.phase_id.toString() === phaseId.toString();
        return matches;
      }

      // Otherwise, check if the livrable_id is in the list of phase deliverable IDs
      const matches = phaseDeliverableIdsFallback.includes(submission.livrable_id);
      return matches;
    });

    return filtered;
  }, [submissions, phaseId, deliverables]);

  // Then filter by status tab
  const filteredSubmissions = phaseFilteredSubmissions.filter(submission => {
    if (activeTab === 'all') return true;
    return submission.statut === activeTab;
  });

  // Count submissions by status (using phase-filtered submissions)
  const pendingCount = phaseFilteredSubmissions.filter(s => s.statut === 'en attente').length;
  const validatedCount = phaseFilteredSubmissions.filter(s => s.statut === 'valide').length;
  const rejectedCount = phaseFilteredSubmissions.filter(s => s.statut === 'rejete').length;

  // Show loading state
  if (isLoadingSubmissions || isLoadingDeliverables) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mb-4"></div>
        <p>Chargement des livrables...</p>
      </div>
    );
  }

  // Show error state
  if (isErrorSubmissions || isErrorDeliverables) {


    // Extract error messages
    const submissionErrorMsg = submissionsError instanceof Error ? submissionsError.message :
      typeof submissionsError === 'string' ? submissionsError :
      submissionsError ? JSON.stringify(submissionsError) : '';

    const deliverableErrorMsg = deliverablesError instanceof Error ? deliverablesError.message :
      typeof deliverablesError === 'string' ? deliverablesError :
      deliverablesError ? JSON.stringify(deliverablesError) : '';

    // Combine error messages if both are present
    const errorMessage = submissionErrorMsg && deliverableErrorMsg
      ? `${submissionErrorMsg}; ${deliverableErrorMsg}`
      : submissionErrorMsg || deliverableErrorMsg || "Une erreur est survenue lors du chargement des livrables.";

    // Check if the error is related to invalid ID
    const isInvalidIdError = errorMessage.includes('ID') &&
      (errorMessage.includes('invalide') || errorMessage.includes('nombre'));

    return (
      <div className="bg-red-50 text-red-800 p-6 rounded-md">
        <h3 className="font-bold text-lg mb-2">Erreur</h3>
        <p className="mb-4">{errorMessage}</p>

        {isInvalidIdError ? (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <p className="text-yellow-700">
              <strong>Conseil:</strong> Vérifiez que l'ID de l'équipe et l'ID de la phase sont des nombres valides.
            </p>
          </div>
        ) : null}

        <div className="flex space-x-4">
          <button
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded"
            onClick={() => {
              // Retry loading the data
              if (isErrorSubmissions) {
                refetchSubmissions();
              }
              if (isErrorDeliverables) {
                refetchDeliverables();
              }
            }}
          >
            Réessayer
          </button>

          <button
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded"
            onClick={() => {
              // Force invalidate all queries
              queryClient.invalidateQueries();
            }}
          >
            Actualiser toutes les données
          </button>
        </div>
      </div>
    );
  }

  // Show empty state if no submissions
  if (submissions.length === 0) {
    // Check if we have deliverables for this phase
    const hasDeliverables = Array.isArray(deliverables) && deliverables.length > 0;

    return (
      <div className="bg-gray-50 p-8 rounded-lg text-center">
        <div className="text-gray-400 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun livrable soumis</h3>
        <p className="text-gray-500 mb-4">
          {hasDeliverables
            ? "Cette équipe n'a pas encore soumis de livrables pour cette phase."
            : "Aucun livrable n'est défini pour cette phase ou les IDs fournis ne correspondent pas à des données existantes."}
        </p>

        <div className="mt-4">
          <button
            className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['team-deliverable-submissions', teamId] });
              queryClient.invalidateQueries({ queryKey: ['phase-deliverables', phaseId] });
            }}
          >
            Actualiser
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-800">{pendingCount}</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800 flex items-center">
              <FileCheck className="h-4 w-4 mr-2" />
              Validés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-800">{validatedCount}</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              Rejetés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-800">{rejectedCount}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">
            Tous
            <Badge className="ml-2 bg-gray-100 text-gray-800">{phaseFilteredSubmissions.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="en attente">
            En attente
            <Badge className="ml-2 bg-yellow-100 text-yellow-800">{pendingCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="valide">
            Validés
            <Badge className="ml-2 bg-green-100 text-green-800">{validatedCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="rejete">
            Rejetés
            <Badge className="ml-2 bg-red-100 text-red-800">{rejectedCount}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          {filteredSubmissions.length > 0 ? (
            filteredSubmissions.map(submission => (
              <DeliverableSubmissionCard
                key={submission.id}
                submission={submission}
                livrableName={submission.nom_livrable || getLivrableName(submission.livrable_id)}
                onStatusUpdate={handleStatusUpdate}
                isAdmin={isAdmin}
              />
            ))
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Aucun livrable soumis.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="en attente" className="mt-0">
          {filteredSubmissions.length > 0 ? (
            filteredSubmissions.map(submission => (
              <DeliverableSubmissionCard
                key={submission.id}
                submission={submission}
                livrableName={submission.nom_livrable || getLivrableName(submission.livrable_id)}
                onStatusUpdate={handleStatusUpdate}
                isAdmin={isAdmin}
              />
            ))
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Aucun livrable en attente.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="valide" className="mt-0">
          {filteredSubmissions.length > 0 ? (
            filteredSubmissions.map(submission => (
              <DeliverableSubmissionCard
                key={submission.id}
                submission={submission}
                livrableName={submission.nom_livrable || getLivrableName(submission.livrable_id)}
                onStatusUpdate={handleStatusUpdate}
                isAdmin={isAdmin}
              />
            ))
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Aucun livrable validé.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejete" className="mt-0">
          {filteredSubmissions.length > 0 ? (
            filteredSubmissions.map(submission => (
              <DeliverableSubmissionCard
                key={submission.id}
                submission={submission}
                livrableName={submission.nom_livrable || getLivrableName(submission.livrable_id)}
                onStatusUpdate={handleStatusUpdate}
                isAdmin={isAdmin}
              />
            ))
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Aucun livrable rejeté.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamDeliverableSubmissions;
