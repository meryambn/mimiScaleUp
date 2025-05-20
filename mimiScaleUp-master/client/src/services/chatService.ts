import { API_BASE_URL } from '../lib/constants';
import { apiRequest } from './mentorService';
import { io, Socket } from 'socket.io-client';

// Types
export interface ChatMessage {
  id: number;
  sender_id: number;
  sender_role: string;
  recipient_id: number;
  recipient_role: string;
  content: string;
  is_read: boolean;
  created_at: string;
  senderName?: string;
}

export interface ChatContact {
  id: number;
  role: string;
  name: string;
  email?: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

export interface ChatConversation {
  id: number;
  participant1_id: number;
  participant1_role: string;
  participant2_id: number;
  participant2_role: string;
  last_message_id: number;
  updated_at: string;
  other_participant: {
    id: number;
    role: string;
    name: string;
    email?: string;
  };
  last_message_content?: string;
  last_message_time?: string;
  unread_count: number;
}

// Socket.io connection
let socket: Socket | null = null;

// Initialize socket connection
export function initializeSocket(userId: number, userRole: string): Socket | null {
  try {
    if (socket) {
      socket.disconnect();
    }

    // Use the explicit backend URL instead of relying on API_BASE_URL
    // This ensures we connect to the correct Socket.IO server
    const SOCKET_SERVER_URL = 'http://localhost:8083';

    // Use a fallback approach - first try WebSockets, then polling
    socket = io(SOCKET_SERVER_URL, {
      auth: {
        userId,
        userRole
      },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      timeout: 5000
    });

    socket.on('connect', () => {
      console.log('Connected to chat server');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    return socket;
  } catch (error) {
    console.error('Failed to initialize socket:', error);
    return null;
  }
}

// Get socket instance
export function getSocket(): Socket | null {
  return socket;
}

// Disconnect socket
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// Send a message via REST API
export async function sendMessage(
  senderId: number,
  senderRole: string,
  recipientId: number,
  recipientRole: string,
  content: string
): Promise<ChatMessage> {
  try {
    const url = `${API_BASE_URL}/messages/send`;
    const message = await apiRequest<ChatMessage>(url, {
      method: 'POST',
      body: JSON.stringify({
        sender_id: senderId,
        sender_role: senderRole,
        recipient_id: recipientId,
        recipient_role: recipientRole,
        content
      })
    });
    return message;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

// Send a message via WebSocket
export function sendMessageSocket(
  recipientId: number,
  recipientRole: string,
  content: string
): void {
  if (!socket) {
    throw new Error('Socket not initialized');
  }

  socket.emit('private-message', {
    recipientId,
    recipientRole,
    content
  });
}

// Get conversation between two users
export async function getConversation(
  user1Id: number,
  user1Role: string,
  user2Id: number,
  user2Role: string,
  limit = 50,
  offset = 0
): Promise<ChatMessage[]> {
  try {
    const url = `${API_BASE_URL}/messages/conversation/${user1Id}/${user1Role}/${user2Id}/${user2Role}?limit=${limit}&offset=${offset}`;
    const messages = await apiRequest<ChatMessage[]>(url, {
      method: 'GET'
    });
    return messages;
  } catch (error) {
    console.error('Error getting conversation:', error);
    return [];
  }
}

// Mark a message as read
export async function markMessageAsRead(messageId: number): Promise<ChatMessage> {
  try {
    const url = `${API_BASE_URL}/messages/read/${messageId}`;
    const message = await apiRequest<ChatMessage>(url, {
      method: 'PUT'
    });
    return message;
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
}

// Mark a message as read via WebSocket
export function markMessageAsReadSocket(messageId: number): void {
  if (!socket) {
    throw new Error('Socket not initialized');
  }

  socket.emit('mark-message-read', {
    messageId
  });
}

// Mark all messages from a sender as read
export async function markAllMessagesAsRead(
  senderId: number,
  senderRole: string,
  recipientId: number,
  recipientRole: string
): Promise<ChatMessage[]> {
  try {
    const url = `${API_BASE_URL}/messages/read-all/${senderId}/${senderRole}/${recipientId}/${recipientRole}`;
    const messages = await apiRequest<ChatMessage[]>(url, {
      method: 'PUT'
    });
    return messages;
  } catch (error) {
    console.error('Error marking all messages as read:', error);
    throw error;
  }
}

// Mark all messages from a sender as read via WebSocket
export function markAllMessagesAsReadSocket(
  senderId: number,
  senderRole: string
): void {
  if (!socket) {
    throw new Error('Socket not initialized');
  }

  socket.emit('mark-all-messages-read', {
    senderId,
    senderRole
  });
}

// Get unread message count for a user
export async function getUnreadMessageCount(
  userId: number,
  userRole: string
): Promise<number> {
  try {
    const url = `${API_BASE_URL}/messages/unread/${userId}/${userRole}`;
    const response = await apiRequest<{ count: number }>(url, {
      method: 'GET'
    });
    return response.count;
  } catch (error) {
    console.error('Error getting unread message count:', error);
    return 0;
  }
}

// Get all conversations for a user
export async function getConversations(
  userId: number,
  userRole: string
): Promise<ChatConversation[]> {
  try {
    const url = `${API_BASE_URL}/messages/conversations/${userId}/${userRole}`;
    const conversations = await apiRequest<ChatConversation[]>(url, {
      method: 'GET'
    });
    return conversations;
  } catch (error) {
    console.error('Error getting conversations:', error);
    return [];
  }
}

// Get all potential contacts for a user
export async function getPotentialContacts(
  userId: number,
  userRole: string
): Promise<ChatContact[]> {
  try {
    const url = `${API_BASE_URL}/messages/contacts/${userId}/${userRole}`;
    const contacts = await apiRequest<ChatContact[]>(url, {
      method: 'GET'
    });
    return contacts;
  } catch (error) {
    console.error('Error getting potential contacts:', error);
    return [];
  }
}

// Send typing indicator
export function sendTypingIndicator(
  recipientId: number,
  recipientRole: string
): void {
  if (!socket) {
    return;
  }

  socket.emit('typing', {
    recipientId,
    recipientRole
  });
}

// Send stop typing indicator
export function sendStopTypingIndicator(
  recipientId: number,
  recipientRole: string
): void {
  if (!socket) {
    return;
  }

  socket.emit('stop-typing', {
    recipientId,
    recipientRole
  });
}
