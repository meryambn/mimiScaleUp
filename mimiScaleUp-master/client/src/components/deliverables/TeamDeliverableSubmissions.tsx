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

  // Debug props
  console.log('TeamDeliverableSubmissions - COMPONENT MOUNTED');
  console.log('TeamDeliverableSubmissions - Props:', { teamId, phaseId });

  // Debug props
  console.log('TeamDeliverableSubmissions - Props (detailed):', {
    teamId,
    phaseId,
    teamIdType: typeof teamId,
    phaseIdType: typeof phaseId,
    user: user
  });

  // Add effect to log when component mounts and unmounts
  React.useEffect(() => {
    console.log('TeamDeliverableSubmissions - Component mounted with teamId:', teamId, 'phaseId:', phaseId);

    // Test direct API call
    const testApiCall = async () => {
      try {
        if (!teamId) {
          console.error('Cannot make API call: teamId is empty or undefined');
          return;
        }

        // Make sure we're using the correct parameter name (candidatureId)
        const candidatureId = teamId;

        console.log('Making direct test API call to fetch submissions');
        console.log('API URL:', `/api/livrable-soumissions/equipe/${candidatureId}`);

        const response = await fetch(`/api/livrable-soumissions/equipe/${candidatureId}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          },
          credentials: 'include'
        });

        console.log('Direct API call response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('Direct API call response data:', data);

          if (Array.isArray(data)) {
            console.log(`Found ${data.length} submissions in direct API call`);
          } else {
            console.error('Direct API call returned non-array data:', typeof data);
          }
        } else {
          console.error('Direct API call failed with status:', response.status);
          // Try to get error message
          try {
            const errorText = await response.text();
            console.error('Error response text:', errorText);
          } catch (parseError) {
            console.error('Could not parse error response');
          }
        }
      } catch (error) {
        console.error('Error in direct API call:', error);
      }
    };

    if (teamId) {
      testApiCall();
    }

    return () => {
      console.log('TeamDeliverableSubmissions - Component unmounted');
    };
  }, [teamId]);

  // Fetch deliverable submissions for the team
  const {
    data: submissions = [],
    isLoading: isLoadingSubmissions,
    isError: isErrorSubmissions,
    error: submissionsError
  } = useQuery({
    queryKey: ['team-deliverable-submissions', teamId],
    queryFn: async () => {
      console.log('Fetching submissions for team ID:', teamId);
      try {
        if (!teamId) {
          console.error('Team ID is undefined or empty');
          return [];
        }

        // Make sure we're using the correct parameter name (candidatureId)
        // This is the ID expected by the backend API
        const candidatureId = teamId;
        console.log('Using candidatureId for API call:', candidatureId);

        const result = await getTeamDeliverableSubmissions(candidatureId);
        console.log('Submissions result (detailed):', JSON.stringify(result, null, 2));
        return result;
      } catch (error) {
        console.error('Error fetching submissions:', error);
        throw error;
      }
    },
    enabled: !!teamId && teamId !== '',
    staleTime: 30000, // 30 seconds
    retry: 2, // Retry failed requests up to 2 times
  });

  // Fetch deliverables for the phase to get their names
  const {
    data: deliverables = [],
    isLoading: isLoadingDeliverables,
    isError: isErrorDeliverables,
    error: deliverablesError
  } = useQuery({
    queryKey: ['phase-deliverables', phaseId],
    queryFn: async () => {
      console.log('Fetching deliverables for phase ID:', phaseId);
      try {
        if (!phaseId) {
          console.error('Phase ID is undefined or empty');
          return [];
        }
        const result = await getPhaseDeliverables(phaseId);
        console.log('Phase deliverables result:', result);
        return result;
      } catch (error) {
        console.error('Error fetching phase deliverables:', error);
        return []; // Return empty array to prevent component crashes
      }
    },
    enabled: !!phaseId && phaseId !== '',
    staleTime: 30000, // 30 seconds
    retry: 2, // Retry failed requests up to 2 times
  });

  // Function to get deliverable name by ID
  const getLivrableName = (livrableId: number) => {
    console.log('Getting livrable name for ID:', livrableId);
    console.log('Available deliverables:', deliverables);

    if (!livrableId) {
      console.warn('Invalid livrable ID:', livrableId);
      return 'Livrable inconnu';
    }

    // Try to find the deliverable by ID
    const deliverable = deliverables.find(d => d.id === livrableId);

    // If found, return the name
    if (deliverable && deliverable.nom) {
      return deliverable.nom;
    }

    // If not found, check if the submission has a nom_livrable property
    // This is a fallback in case the backend returns the name directly in the submission
    return 'Livrable inconnu';
  };

  // Handle status update
  const handleStatusUpdate = () => {
    // Invalidate the query to refetch the data
    queryClient.invalidateQueries({ queryKey: ['team-deliverable-submissions', teamId] });
  };

  // Filter submissions based on active tab
  const filteredSubmissions = submissions.filter(submission => {
    if (activeTab === 'all') return true;
    return submission.statut === activeTab;
  });

  // Count submissions by status
  const pendingCount = submissions.filter(s => s.statut === 'en attente').length;
  const validatedCount = submissions.filter(s => s.statut === 'valide').length;
  const rejectedCount = submissions.filter(s => s.statut === 'rejete').length;

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
    console.error('Error in TeamDeliverableSubmissions:', {
      submissionsError,
      deliverablesError
    });

    return (
      <div className="bg-red-50 text-red-800 p-4 rounded-md">
        <h3 className="font-bold">Erreur</h3>
        <p>{submissionsError?.message || deliverablesError?.message || "Une erreur est survenue lors du chargement des livrables."}</p>
        <button
          className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded"
          onClick={() => {
            // Retry loading the data
            queryClient.invalidateQueries({ queryKey: ['team-deliverable-submissions', teamId] });
            queryClient.invalidateQueries({ queryKey: ['phase-deliverables', phaseId] });
          }}
        >
          Réessayer
        </button>
      </div>
    );
  }

  // Show empty state if no submissions
  if (submissions.length === 0) {
    return (
      <div className="bg-gray-50 p-8 rounded-lg text-center">
        <div className="text-gray-400 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun livrable soumis</h3>
        <p className="text-gray-500 mb-4">Cette équipe n'a pas encore soumis de livrables pour cette phase.</p>
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
            <Badge className="ml-2 bg-gray-100 text-gray-800">{submissions.length}</Badge>
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
