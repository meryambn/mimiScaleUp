import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Search, Loader2, MessageSquare } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { ChatContact, ChatMessage } from '@/services/chatService';
import { debounce } from 'lodash';

// CSS for typing indicator
const typingIndicatorStyles = `
.typing-indicator {
  display: flex;
  align-items: center;
}

.typing-indicator span {
  height: 8px;
  width: 8px;
  margin: 0 1px;
  background-color: #9ca3af;
  border-radius: 50%;
  display: inline-block;
  opacity: 0.4;
}

.typing-indicator span:nth-child(1) {
  animation: bounce 1.5s infinite;
}

.typing-indicator span:nth-child(2) {
  animation: bounce 1.5s infinite 0.3s;
}

.typing-indicator span:nth-child(3) {
  animation: bounce 1.5s infinite 0.6s;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}
`;

// Format date to a readable format
const formatDate = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - dateObj.getTime();
  const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Hier';
  } else if (diffDays < 7) {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days[dateObj.getDay()];
  } else {
    return dateObj.toLocaleDateString();
  }
};

interface MessagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MessagesDialog: React.FC<MessagesDialogProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const {
    contacts,
    conversations,
    messages,
    selectedContact,
    setSelectedContact,
    sendMessage,
    markAsRead,
    markAllAsRead,
    startTyping,
    stopTyping,
    refreshContacts,
    refreshConversations,
    loadMessages,
    isTyping,
    loading,
    error,
    socket
  } = useChat();

  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Load contacts and conversations when dialog opens - memoized to prevent unnecessary re-renders
  const loadInitialData = useCallback(() => {
    if (open && user) {
      console.log('Loading contacts for user:', user);
      refreshContacts();
      refreshConversations();
    }
  }, [open, user, refreshContacts, refreshConversations]);

  // Use the memoized function in useEffect
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Use a ref to track the previous selected contact to prevent unnecessary loads
  const prevSelectedContactRef = useRef<{ id: number | null, role: string | null }>({ id: null, role: null });

  // Track if messages are already loaded for a contact
  const messagesLoadedRef = useRef<Record<string, boolean>>({});

  // Load messages when a contact is selected - memoized to prevent unnecessary re-renders
  const loadContactMessages = useCallback(() => {
    // Only proceed if we have a valid selected contact
    if (selectedContact && user && selectedContact.id && selectedContact.role) {
      // Check if this is a different contact than before
      const isSameContact =
        prevSelectedContactRef.current.id === selectedContact.id &&
        prevSelectedContactRef.current.role === selectedContact.role;

      // Update the ref with current contact
      prevSelectedContactRef.current = {
        id: selectedContact.id,
        role: selectedContact.role
      };

      // Create a contact key to track if we've loaded messages for this contact
      const contactKey = `${selectedContact.id}:${selectedContact.role}`;

      // Only load messages if this is a new contact or we don't have messages yet
      if (!isSameContact || !messages[contactKey] || messages[contactKey].length === 0) {
        // Check if we're already loading messages for this contact
        if (!messagesLoadedRef.current[contactKey]) {
          console.log(`Loading messages for contact: ${selectedContact.id} (${selectedContact.role})`);
          messagesLoadedRef.current[contactKey] = true;

          // Load messages and then mark as not loading
          loadMessages(selectedContact.id, selectedContact.role)
            .finally(() => {
              messagesLoadedRef.current[contactKey] = false;
            });
        } else {
          console.log(`Already loading messages for contact: ${selectedContact.id} (${selectedContact.role})`);
        }
      }
    }
  }, [selectedContact?.id, selectedContact?.role, user, messages, loadMessages]);

  // Use the memoized function in useEffect
  useEffect(() => {
    loadContactMessages();
  }, [loadContactMessages]);

  // Scroll to bottom when messages change or when a new message is sent - memoized
  const scrollToBottomEffect = useCallback(() => {
    if (messagesEndRef.current && selectedContact) {
      // Use a small timeout to ensure DOM has updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [selectedContact]);

  // Use the memoized function in useEffect
  useEffect(() => {
    scrollToBottomEffect();
  }, [scrollToBottomEffect, messages]);

  // Also scroll to bottom when sending a message
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Mark messages as read when viewing them - memoized
  const markMessagesAsReadEffect = useCallback(() => {
    if (selectedContact && selectedContact.id && selectedContact.role) {
      const contactKey = `${selectedContact.id}:${selectedContact.role}`;
      const contactMessages = messages[contactKey];

      if (contactMessages && contactMessages.length > 0) {
        const unreadMessages = contactMessages
          .filter(msg => !msg.is_read && msg.sender_id === selectedContact.id);

        if (unreadMessages.length > 0) {
          // Use Promise.all to mark all messages as read in parallel
          Promise.all(unreadMessages.map(msg => markAsRead(msg.id)))
            .catch(err => console.error('Error marking messages as read:', err));
        }
      }
    }
  }, [selectedContact?.id, selectedContact?.role, messages, markAsRead]);

  // Use the memoized function in useEffect
  useEffect(() => {
    markMessagesAsReadEffect();
  }, [markMessagesAsReadEffect]);

  // Filter contacts based on search query - memoized to prevent recalculation on every render
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact =>
      (contact.name ? contact.name.toLowerCase().includes(searchQuery.toLowerCase()) : false) ||
      (contact.role ? contact.role.toLowerCase().includes(searchQuery.toLowerCase()) : false)
    );
  }, [contacts, searchQuery]);

  // Handle sending a message - memoized to prevent recreation on every render
  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !selectedContact) return;

    sendMessage(newMessage);
    setNewMessage('');

    // Scroll to bottom after sending a message
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  }, [newMessage, selectedContact, sendMessage, scrollToBottom]);

  // Handle key press (Enter to send) - memoized
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Handle typing indicators with debounce - created once
  const debouncedStartTyping = useMemo(() =>
    debounce(() => {
      if (isInputFocused) {
        startTyping();
      }
    }, 300)
  , [isInputFocused, startTyping]);

  const debouncedStopTyping = useMemo(() =>
    debounce(() => {
      stopTyping();
    }, 1000)
  , [stopTyping]);

  // Handle input change - memoized
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (e.target.value.length > 0) {
      debouncedStartTyping();
    } else {
      debouncedStopTyping();
    }
  }, [debouncedStartTyping, debouncedStopTyping]);

  // Get current messages for selected contact - memoized
  const getCurrentMessages = useCallback((): ChatMessage[] => {
    if (!selectedContact) return [];
    const contactKey = `${selectedContact.id}:${selectedContact.role}`;
    // Sort messages by created_at date in ascending order (oldest first)
    return (messages[contactKey] || []).sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateA - dateB;
    });
  }, [selectedContact, messages]);

  // Check if contact is typing - memoized
  const isContactTyping = useCallback((contact: ChatContact): boolean => {
    const contactKey = `${contact.id}:${contact.role}`;
    return isTyping[contactKey] || false;
  }, [isTyping]);

  // Handle dialog open/close - memoized
  const handleOpenChange = useCallback((isOpen: boolean) => {
    // If dialog is closing, reset the selected contact
    if (!isOpen) {
      setSelectedContact(null);
    }
    onOpenChange(isOpen);
  }, [onOpenChange, setSelectedContact]);

  // Memoize the dialog content to prevent re-renders
  const dialogContent = useMemo(() => (
    <>
      <style dangerouslySetInnerHTML={{ __html: typingIndicatorStyles }} />
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            Messages
            {socket && socket.connected ? (
              <span className="text-xs text-green-600 font-normal bg-green-100 px-2 py-1 rounded-full flex items-center">
                <span className="w-2 h-2 bg-green-600 rounded-full mr-1"></span>
                Connecté
              </span>
            ) : (
              <span className="text-xs text-amber-600 font-normal bg-amber-100 px-2 py-1 rounded-full flex items-center">
                <span className="w-2 h-2 bg-amber-600 rounded-full mr-1"></span>
                Mode hors ligne
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            {user?.role === 'mentor'
              ? "Chattez avec l'accélérateur et les participants du programme."
              : user?.role === 'startup' || user?.role === 'particulier'
                ? "Chattez avec l'accélérateur et les mentors du programme."
                : "Communiquez avec les participants et les mentors du programme."
            }
            {!socket || !socket.connected ? (
              <div className="mt-2 flex items-center">
                <div className="text-xs text-amber-600">
                  La connexion en temps réel n'est pas disponible. Les messages seront mis à jour périodiquement.
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2 h-6 text-xs"
                  onClick={() => {
                    refreshContacts();
                    refreshConversations();
                    if (selectedContact) {
                      loadMessages(selectedContact.id, selectedContact.role);
                    }
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <path d="M21 2v6h-6"></path>
                    <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                    <path d="M3 22v-6h6"></path>
                    <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                  </svg>
                  Actualiser
                </Button>
              </div>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Contacts sidebar */}
          <div className="w-1/3 border-r flex flex-col min-h-0">
            <div className="p-3 border-b flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Rechercher..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-hidden min-h-0">
              <div className="h-full overflow-y-auto">
                <div className="space-y-1 p-2">
                  {loading ? (
                    <div className="flex justify-center items-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : filteredContacts.length > 0 ? (
                    filteredContacts.map(contact => (
                      <div
                        key={contact.id}
                        className={`flex items-center p-3 rounded-lg cursor-pointer hover:bg-gray-100 ${
                          selectedContact?.id === contact.id ? 'bg-gray-100' : ''
                        }`}
                        onClick={() => {
                          // Only update if it's a different contact
                          if (!selectedContact || selectedContact.id !== contact.id || selectedContact.role !== contact.role) {
                            setSelectedContact(contact);
                          }
                        }}
                      >
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src={contact.avatar} />
                          <AvatarFallback className="bg-primary-100 text-primary-800">
                            {contact.name ? contact.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <p className="font-medium truncate">{contact.name}</p>
                            {contact.lastMessageTime && (
                              <span className="text-xs text-gray-500">
                                {formatDate(contact.lastMessageTime)}
                              </span>
                            )}
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-500 truncate">
                              {isContactTyping(contact) ? (
                                <span className="text-primary">En train d'écrire...</span>
                              ) : (
                                contact.lastMessage || contact.role
                              )}
                            </p>
                            {contact.unreadCount && contact.unreadCount > 0 && (
                              <span className="bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {contact.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-4 space-y-2">
                      <p className="text-gray-500">Aucun contact trouvé</p>
                      {error ? (
                        <p className="text-red-500 text-xs">{error}</p>
                      ) : user?.role === 'mentor' ? (
                        <p className="text-xs text-gray-400">
                          Assurez-vous que vous êtes assigné à un programme avec des startups
                        </p>
                      ) : user?.role === 'startup' || user?.role === 'particulier' ? (
                        <p className="text-xs text-gray-400">
                          Assurez-vous que votre programme a des mentors assignés
                        </p>
                      ) : null}
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={refreshContacts}
                      >
                        Actualiser les contacts
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Message area */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {selectedContact ? (
              <>
                {/* Contact header */}
                <div className="p-4 border-b flex items-center justify-between flex-shrink-0 bg-white shadow-sm">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={selectedContact.avatar} />
                      <AvatarFallback className="bg-primary-100 text-primary-800">
                        {selectedContact.name ? selectedContact.name.split(' ').map(n => n[0]).join('') : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedContact.name}</p>
                      <p className="text-sm text-gray-500">{selectedContact.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {socket && socket.connected ? (
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full flex items-center">
                        <span className="w-2 h-2 bg-green-600 rounded-full mr-1"></span>
                        En ligne
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto min-h-0 bg-gray-50" style={{ scrollBehavior: 'smooth' }}>
                  <div className="space-y-4 max-w-3xl mx-auto">
                    {loading ? (
                      <div className="flex justify-center items-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : getCurrentMessages().length > 0 ? (
                      getCurrentMessages().map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[80%] p-3 rounded-lg shadow-sm ${
                              message.sender_id === user?.id
                                ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white rounded-tr-none ml-auto'
                                : 'bg-white text-gray-900 rounded-tl-none border border-gray-200'
                            }`}
                          >
                            <p className="break-words">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              message.sender_id === user?.id ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {formatDate(message.created_at)}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-gray-200 my-8">
                        <MessageSquare className="h-10 w-10 mx-auto mb-3 text-blue-300" />
                        <p className="text-gray-600 font-medium">Aucun message</p>
                        <p className="text-gray-500 text-sm mt-1">Commencez la conversation en envoyant un message!</p>
                      </div>
                    )}
                    {isContactTyping(selectedContact) && (
                      <div className="flex justify-start">
                        <div className="bg-white p-3 rounded-lg rounded-tl-none border border-gray-200 shadow-sm">
                          <div className="flex items-center">
                            <div className="typing-indicator mr-2">
                              <span></span>
                              <span></span>
                              <span></span>
                            </div>
                            <span className="text-xs text-gray-500">En train d'écrire...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Message input */}
                <div className="p-4 border-t flex-shrink-0 bg-gray-50">
                  <div className="flex items-center">
                    <Input
                      placeholder="Écrivez votre message..."
                      value={newMessage}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyPress}
                      onFocus={() => setIsInputFocused(true)}
                      onBlur={() => {
                        setIsInputFocused(false);
                        debouncedStopTyping();
                      }}
                      className="flex-1 mr-3 border-gray-300"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 h-10 shadow-sm"
                      type="submit"
                    >
                      <Send className="h-5 w-5 mr-2" />
                      <span>Envoyer</span>
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 p-4">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Sélectionnez un contact pour commencer une conversation.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  ), [
    open,
    handleOpenChange,
    socket,
    user,
    selectedContact,
    contacts,
    messages,
    isTyping,
    loading,
    error,
    searchQuery,
    newMessage,
    isInputFocused,
    filteredContacts,
    handleInputChange,
    handleKeyPress,
    handleSendMessage,
    getCurrentMessages,
    isContactTyping
  ]);

  // Return the memoized content
  return dialogContent;
};

export default MessagesDialog;
