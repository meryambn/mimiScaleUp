import React, { useState, useEffect } from 'react';
import Dashboard from '@/components/Dashboard';
import ParticulierLayout from '../../components/layout/ParticulierLayout';
import TeamCreationDialog from '@/components/application/TeamCreationDialog';
import { ApplicationSubmission } from '@/components/application/ApplicationSubmissionCard';
import { useProgramContext } from '@/context/ProgramContext';
import { useToast } from '@/hooks/use-toast';
import { getSubmissionsByProgram } from '@/services/formService';
import TeamInvitationNotification from '@/components/application/TeamInvitationNotification';
import { getTeamDetails, getTeamMembers } from '@/services/teamNotificationService';

const ParticulierDashboardPage: React.FC = () => {
  const [showTeamCreationDialog, setShowTeamCreationDialog] = useState(false);
  const [submissions, setSubmissions] = useState<ApplicationSubmission[]>([]);
  const [isSubmissionsLoading, setIsSubmissionsLoading] = useState<boolean>(false);
  const [submissionsError, setSubmissionsError] = useState<string | null>(null);
  const { selectedProgram, selectedProgramId } = useProgramContext();
  const { toast } = useToast();
  const [showInvitationDialog, setShowInvitationDialog] = useState(false);
  const [invitationDetails, setInvitationDetails] = useState<{
    teamName: string;
    teamDescription: string;
    programName: string;
    programId?: number;
    teamMembers?: { id: string | number; name: string; role: string; email?: string; avatar?: string; }[];
    teamReason?: string;
  }>({
    teamName: '',
    teamDescription: '',
    programName: '',
    programId: undefined,
    teamMembers: [],
    teamReason: 'Vous avez été sélectionné pour rejoindre cette équipe en raison de vos compétences complémentaires.'
  });

  // Function to fetch submissions from backend
  const fetchSubmissionsFromBackend = async (programId: string | number | null) => {
    if (!programId) return;

    setIsSubmissionsLoading(true);
    setSubmissionsError(null);

    try {
      const result = await getSubmissionsByProgram(programId);
      console.log('Submissions fetched from backend API:', result);

      if (result.error) {
        setSubmissionsError(result.message);
        toast({
          title: "Erreur de récupération des soumissions",
          description: result.message,
          variant: "destructive"
        });
        return;
      }

      if (result.submissions && Array.isArray(result.submissions)) {
        setSubmissions(result.submissions);
      } else {
        setSubmissions([]);
      }
    } catch (err) {
      console.error('Error fetching submissions from backend:', err);
      setSubmissionsError(err instanceof Error ? err.message : 'Erreur inconnue');
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la récupération des soumissions.",
        variant: "destructive"
      });
    } finally {
      setIsSubmissionsLoading(false);
    }
  };

  // Fetch submissions when program is selected
  useEffect(() => {
    if (selectedProgramId) {
      console.log('Program selected, fetching submissions from backend API');
      fetchSubmissionsFromBackend(selectedProgramId);
    }
  }, [selectedProgramId]);

  // Filter submissions for the selected program
  const programApplicationSubmissions = React.useMemo(() => {
    if (!selectedProgramId) return submissions;
    return submissions.filter(submission => {
      // Convertir les deux valeurs en chaînes pour la comparaison
      return String(submission.programId) === String(selectedProgramId);
    });
  }, [submissions, selectedProgramId]);

  return (
    <ParticulierLayout>
      <Dashboard
        onCreateTeamClick={() => setShowTeamCreationDialog(true)}
      />

      {/* Team Creation Dialog */}
      <TeamCreationDialog
        open={showTeamCreationDialog}
        onOpenChange={setShowTeamCreationDialog}
        submissions={programApplicationSubmissions}
        onCreateTeam={async (teamData) => {
          try {
            // Import the team service dynamically to avoid circular dependencies
            const { createTeam } = await import('@/services/teamService');

            // Call the team service to create a team
            const result = await createTeam(teamData, selectedProgramId);

            // Update the submission status in the UI for all team members
            const updatedSubmissions = submissions.map(s =>
              teamData.members.some(m => m.id === s.id) ? { ...s, status: 'approved' as const } : s
            );
            setSubmissions(updatedSubmissions);

            // Get the team ID from the result
            const teamId = result?.candidature?.id;

            if (teamId) {
              try {
                // Fetch real team details from the backend
                const teamDetails = await getTeamDetails(teamId);

                if (teamDetails) {
                  // Use the real team details from the backend
                  setInvitationDetails({
                    teamName: teamDetails.name,
                    teamDescription: teamDetails.description,
                    programName: teamDetails.programName,
                    programId: teamDetails.programId,
                    teamMembers: teamDetails.members,
                    teamReason: teamDetails.reason || 'Cette équipe a été formée pour combiner des compétences complémentaires et maximiser les chances de succès du projet.'
                  });
                } else {
                  // Fallback to using the members we already have
                  setInvitationDetails({
                    teamName: teamData.name,
                    teamDescription: teamData.description,
                    programName: selectedProgram?.name || 'Program',
                    programId: selectedProgram?.id ? Number(selectedProgram.id) : undefined,
                    teamMembers: teamData.members.map(member => ({
                      id: member.id,
                      name: member.name || 'Membre',
                      role: member.role || 'Participant',
                      email: member.email
                    })),
                    teamReason: 'Cette équipe a été formée pour combiner des compétences complémentaires et maximiser les chances de succès du projet.'
                  });
                }
              } catch (error) {
                console.error('Error fetching team details:', error);
                // Fallback to using the members we already have
                setInvitationDetails({
                  teamName: teamData.name,
                  teamDescription: teamData.description,
                  programName: selectedProgram?.name || 'Program',
                  programId: selectedProgram?.id ? Number(selectedProgram.id) : undefined,
                  teamMembers: teamData.members.map(member => ({
                    id: member.id,
                    name: member.name || 'Membre',
                    role: member.role || 'Participant',
                    email: member.email
                  })),
                  teamReason: 'Cette équipe a été formée pour combiner des compétences complémentaires et maximiser les chances de succès du projet.'
                });
              }
            } else {
              // No team ID, use the data we have
              setInvitationDetails({
                teamName: teamData.name,
                teamDescription: teamData.description,
                programName: selectedProgram?.name || 'Program',
                programId: selectedProgram?.id ? Number(selectedProgram.id) : undefined,
                teamMembers: teamData.members.map(member => ({
                  id: member.id,
                  name: member.name || 'Membre',
                  role: member.role || 'Participant',
                  email: member.email
                })),
                teamReason: 'Cette équipe a été formée pour combiner des compétences complémentaires et maximiser les chances de succès du projet.'
              });
            }

            setShowInvitationDialog(true);

            // Show success message
            toast({
              title: "Équipe créée avec succès",
              description: `${teamData.name} a été créée avec ${teamData.members.length} membres.`,
            });

            // Refresh submissions from backend
            fetchSubmissionsFromBackend(selectedProgramId);
          } catch (error) {
            console.error("Error creating team:", error);
            toast({
              title: "Erreur lors de la création de l'équipe",
              description: error instanceof Error ? error.message : "Échec de la création de l'équipe. Veuillez réessayer.",
              variant: "destructive",
            });
          }
        }}
      />

      {/* Team Invitation Notification */}
      <TeamInvitationNotification
        open={showInvitationDialog}
        onOpenChange={setShowInvitationDialog}
        teamName={invitationDetails.teamName}
        teamDescription={invitationDetails.teamDescription}
        programName={invitationDetails.programName}
        programId={invitationDetails.programId}
        teamMembers={invitationDetails.teamMembers}
        teamReason={invitationDetails.teamReason}
        onViewProgram={() => {
          toast({
            title: "Navigation vers le programme",
            description: `Redirection vers le programme "${invitationDetails.programName}"`,
          });
          setShowInvitationDialog(false);
        }}
      />
    </ParticulierLayout>
  );
};

export default ParticulierDashboardPage;