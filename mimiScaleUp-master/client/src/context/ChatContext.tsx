import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { Socket } from 'socket.io-client';
import {
  ChatMessage,
  ChatContact,
  ChatConversation,
  initializeSocket,
  getSocket,
  disconnectSocket,
  getConversations,
  getPotentialContacts,
  getUnreadMessageCount,
  getConversation,
  sendMessage as sendMessageREST,
  sendMessageSocket,
  markMessageAsRead as markMessageAsReadREST,
  markMessageAsReadSocket,
  markAllMessagesAsRead as markAllMessagesAsReadREST,
  markAllMessagesAsReadSocket
} from '../services/chatService';

interface ChatContextType {
  socket: Socket | null;
  conversations: ChatConversation[];
  contacts: ChatContact[];
  messages: Record<string, ChatMessage[]>;
  selectedContact: ChatContact | null;
  unreadCount: number;
  isTyping: Record<string, boolean>;
  loading: boolean;
  error: string | null;
  setSelectedContact: (contact: ChatContact | null) => void;
  sendMessage: (content: string) => Promise<void>;
  markAsRead: (messageId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  startTyping: () => void;
  stopTyping: () => void;
  refreshConversations: () => Promise<void>;
  refreshContacts: () => Promise<void>;
  loadMessages: (contactId: number, contactRole: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize socket when user changes
  useEffect(() => {
    if (user?.id && user?.role) {
      try {
        // Ensure we're using the correct role format
        let normalizedRole = user.role.toLowerCase();
        // Handle 'particulier' role as 'startup' for the API
        if (normalizedRole === 'particulier') {
          normalizedRole = 'startup';
          console.log('Converting "particulier" role to "startup" for socket initialization');
        }

        console.log(`Initializing socket for user ID: ${user.id}, role: ${normalizedRole}`);
        const newSocket = initializeSocket(user.id, normalizedRole);
        setSocket(newSocket);

        // We'll fetch data when needed, not on every socket initialization
        // This prevents multiple refreshes when the component mounts
        fetchUnreadCount();
      } catch (error) {
        console.error('Error initializing chat:', error);
        setError('Failed to connect to chat server. Using fallback mode.');
      }

      return () => {
        disconnectSocket();
      };
    }
  }, [user?.id, user?.role]);

  // Set up polling for new messages when WebSocket is not available
  useEffect(() => {
    if (!user?.id || !user?.role) return;

    // Check if socket is connected
    const isSocketConnected = socket && socket.connected;

    // If socket is not connected, use polling fallback
    if (!isSocketConnected) {
      console.log('WebSocket not available, using polling fallback');

      // Only set the error once, not on every render
      if (!error) {
        setError('La connexion en temps réel n\'est pas disponible. Mode hors ligne activé.');
      }

      // Poll for new conversations and messages every 5 seconds
      const pollInterval = setInterval(() => {
        console.log('Polling for updates...');

        // Wrap these in try/catch to prevent errors from breaking the polling
        try {
          refreshConversations();

          // If a contact is selected, also refresh their messages
          if (selectedContact && selectedContact.id && selectedContact.role) {
            loadMessages(selectedContact.id, selectedContact.role);
          }

          // Check for unread messages
          fetchUnreadCount();
        } catch (err) {
          console.error('Error during polling:', err);
        }
      }, 5000);

      return () => {
        clearInterval(pollInterval);
      };
    } else if (error) {
      // If socket is connected but we still have an error state, clear it
      setError(null);
    }
  }, [user?.id, user?.role, socket?.connected]);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket || !socket.connected) return;

    // Create stable references to avoid dependency issues
    const currentUser = user;
    const currentSelectedContact = selectedContact;
    const getContactKeyRef = getContactKey;
    const refreshConversationsRef = refreshConversations;

    // Handle new messages
    const handleNewMessage = (message: ChatMessage) => {
      console.log(`Received new message from ${message.sender_id} (${message.sender_role}):`, message.id);

      // Add message to messages state
      setMessages(prev => {
        const contactKey = getContactKeyRef(message.sender_id, message.sender_role);
        const contactMessages = prev[contactKey] || [];

        // Check if this message already exists to prevent duplicates
        const messageExists = contactMessages.some(msg => msg.id === message.id);

        if (messageExists) {
          console.log(`Message ${message.id} already exists, not adding duplicate`);
          return prev;
        }

        console.log(`Adding new message ${message.id} to conversation with ${message.sender_id}`);
        return {
          ...prev,
          [contactKey]: [...contactMessages, message]
        };
      });

      // Update unread count
      setUnreadCount(prev => prev + 1);

      // Update conversations - but don't do this too often
      // Use setTimeout to debounce multiple rapid updates
      setTimeout(() => {
        refreshConversationsRef();
      }, 500);
    };

    // Handle message sent confirmation
    const handleMessageSent = (message: ChatMessage) => {
      // We don't need to add the message here because we already added a temporary message
      // in the sendMessage function. The message-updated event will replace it with the real one.
      console.log('Message sent confirmation received:', message.id);
    };

    // Handle message update (replacing temporary message with real one)
    const handleMessageUpdated = ({ tempId, message }: { tempId: number, message: ChatMessage }) => {
      if (currentUser?.id && currentUser?.role) {
        console.log(`Replacing temporary message ${tempId} with real message ${message.id}`);
        const contactKey = getContactKeyRef(message.recipient_id, message.recipient_role);
        setMessages(prev => {
          const contactMessages = prev[contactKey] || [];

          // Check if the temporary message exists
          const tempMessageExists = contactMessages.some(msg => msg.id === tempId);

          if (tempMessageExists) {
            // Replace the temporary message with the real one
            const updatedMessages = contactMessages.map(msg =>
              msg.id === tempId ? message : msg
            );
            return {
              ...prev,
              [contactKey]: updatedMessages
            };
          } else {
            // If for some reason the temp message doesn't exist, don't add a duplicate
            console.log(`Temporary message ${tempId} not found, not adding duplicate`);
            return prev;
          }
        });
      }
    };

    // Handle message read status
    const handleMessageRead = ({ messageId }: { messageId: number }) => {
      console.log(`Message ${messageId} marked as read`);

      // Update message read status in messages state
      setMessages(prev => {
        const updatedMessages: Record<string, ChatMessage[]> = {};

        // Update the read status for the message with the given ID in all conversations
        Object.keys(prev).forEach(key => {
          updatedMessages[key] = prev[key].map(msg =>
            msg.id === messageId ? { ...msg, is_read: true } : msg
          );
        });

        return updatedMessages;
      });

      // Also refresh conversations to update the UI with read status
      setTimeout(() => {
        refreshConversationsRef();
      }, 500);
    };

    // Handle all messages read
    const handleAllMessagesRead = ({ recipientId, recipientRole }: { recipientId: number, recipientRole: string }) => {
      console.log(`All messages marked as read by recipient ${recipientId} (${recipientRole})`);

      if (currentUser?.id === recipientId && currentUser?.role === recipientRole) {
        // Update all messages from the sender as read
        if (currentSelectedContact) {
          const contactKey = getContactKeyRef(currentSelectedContact.id, currentSelectedContact.role);
          setMessages(prev => {
            const updatedMessages = prev[contactKey]?.map(msg => ({ ...msg, is_read: true })) || [];
            return {
              ...prev,
              [contactKey]: updatedMessages
            };
          });

          // Also refresh conversations to update the UI with read status
          setTimeout(() => {
            refreshConversationsRef();
          }, 500);
        }
      }
    };

    // Handle typing indicators
    const handleUserTyping = ({ userId, userRole }: { userId: number, userRole: string }) => {
      const contactKey = getContactKeyRef(userId, userRole);
      setIsTyping(prev => ({
        ...prev,
        [contactKey]: true
      }));
    };

    // Handle stop typing indicators
    const handleUserStopTyping = ({ userId, userRole }: { userId: number, userRole: string }) => {
      const contactKey = getContactKeyRef(userId, userRole);
      setIsTyping(prev => ({
        ...prev,
        [contactKey]: false
      }));
    };

    // Register event handlers
    socket.on('new-message', handleNewMessage);
    socket.on('message-sent', handleMessageSent);
    socket.on('message-updated', handleMessageUpdated);
    socket.on('message-read', handleMessageRead);
    socket.on('all-messages-read', handleAllMessagesRead);
    socket.on('user-typing', handleUserTyping);
    socket.on('user-stop-typing', handleUserStopTyping);

    // Cleanup function
    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('message-sent', handleMessageSent);
      socket.off('message-updated', handleMessageUpdated);
      socket.off('message-read', handleMessageRead);
      socket.off('all-messages-read', handleAllMessagesRead);
      socket.off('user-typing', handleUserTyping);
      socket.off('user-stop-typing', handleUserStopTyping);
    };
  }, [socket, socket?.connected]); // Only re-register when socket or connection status changes

  // Helper function to get a unique key for a contact
  const getContactKey = (contactId: number, contactRole: string) => {
    return `${contactId}:${contactRole}`;
  };

  // Fetch unread message count
  const fetchUnreadCount = async () => {
    if (!user?.id || !user?.role) {
      console.error('Cannot fetch unread count: user ID or role is missing', user);
      return;
    }

    try {
      // Ensure we're using the correct role format
      let normalizedRole = user.role.toLowerCase();
      // Handle 'particulier' role as 'startup' for the API
      if (normalizedRole === 'particulier') {
        normalizedRole = 'startup';
        console.log('Converting "particulier" role to "startup" for unread count API');
      }

      console.log(`Fetching unread count for user ID: ${user.id}, role: ${normalizedRole}`);
      const count = await getUnreadMessageCount(user.id, normalizedRole);
      console.log(`Unread message count: ${count}`);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Use a ref to track if we're already refreshing to prevent duplicate calls
  const isRefreshing = React.useRef({
    conversations: false,
    contacts: false
  });

  // Refresh conversations
  const refreshConversations = async () => {
    if (!user?.id || !user?.role) {
      console.error('Cannot refresh conversations: user ID or role is missing', user);
      return;
    }

    // Prevent duplicate refreshes
    if (isRefreshing.current.conversations) {
      console.log('Already refreshing conversations, skipping');
      return;
    }

    isRefreshing.current.conversations = true;
    setLoading(true);

    try {
      // Ensure we're using the correct role format
      let normalizedRole = user.role.toLowerCase();
      // Handle 'particulier' role as 'startup' for the API
      if (normalizedRole === 'particulier') {
        normalizedRole = 'startup';
        console.log('Converting "particulier" role to "startup" for conversations API');
      }

      console.log(`Fetching conversations for user ID: ${user.id}, role: ${normalizedRole}`);
      const data = await getConversations(user.id, normalizedRole);
      console.log('Conversations API response:', data);

      // Only update state if the data has actually changed
      setConversations(prev => {
        // Simple check - if length is different, data has changed
        if (prev.length !== data.length) {
          console.log(`Conversations count changed: ${prev.length} -> ${data.length}`);
          return data;
        }

        // Check if any conversation has changed
        const hasChanged = data.some((conv, i) => {
          return prev[i]?.last_message_id !== conv.last_message_id;
        });

        if (hasChanged) {
          console.log('Conversations data has changed, updating state');
        } else {
          console.log('Conversations data unchanged');
        }

        return hasChanged ? data : prev;
      });
    } catch (err) {
      console.error('Error fetching conversations:', err);
      // Only set error if we're not already in error state
      if (!error) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        console.error('Setting error state:', errorMessage);
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
      isRefreshing.current.conversations = false;
    }
  };

  // Refresh contacts
  const refreshContacts = async () => {
    if (!user?.id || !user?.role) {
      console.error('Cannot refresh contacts: user ID or role is missing', user);
      return;
    }

    // Prevent duplicate refreshes
    if (isRefreshing.current.contacts) {
      console.log('Already refreshing contacts, skipping');
      return;
    }

    isRefreshing.current.contacts = true;
    setLoading(true);

    console.log(`Fetching contacts for user ID: ${user.id}, role: ${user.role}`);

    try {
      // Ensure we're using the correct role format
      let normalizedRole = user.role.toLowerCase();
      // Handle 'particulier' role as 'startup' for the API
      if (normalizedRole === 'particulier') {
        normalizedRole = 'startup';
        console.log('Converting "particulier" role to "startup" for API compatibility');
      }

      const data = await getPotentialContacts(user.id, normalizedRole);
      console.log('Contacts API response:', data);

      // Only update state if the data has actually changed
      setContacts(prev => {
        // Simple check - if length is different, data has changed
        if (prev.length !== data.length) {
          console.log(`Contacts count changed: ${prev.length} -> ${data.length}`);
          return data;
        }

        // Check if any contact has changed
        const hasChanged = data.some((contact, i) => {
          return prev[i]?.id !== contact.id || prev[i]?.role !== contact.role;
        });

        if (hasChanged) {
          console.log('Contacts data has changed, updating state');
        } else {
          console.log('Contacts data unchanged');
        }

        return hasChanged ? data : prev;
      });
    } catch (err) {
      console.error('Error fetching contacts:', err);
      // Only set error if we're not already in error state
      if (!error) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        console.error('Setting error state:', errorMessage);
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
      isRefreshing.current.contacts = false;
    }
  };

  // Use a ref to track if we're already loading messages for a contact
  const isLoadingMessages = React.useRef<Record<string, boolean>>({});

  // Load messages for a contact
  const loadMessages = async (contactId: number, contactRole: string) => {
    if (!user?.id || !user?.role) {
      console.error('Cannot load messages: user ID or role is missing', user);
      return;
    }

    // Create a unique key for this contact
    const contactKey = getContactKey(contactId, contactRole);

    // Prevent duplicate loads for the same contact
    if (isLoadingMessages.current[contactKey]) {
      console.log(`Already loading messages for ${contactKey}, skipping`);
      return;
    }

    // Mark as loading
    isLoadingMessages.current[contactKey] = true;
    setLoading(true);

    try {
      // Ensure we're using the correct role format
      let normalizedUserRole = user.role.toLowerCase();
      // Handle 'particulier' role as 'startup' for the API
      if (normalizedUserRole === 'particulier') {
        normalizedUserRole = 'startup';
        console.log('Converting user "particulier" role to "startup" for API compatibility');
      }

      console.log(`Loading messages for ${contactKey} as user ${user.id} (${normalizedUserRole})`);
      const data = await getConversation(user.id, normalizedUserRole, contactId, contactRole);
      console.log(`Received ${data.length} messages for ${contactKey}`);

      // Only update state if the data has actually changed
      setMessages(prev => {
        const prevMessages = prev[contactKey] || [];

        // If we have the same number of messages and the last message ID is the same,
        // assume the data hasn't changed
        if (
          prevMessages.length === data.length &&
          prevMessages.length > 0 &&
          data.length > 0 &&
          prevMessages[0].id === data[0].id
        ) {
          console.log(`No new messages for ${contactKey}`);
          return prev;
        }

        console.log(`Updating messages for ${contactKey}: ${prevMessages.length} -> ${data.length}`);
        // Otherwise, update the messages
        return {
          ...prev,
          [contactKey]: data
        };
      });
    } catch (err) {
      console.error(`Error loading messages for ${contactKey}:`, err);
      // Only set error if we're not already in error state
      if (!error) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        console.error('Setting error state:', errorMessage);
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
      // Mark as no longer loading
      isLoadingMessages.current[contactKey] = false;
    }
  };

  // Send a message
  const sendMessage = async (content: string) => {
    if (!user?.id || !user?.role || !selectedContact) {
      console.error('Cannot send message: missing user or contact information', { user, selectedContact });
      return;
    }

    try {
      // Ensure we're using the correct role format
      let normalizedUserRole = user.role.toLowerCase();
      // Handle 'particulier' role as 'startup' for the API
      if (normalizedUserRole === 'particulier') {
        normalizedUserRole = 'startup';
        console.log('Converting user "particulier" role to "startup" for sending message');
      }

      console.log(`Sending message to ${selectedContact.id} (${selectedContact.role}) as ${user.id} (${normalizedUserRole})`);

      // Create a temporary message for immediate UI feedback regardless of connection method
      // This prevents UI lag while waiting for server response
      const tempMessage: ChatMessage = {
        id: Date.now(), // Temporary ID that will be replaced
        sender_id: user.id,
        sender_role: normalizedUserRole,
        recipient_id: selectedContact.id,
        recipient_role: selectedContact.role,
        content: content,
        is_read: false,
        created_at: new Date().toISOString()
      };

      // Update UI immediately with the temporary message
      const contactKey = getContactKey(selectedContact.id, selectedContact.role);

      // Add a timestamp to the temporary message ID to make it unique
      // This helps prevent duplicate messages if the user clicks send multiple times
      tempMessage.id = Date.now() + Math.floor(Math.random() * 1000);
      console.log(`Created temporary message with ID: ${tempMessage.id}`);

      setMessages(prev => {
        const contactMessages = prev[contactKey] || [];

        // Check if we already have a temporary message with similar content to prevent duplicates
        // This can happen if the user clicks send multiple times quickly
        const similarMessageExists = contactMessages.some(msg =>
          msg.content === tempMessage.content &&
          Date.now() - msg.id < 3000 // Check if a similar message was added in the last 3 seconds
        );

        if (similarMessageExists) {
          console.log('Similar message already exists, not adding duplicate temporary message');
          return prev;
        }

        return {
          ...prev,
          [contactKey]: [...contactMessages, tempMessage]
        };
      });

      if (socket && socket.connected) {
        // Send message via WebSocket
        sendMessageSocket(selectedContact.id, selectedContact.role, content);
        console.log('Message sent via WebSocket with temp ID:', tempMessage.id);

        // The message-updated event will replace the temporary message with the real one
        // No need to add the message again in the handleMessageSent function
      } else {
        console.log('WebSocket not available, using REST API fallback');
        // Fallback to REST API if WebSocket is not available
        const message = await sendMessageREST(
          user.id,
          normalizedUserRole,
          selectedContact.id,
          selectedContact.role,
          content
        );

        console.log('Message sent via REST API:', message);

        // Replace the temporary message with the real one from the server
        setMessages(prev => {
          const contactMessages = prev[contactKey] || [];
          const updatedMessages = contactMessages.map(msg =>
            msg.id === tempMessage.id ? message : msg
          );
          return {
            ...prev,
            [contactKey]: updatedMessages
          };
        });

        // Refresh conversations to update the UI, but debounce it
        setTimeout(() => {
          refreshConversations();
        }, 500);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    }
  };

  // Mark a message as read
  const markAsRead = async (messageId: number) => {
    try {
      if (socket && socket.connected) {
        // Mark message as read via WebSocket if available
        markMessageAsReadSocket(messageId);
      } else {
        // Fallback to REST API if WebSocket is not available
        await markMessageAsReadREST(messageId);

        // Update local state to reflect the change
        setMessages(prev => {
          const updatedMessages: Record<string, ChatMessage[]> = {};

          // Update the read status for the message with the given ID in all conversations
          Object.keys(prev).forEach(key => {
            updatedMessages[key] = prev[key].map(msg =>
              msg.id === messageId ? { ...msg, is_read: true } : msg
            );
          });

          return updatedMessages;
        });
      }
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  // Mark all messages as read
  const markAllAsRead = async () => {
    if (!user?.id || !user?.role || !selectedContact) return;

    try {
      if (socket && socket.connected) {
        // Mark all messages as read via WebSocket if available
        markAllMessagesAsReadSocket(selectedContact.id, selectedContact.role);
      } else {
        // Fallback to REST API if WebSocket is not available
        await markAllMessagesAsReadREST(
          selectedContact.id,
          selectedContact.role,
          user.id,
          user.role
        );

        // Update local state to reflect the change
        const contactKey = getContactKey(selectedContact.id, selectedContact.role);
        setMessages(prev => {
          const updatedMessages = prev[contactKey]?.map(msg => ({ ...msg, is_read: true })) || [];
          return {
            ...prev,
            [contactKey]: updatedMessages
          };
        });
      }
    } catch (err) {
      console.error('Error marking all messages as read:', err);
    }
  };

  // Send typing indicator
  const startTyping = () => {
    if (!user?.id || !user?.role || !selectedContact || !socket || !socket.connected) return;

    try {
      socket.emit('typing', {
        recipientId: selectedContact.id,
        recipientRole: selectedContact.role
      });
    } catch (err) {
      console.error('Error sending typing indicator:', err);
    }
  };

  // Send stop typing indicator
  const stopTyping = () => {
    if (!user?.id || !user?.role || !selectedContact || !socket || !socket.connected) return;

    try {
      socket.emit('stop-typing', {
        recipientId: selectedContact.id,
        recipientRole: selectedContact.role
      });
    } catch (err) {
      console.error('Error sending stop typing indicator:', err);
    }
  };

  // Reset state when component unmounts
  useEffect(() => {
    return () => {
      // Disconnect socket
      disconnectSocket();

      // Reset all state
      setSocket(null);
      setConversations([]);
      setContacts([]);
      setMessages({});
      setSelectedContact(null);
      setUnreadCount(0);
      setIsTyping({});
      setLoading(false);
      setError(null);

      // Reset refs
      isRefreshing.current = {
        conversations: false,
        contacts: false
      };
      isLoadingMessages.current = {};
    };
  }, []);

  return (
    <ChatContext.Provider
      value={{
        socket,
        conversations,
        contacts,
        messages,
        selectedContact,
        unreadCount,
        isTyping,
        loading,
        error,
        setSelectedContact,
        sendMessage,
        markAsRead,
        markAllAsRead,
        startTyping,
        stopTyping,
        refreshConversations,
        refreshContacts,
        loadMessages
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
