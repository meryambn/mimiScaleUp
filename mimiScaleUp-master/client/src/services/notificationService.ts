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
    const url = `${API_BASE_URL}/notifications/${userId}/${userRole}`;

    const notifications = await apiRequest<Notification[]>(url, {
      method: 'GET'
    });

    return notifications;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

// Mark a notification as read
export async function markNotificationAsRead(notificationId: number): Promise<Notification | null> {
  try {
    const url = `${API_BASE_URL}/notifications/read/${notificationId}`;

    const result = await apiRequest<Notification>(url, {
      method: 'PUT'
    });

    return result;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error; // Re-throw to allow proper error handling
  }
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(userId: number, userRole: string): Promise<Notification[]> {
  try {
    const url = `${API_BASE_URL}/notifications/read-all/${userId}/${userRole}`;

    const result = await apiRequest<Notification[]>(url, {
      method: 'PUT'
    });

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

// Create a notification for form access
export async function createFormAccessNotification(
  userId: number,
  userRole: string,
  programId: number | string,
  programName: string
): Promise<boolean> {
  try {
    const url = `${API_BASE_URL}/notifications/form-access`;

    const response = await apiRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        userRole,
        programId,
        programName
      })
    });

    return !!response;
  } catch (error) {
    console.error('Error creating form access notification:', error);
    return false;
  }
}
