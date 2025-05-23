import React, { useEffect } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Notification } from '@/services/notificationService';

/**
 * Component that listens for program termination notifications and shows appropriate messages
 */
const ProgramTerminationHandler: React.FC = () => {
  const { notifications, markAsRead, fetchNotifications } = useNotifications();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Check for unread program termination notifications when notifications change
  useEffect(() => {
    // Find the first unread program termination notification
    const terminationNotification = notifications.find(
      notification =>
        !notification.is_read &&
        (notification.type === 'program_completed' || notification.type === 'program_terminated')
    );

    if (terminationNotification) {
      handleTerminationNotification(terminationNotification);
    }
  }, [notifications]);

  // Also check for program termination notifications when the component mounts
  useEffect(() => {
    const checkForTerminationNotifications = async () => {
      // Force refresh notifications to get the latest
      await fetchNotifications();

      // Find the first unread program termination notification
      const terminationNotification = notifications.find(
        notification =>
          !notification.is_read &&
          (notification.type === 'program_completed' || notification.type === 'program_terminated')
      );

      if (terminationNotification) {
        handleTerminationNotification(terminationNotification);
      }
    };

    checkForTerminationNotifications();
  }, []);

  const handleTerminationNotification = async (notification: Notification) => {
    // Extract program ID from the notification
    const programId = notification.related_id;

    // Show toast notification
    toast({
      title: notification.title,
      description: notification.message,
      variant: "destructive", // Use destructive variant to make it more noticeable
    });

    // Mark the notification as read
    await markAsRead(notification.id);

    // If user is currently viewing the terminated program, redirect to dashboard
    const currentPath = window.location.pathname;
    if (programId && currentPath.includes(`/${programId}`)) {
      // Redirect to the appropriate dashboard based on user role
      const userRole = notification.user_role;
      const dashboardPath = userRole === 'startup'
        ? '/startup/dashboard'
        : userRole === 'particulier'
          ? '/particulier/dashboard'
          : '/startup/dashboard';

      setLocation(dashboardPath);
    }
  };

  return null; // This component doesn't render anything
};

export default ProgramTerminationHandler;
