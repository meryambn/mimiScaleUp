import React, { useState, useEffect } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import WinnerDialog from '@/components/teams/WinnerDialog';
import { useToast } from '@/hooks/use-toast';
import { Notification } from '@/services/notificationService';

/**
 * Component that listens for winner-related notifications and shows the appropriate popup
 */
const WinnerNotificationHandler: React.FC = () => {
  const { notifications, markAsRead, fetchNotifications } = useNotifications();
  const { toast } = useToast();
  const [showWinnerDialog, setShowWinnerDialog] = useState(false);
  const [winnerDetails, setWinnerDetails] = useState<{
    winnerName: string;
    programName: string;
    notificationId?: number;
  }>({
    winnerName: '',
    programName: '',
  });

  // Check for unread winner notifications when notifications change
  useEffect(() => {
    // Find the first unread winner notification
    const winnerNotification = notifications.find(
      notification =>
        !notification.is_read &&
        notification.type === 'winner_announcement' &&
        notification.title === 'Félicitations !' // Only show for the actual winner, not for other participants
    );

    if (winnerNotification) {
      handleWinnerNotification(winnerNotification);
    }
  }, [notifications]);

  // Also check for winner notifications when the component mounts
  useEffect(() => {
    const checkForWinnerNotifications = async () => {
      // Force refresh notifications to get the latest
      await fetchNotifications();

      // Find the first unread winner notification
      const winnerNotification = notifications.find(
        notification =>
          !notification.is_read &&
          notification.type === 'winner_announcement' &&
          notification.title === 'Félicitations !' // Only show for the actual winner, not for other participants
      );

      if (winnerNotification) {
        handleWinnerNotification(winnerNotification);
      }
    };

    checkForWinnerNotifications();
  }, []);

  const handleWinnerNotification = async (notification: Notification) => {
    // Extract winner name and program name from the message
    let winnerName = '';
    let programName = '';

    try {
      // Try to extract winner name from message
      // The message format is either:
      // "Félicitations ! Votre équipe "{candidatureNom}" a gagné le programme "{programmeName}"."
      // or
      // "Félicitations ! Votre startup "{candidatureNom}" a gagné le programme "{programmeName}"."
      
      // Extract the winner name (team or startup name)
      const winnerMatch = notification.message.match(/Votre (équipe|startup) "(.*?)" a gagné/);
      if (winnerMatch && winnerMatch[2]) {
        winnerName = winnerMatch[2];
      }

      // Extract the program name
      const programMatch = notification.message.match(/programme "(.*?)"/);
      if (programMatch && programMatch[1]) {
        programName = programMatch[1];
      }
    } catch (error) {
      console.error('Error parsing notification message:', error);
    }

    // Set winner details
    setWinnerDetails({
      winnerName,
      programName,
      notificationId: notification.id
    });

    // Show dialog
    setShowWinnerDialog(true);
  };

  const handleCloseDialog = async () => {
    // Mark notification as read
    if (winnerDetails.notificationId) {
      try {
        await markAsRead(winnerDetails.notificationId);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Close the dialog
    setShowWinnerDialog(false);
  };

  return (
    <WinnerDialog
      open={showWinnerDialog}
      onOpenChange={(open) => {
        if (!open) handleCloseDialog();
        else setShowWinnerDialog(open);
      }}
      teamName={winnerDetails.winnerName}
      programName={winnerDetails.programName}
    />
  );
};

export default WinnerNotificationHandler;
