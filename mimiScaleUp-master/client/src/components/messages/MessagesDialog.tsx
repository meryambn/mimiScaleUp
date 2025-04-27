import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';


import { Send, Search } from 'lucide-react';

// Types
interface Message {
  id: string;
  teamId?: string;
  teamName?: string;
  content: string;
  timestamp: Date | string;
  read: boolean;
  senderId?: string;
  receiverId?: string;
  senderName?: string;
  senderRole?: string;
  isAdmin?: boolean;
}

interface Contact {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
}

// Fonction pour générer les contacts à partir des équipes
const getTeamContacts = (): Contact[] => {
  try {
    // Récupérer les équipes depuis localStorage
    const storedStartups = localStorage.getItem('startups');
    if (!storedStartups) return [];

    const startups = JSON.parse(storedStartups);
    if (!Array.isArray(startups)) return [];

    // Récupérer les messages des équipes
    const storedMessages = localStorage.getItem('teamMessages');
    const teamMessages = storedMessages ? JSON.parse(storedMessages) : {};

    // Créer un contact pour chaque équipe
    return startups.map(startup => {
      const teamId = String(startup.id);
      const messages = teamMessages[teamId] || [];
      const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

      return {
        id: teamId,
        name: startup.name,
        role: 'Équipe',
        avatar: startup.logo,
        lastMessage: lastMessage ? lastMessage.content : '',
        lastMessageTime: lastMessage ? new Date(lastMessage.timestamp) : undefined,
        unreadCount: messages.filter((msg: Message) => !msg.read).length,
      };
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des contacts:', error);
    return [];
  }
};



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

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [teamMessages, setTeamMessages] = useState<Record<string, Message[]>>({});
  const [contacts, setContacts] = useState<Contact[]>([]);

  // Charger les messages des équipes et les contacts depuis localStorage
  React.useEffect(() => {
    if (open) {
      try {
        // Charger les messages
        const storedMessages = localStorage.getItem('teamMessages');
        if (storedMessages) {
          setTeamMessages(JSON.parse(storedMessages));

          // Réinitialiser le compteur de messages non lus
          localStorage.setItem('unreadMessageCount', '0');
        }

        // Charger les contacts à partir des équipes
        const teamContacts = getTeamContacts();
        setContacts(teamContacts);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      }
    }
  }, [open]);

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedContact) return;

    const teamId = selectedContact.id;
    const teamName = selectedContact.name;
    const teamMessagesKey = `teamMessages_${teamId}`;

    // Créer un nouveau message
    const newMsg = {
      id: `msg-${Date.now()}`,
      senderId: 'admin',
      senderName: 'Admin',
      senderRole: 'Gestionnaire de programme',
      content: newMessage,
      timestamp: new Date(),
      isAdmin: true,
    };

    // Récupérer les messages existants
    const storedTeamMessages = localStorage.getItem(teamMessagesKey);
    const existingMessages = storedTeamMessages ? JSON.parse(storedTeamMessages) : [];

    // Ajouter le nouveau message
    const updatedMessages = [...existingMessages, newMsg];

    // Sauvegarder les messages mis à jour
    localStorage.setItem(teamMessagesKey, JSON.stringify(updatedMessages));

    // Mettre à jour les messages globaux
    try {
      const globalMessagesJSON = localStorage.getItem('teamMessages') || '{}';
      const globalMessages = JSON.parse(globalMessagesJSON);

      // Ajouter ou mettre à jour les messages de cette équipe
      globalMessages[teamId] = globalMessages[teamId] || [];
      globalMessages[teamId].push({
        id: newMsg.id,
        teamId,
        teamName,
        content: newMsg.content,
        timestamp: newMsg.timestamp,
        read: true,
      });

      localStorage.setItem('teamMessages', JSON.stringify(globalMessages));

      // Mettre à jour l'état local
      setTeamMessages(globalMessages);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des messages globaux:', error);
    }

    // Simuler une réponse de l'équipe après un délai aléatoire
    const responseDelay = Math.floor(Math.random() * 3000) + 2000; // 2-5 secondes
    setTimeout(() => {
      // Générer une réponse aléatoire
      const responses = [
        'Merci pour l\'information!',
        'Nous allons examiner cela et revenir vers vous.',
        'C\'est noté, nous travaillons dessus.',
        'Pouvez-vous nous donner plus de détails?',
        'Nous avons bien reçu votre message.',
        'Nous avons une question: quand est la prochaine réunion?',
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      // Créer un message de réponse
      const responseMsg = {
        id: `msg-${Date.now()}`,
        senderId: `team-${teamId}`,
        senderName: teamName,
        senderRole: 'Équipe',
        content: randomResponse,
        timestamp: new Date(),
        isAdmin: false,
      };

      // Ajouter la réponse aux messages de l'équipe
      const storedTeamMessages = localStorage.getItem(teamMessagesKey);
      const existingMessages = storedTeamMessages ? JSON.parse(storedTeamMessages) : [];
      const withResponseMessages = [...existingMessages, responseMsg];
      localStorage.setItem(teamMessagesKey, JSON.stringify(withResponseMessages));

      // Mettre à jour le compteur de messages non lus global
      const unreadCountJSON = localStorage.getItem('unreadMessageCount') || '0';
      const unreadCount = parseInt(unreadCountJSON, 10);
      localStorage.setItem('unreadMessageCount', (unreadCount + 1).toString());

      // Mettre à jour les messages globaux
      try {
        const globalMessagesJSON = localStorage.getItem('teamMessages') || '{}';
        const globalMessages = JSON.parse(globalMessagesJSON);

        // Ajouter ou mettre à jour les messages de cette équipe
        globalMessages[teamId] = globalMessages[teamId] || [];
        globalMessages[teamId].push({
          id: responseMsg.id,
          teamId,
          teamName,
          content: responseMsg.content,
          timestamp: responseMsg.timestamp,
          read: false,
        });

        localStorage.setItem('teamMessages', JSON.stringify(globalMessages));

        // Mettre à jour l'état local
        setTeamMessages(globalMessages);

        // Mettre à jour les contacts
        setContacts(getTeamContacts());
      } catch (error) {
        console.error('Erreur lors de la mise à jour des messages globaux:', error);
      }
    }, responseDelay);

    // Clear the input
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Messages</DialogTitle>
          <DialogDescription>
            Communiquez avec les participants et les mentors du programme.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Contacts sidebar */}
          <div className="w-1/3 border-r flex flex-col">
            <div className="p-3 border-b">
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

            <div className="flex-1 flex flex-col">

              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full" type="always">
                  <div className="space-y-1 p-2" style={{ paddingRight: '8px' }}>
                    {filteredContacts.map(contact => (
                      <div
                        key={contact.id}
                        className={`flex items-center p-3 rounded-lg cursor-pointer hover:bg-gray-100 ${
                          selectedContact?.id === contact.id ? 'bg-gray-100' : ''
                        }`}
                        onClick={() => setSelectedContact(contact)}
                      >
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src={contact.avatar} />
                          <AvatarFallback className="bg-primary-100 text-primary-800">
                            {contact.name.split(' ').map(n => n[0]).join('')}
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
                              {contact.lastMessage || contact.role}
                            </p>
                            {contact.unreadCount && contact.unreadCount > 0 && (
                              <span className="bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {contact.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>

          {/* Message area */}
          <div className="flex-1 flex flex-col">
            {selectedContact ? (
              <>
                {/* Contact header */}
                <div className="p-4 border-b flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={selectedContact.avatar} />
                    <AvatarFallback className="bg-primary-100 text-primary-800">
                      {selectedContact.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedContact.name}</p>
                    <p className="text-sm text-gray-500">{selectedContact.role}</p>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4" type="always">
                  <div className="space-y-4" style={{ paddingRight: '8px' }}>
                    {(() => {
                      // Récupérer les messages de l'équipe sélectionnée depuis teamMessages_[id]
                      const teamId = selectedContact.id;
                      const teamMessagesKey = `teamMessages_${teamId}`;
                      const storedTeamMessages = localStorage.getItem(teamMessagesKey);
                      const messages = storedTeamMessages ? JSON.parse(storedTeamMessages) : [];

                      return messages.map((message: Message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.senderId === 'admin' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.senderId === 'admin'
                              ? 'bg-primary text-white rounded-tr-none'
                              : 'bg-gray-100 rounded-tl-none'
                          }`}
                        >
                          <p>{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.senderId === 'admin' ? 'text-primary-100' : 'text-gray-500'
                          }`}>
                            {formatDate(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    ));
                    })()}
                  </div>
                </ScrollArea>

                {/* Message input */}
                <div className="p-4 border-t">
                  <div className="flex items-center">
                    <Input
                      placeholder="Écrivez votre message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="flex-1 mr-2"
                    />
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Sélectionnez un contact pour commencer une conversation.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessagesDialog;
