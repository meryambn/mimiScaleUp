import { API_BASE_URL } from '../lib/constants';
import { apiRequest } from './mentorService';

export interface Notification {
  id: number;
  user_id: number;
  user_role: string;
  type: string;
  title: string;
  message: string;
  related_id: number;
  is_read: boolean;
  created_at: string;
}

// Get notifications for a user
export async function getNotifications(userId: number, userRole: string): Promise<Notification[]> {
  try {
    console.log(`Requesting notifications for user ${userId} with role ${userRole}`);
    const url = `${API_BASE_URL}/notifications/${userId}/${userRole}`;
    console.log(`Request URL: ${url}`);

    const notifications = await apiRequest<Notification[]>(url, {
      method: 'GET'
    });

    console.log(`Received ${notifications.length} notifications from API:`, notifications);
    return notifications;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

// Mark a notification as read
export async function markNotificationAsRead(notificationId: number): Promise<Notification | null> {
  try {
    console.log(`API call to mark notification ${notificationId} as read`);
    const url = `${API_BASE_URL}/notifications/read/${notificationId}`;
    console.log(`Request URL: ${url}`);

    const result = await apiRequest<Notification>(url, {
      method: 'PUT'
    });

    console.log('API response for mark as read:', result);
    return result;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error; // Re-throw to allow proper error handling
  }
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(userId: number, userRole: string): Promise<Notification[]> {
  try {
    console.log(`API call to mark all notifications as read for user ${userId} with role ${userRole}`);
    const url = `${API_BASE_URL}/notifications/read-all/${userId}/${userRole}`;
    console.log(`Request URL: ${url}`);

    const result = await apiRequest<Notification[]>(url, {
      method: 'PUT'
    });

    console.log(`API response for mark all as read: ${result.length} notifications updated`);
    return result;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error; // Re-throw to allow proper error handling
  }
}

// Get unread notification count for a user
export async function getUnreadNotificationCount(userId: number, userRole: string): Promise<number> {
  try {
    const response = await apiRequest<{ count: number }>(`${API_BASE_URL}/notifications/unread/${userId}/${userRole}`, {
      method: 'GET'
    });
    return response.count;
  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    return 0;
  }
}
