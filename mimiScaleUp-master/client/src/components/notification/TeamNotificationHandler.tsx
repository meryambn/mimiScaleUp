import React, { useState, useEffect } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import TeamInvitationNotification from '@/components/application/TeamInvitationNotification';
import { useToast } from '@/hooks/use-toast';
import { Notification } from '@/services/notificationService';
import { getTeamDetails, getTeamMembers, TeamMember } from '@/services/teamNotificationService';

/**
 * Component that listens for team-related notifications and shows the appropriate popup
 */
const TeamNotificationHandler: React.FC = () => {
  const { notifications, markAsRead, fetchNotifications } = useNotifications();
  const { toast } = useToast();
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [teamDetails, setTeamDetails] = useState<{
    teamName: string;
    teamDescription: string;
    programName: string;
    programId?: number;
    teamMembers?: { id: string | number; name: string; role: string; email?: string; avatar?: string; }[];
    teamReason?: string;
    notificationId?: number;
  }>({
    teamName: '',
    teamDescription: '',
    programName: '',
    programId: undefined,
    teamMembers: [],
    teamReason: ''
  });

  // Check for unread team notifications when notifications change
  useEffect(() => {
    // Find the first unread team notification
    const teamNotification = notifications.find(
      notification =>
        !notification.is_read &&
        (notification.type === 'team_creation' || notification.type === 'team_addition')
    );

    if (teamNotification) {
      handleTeamNotification(teamNotification);
    }
  }, [notifications]);

  // Also check for team notifications when the component mounts
  useEffect(() => {
    const checkForTeamNotifications = async () => {
      // Force refresh notifications to get the latest
      await fetchNotifications();

      // Find the first unread team notification
      const teamNotification = notifications.find(
        notification =>
          !notification.is_read &&
          (notification.type === 'team_creation' || notification.type === 'team_addition')
      );

      if (teamNotification) {
        handleTeamNotification(teamNotification);
      }
    };

    checkForTeamNotifications();
  }, []);

  const handleTeamNotification = async (notification: Notification) => {
    // Extract team name, program name, and team ID from the message
    let teamName = 'Nouvelle équipe';
    let programName = 'Programme';
    let teamId: number | null = null;

    try {
      // Try to extract team name from message
      const teamMatch = notification.message.match(/l'équipe "(.*?)" dans/);
      if (teamMatch && teamMatch[1]) {
        teamName = teamMatch[1];
      }

      // Try to extract program name from message
      const programMatch = notification.message.match(/programme "(.*?)"/);
      if (programMatch && programMatch[1]) {
        programName = programMatch[1];
      }

      // The related_id field should contain the team ID
      if (notification.related_id) {
        teamId = notification.related_id;
      }
    } catch (error) {
      console.error('Error parsing notification message:', error);
    }

    // Extract description if available in the notification message
    let teamDescription = 'Vous avez été ajouté à cette équipe pour collaborer sur le programme.';
    let teamMembers: TeamMember[] = [];

    // Try to extract program ID from the notification
    let programId: number | undefined = undefined;
    if (notification.related_program_id) {
      programId = notification.related_program_id;
    }

    // Set initial team details with basic info
    setTeamDetails({
      teamName,
      teamDescription,
      programName,
      programId,
      teamMembers: [],
      teamReason: teamDescription,
      notificationId: notification.id
    });

    // Show dialog immediately with basic info
    setShowTeamDialog(true);

    // Fetch team details from the backend if we have a team ID
    if (teamId) {
      try {
        console.log('Fetching team details for team ID:', teamId);

        // Fetch team details
        console.log('About to fetch team details for ID:', teamId);
        const details = await getTeamDetails(teamId);

        if (details) {
          console.log('Team details fetched successfully:', details);
          console.log('Team members in details:', details.members);

          // Update state with real team details
          setTeamDetails({
            teamName: details.name,
            teamDescription: details.description,
            programName: details.programName,
            programId: details.programId,
            teamMembers: details.members,
            teamReason: details.reason || teamDescription,
            notificationId: notification.id
          });
        } else {
          console.log('Failed to fetch team details, falling back to fetching just members');

          // If we couldn't get full details, try to at least get the members
          const members = await getTeamMembers(teamId);

          if (members && members.length > 0) {
            console.log('Team members fetched successfully:', members);

            // Update just the members in the state
            setTeamDetails(prev => ({
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
    }
  };

  const handleViewProgram = async () => {
    // Mark notification as read
    if (teamDetails.notificationId) {
      try {
        await markAsRead(teamDetails.notificationId);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Close the dialog
    setShowTeamDialog(false);

    // Navigate to the program page if we have a program ID
    if (teamDetails.programId) {
      // This would typically navigate to the program page
      // For now, just show a toast
      toast({
        title: "Navigation vers le programme",
        description: `Redirection vers le programme "${teamDetails.programName}"`,
      });
    }
  };

  return (
    <TeamInvitationNotification
      open={showTeamDialog}
      onOpenChange={setShowTeamDialog}
      teamName={teamDetails.teamName}
      teamDescription={teamDetails.teamDescription}
      programName={teamDetails.programName}
      programId={teamDetails.programId}
      teamMembers={teamDetails.teamMembers}
      teamReason={teamDetails.teamReason}
      onViewProgram={handleViewProgram}
    />
  );
};

export default TeamNotificationHandler;
