import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  Notification
} from '@/services/notificationService';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    if (!user?.id || !user?.role) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getNotifications(user.id, user.role);
      setNotifications(data);
      setUnreadCount(data.filter((notification) => !notification.is_read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    if (!user?.id || !user?.role) return;

    try {
      const count = await getUnreadNotificationCount(user.id, user.role);
      setUnreadCount(count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const markAsRead = async (notificationId: number) => {
    if (!user?.id || !user?.role) {
      console.error('User ID or role missing when trying to mark notification as read');
      return;
    }

    try {
      console.log(`Marking notification ${notificationId} as read`);
      const result = await markNotificationAsRead(notificationId);
      console.log('Mark as read result:', result);

      if (result) {
        // Update local state
        setNotifications(prevNotifications =>
          prevNotifications.map(notification =>
            notification.id === notificationId
              ? { ...notification, is_read: true }
              : notification
          )
        );

        // Update unread count
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      } else {
        throw new Error('Failed to mark notification as read');
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw err; // Re-throw to allow handling in the component
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id || !user?.role) {
      console.error('User ID or role missing when trying to mark all notifications as read');
      return;
    }

    try {
      console.log(`Marking all notifications as read for user ${user.id} with role ${user.role}`);
      const result = await markAllNotificationsAsRead(user.id, user.role);
      console.log('Mark all as read result:', result);

      if (result && result.length > 0) {
        // Update local state
        setNotifications(prevNotifications =>
          prevNotifications.map(notification => ({ ...notification, is_read: true }))
        );

        // Reset unread count
        setUnreadCount(0);
      } else {
        console.log('No notifications were marked as read');
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      throw err; // Re-throw to allow handling in the component
    }
  };

  // Fetch notifications when user changes
  useEffect(() => {
    if (user?.id && user?.role) {
      fetchNotifications();
    }
  }, [user?.id, user?.role]);

  // Periodically check for new notifications
  useEffect(() => {
    if (!user?.id || !user?.role) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [user?.id, user?.role]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        loading,
        error
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
