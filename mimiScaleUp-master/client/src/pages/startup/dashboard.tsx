import React, { useState, useEffect } from 'react';
import Dashboard from '@/components/Dashboard';
import StartupLayout from '../../components/layout/StartupLayout';
import TeamInvitationNotification from '@/components/application/TeamInvitationNotification';
import { useToast } from '@/hooks/use-toast';
import { useProgramContext } from '@/context/ProgramContext';
import { getTeamDetails, getTeamMembers } from '@/services/teamNotificationService';

const StartupDashboardPage: React.FC = () => {
  const [showTeamAddedDialog, setShowTeamAddedDialog] = useState(false);
  const [teamAddedDetails, setTeamAddedDetails] = useState<{
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
    teamReason: ''
  });
  const { toast } = useToast();
  const { selectedProgram } = useProgramContext();

  // Check for new team notifications when the component mounts or when the selected program changes
  useEffect(() => {
    // Check if there's a notification in the URL parameters (simulating a notification trigger)
    const urlParams = new URLSearchParams(window.location.search);
    const hasTeamNotification = urlParams.get('team_notification') === 'true';

    if (hasTeamNotification) {
      const teamId = urlParams.get('team_id');

      // Set initial notification data
      setTeamAddedDetails({
        teamName: urlParams.get('team_name') || 'Nouvelle équipe',
        teamDescription: urlParams.get('team_description') || 'Vous avez été ajouté à cette équipe pour collaborer sur le programme.',
        programName: selectedProgram?.name || urlParams.get('program_name') || 'Programme',
        programId: urlParams.get('program_id') ? Number(urlParams.get('program_id')) : (selectedProgram?.id ? Number(selectedProgram.id) : undefined),
        teamMembers: [],
        teamReason: urlParams.get('team_reason') || ''
      });

      // Show the dialog immediately with basic info
      setShowTeamAddedDialog(true);

      // If we have a team ID, fetch the real team details from the backend
      if (teamId) {
        const fetchTeamDetails = async () => {
          try {
            console.log('Fetching team details for team ID:', teamId);

            // Try to get full team details first
            const details = await getTeamDetails(Number(teamId));

            if (details) {
              console.log('Team details fetched successfully:', details);

              // Update state with real team details
              setTeamAddedDetails({
                teamName: details.name,
                teamDescription: details.description,
                programName: details.programName,
                programId: details.programId,
                teamMembers: details.members,
                teamReason: details.reason || 'Vous avez été ajouté à cette équipe pour collaborer sur le programme.'
              });
            } else {
              console.log('Failed to fetch team details, falling back to fetching just members');

              // If we couldn't get full details, try to at least get the members
              const members = await getTeamMembers(Number(teamId));

              if (members && members.length > 0) {
                console.log('Team members fetched successfully:', members);

                // Update just the members in the state
                setTeamAddedDetails(prev => ({
                  ...prev,
                  teamMembers: members
                }));
              } else {
                console.error('Failed to fetch team members');
              }
            }
          } catch (error) {
            console.error('Error fetching team details:', error);
          }
        };

        fetchTeamDetails();
      } else {
        // If no team ID, try to parse team members from URL (fallback for backward compatibility)
        try {
          const teamMembersParam = urlParams.get('team_members');
          if (teamMembersParam) {
            const teamMembers = JSON.parse(decodeURIComponent(teamMembersParam));
            setTeamAddedDetails(prev => ({
              ...prev,
              teamMembers: teamMembers
            }));
          }
        } catch (error) {
          console.error('Error parsing team members:', error);
        }
      }

      // Remove the notification parameters from the URL to prevent showing the notification again on refresh
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [selectedProgram]);

  return (
    <StartupLayout>
      <Dashboard />

      {/* Team Invitation Notification */}
      <TeamInvitationNotification
        open={showTeamAddedDialog}
        onOpenChange={setShowTeamAddedDialog}
        teamName={teamAddedDetails.teamName}
        teamDescription={teamAddedDetails.teamDescription}
        programName={teamAddedDetails.programName}
        programId={teamAddedDetails.programId}
        teamMembers={teamAddedDetails.teamMembers}
        teamReason={teamAddedDetails.teamReason}
        onViewProgram={() => {
          toast({
            title: "Navigation vers le programme",
            description: `Redirection vers le programme "${teamAddedDetails.programName}"`,
          });
          setShowTeamAddedDialog(false);
        }}
      />
    </StartupLayout>
  );
};

export default StartupDashboardPage;