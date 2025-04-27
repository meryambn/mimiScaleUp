import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, PaperclipIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Types
interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  senderAvatar?: string;
  content: string;
  timestamp: Date | string;
  isAdmin?: boolean;
}

interface TeamMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  teamName: string;
  teamMembers?: Array<{ name: string; role: string; id?: string }>;
}

// Format date to a readable format
const formatDate = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - dateObj.getTime();
  const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Aujourd'hui à ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffDays === 1) {
    return `Hier à ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffDays < 7) {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return `${days[dateObj.getDay()]} à ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    return `${dateObj.toLocaleDateString()} à ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
};

// Générer des messages fictifs pour simuler une conversation
const generateMockMessages = (teamId: string, teamName: string): Message[] => {
  const adminMessages = [
    {
      id: `msg-${teamId}-admin-1`,
      senderId: 'admin',
      senderName: 'Admin',
      senderRole: 'Gestionnaire de programme',
      content: `Bonjour équipe ${teamName}! Je voulais vous féliciter pour votre progression. Continuez comme ça!`,
      timestamp: new Date(new Date().setDate(new Date().getDate() - 5)),
      isAdmin: true,
    },
    {
      id: `msg-${teamId}-admin-2`,
      senderId: 'admin',
      senderName: 'Admin',
      senderRole: 'Gestionnaire de programme',
      content: 'N\'oubliez pas la réunion de suivi prévue pour vendredi prochain à 14h.',
      timestamp: new Date(new Date().setDate(new Date().getDate() - 2)),
      isAdmin: true,
    }
  ];

  const teamMessages = [
    {
      id: `msg-${teamId}-team-1`,
      senderId: `team-${teamId}`,
      senderName: teamName,
      senderRole: 'Équipe',
      content: 'Merci pour vos encouragements! Nous travaillons dur pour respecter les délais.',
      timestamp: (() => {
        const date = new Date();
        date.setDate(date.getDate() - 5);
        date.setHours(date.getHours() + 1);
        return date;
      })(),
      isAdmin: false,
    },
    {
      id: `msg-${teamId}-team-2`,
      senderId: `team-${teamId}`,
      senderName: teamName,
      senderRole: 'Équipe',
      content: 'Nous avons une question concernant le prochain livrable. Pouvons-nous avoir plus de détails sur les attentes?',
      timestamp: new Date(new Date().setDate(new Date().getDate() - 1)),
      isAdmin: false,
    }
  ];

  // Combiner et trier les messages par date
  return [...adminMessages, ...teamMessages].sort((a, b) => {
    const dateA = new Date(a.timestamp);
    const dateB = new Date(b.timestamp);
    return dateA.getTime() - dateB.getTime();
  });
};

const TeamMessageDialog: React.FC<TeamMessageDialogProps> = ({
  open,
  onOpenChange,
  teamId,
  teamName,
  teamMembers = [],
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Charger les messages depuis localStorage ou générer des messages fictifs
  useEffect(() => {
    if (open) {
      try {
        // Essayer de charger les messages depuis localStorage
        const storedMessagesJSON = localStorage.getItem(`teamMessages_${teamId}`);
        if (storedMessagesJSON) {
          const storedMessages = JSON.parse(storedMessagesJSON);
          setMessages(storedMessages);
        } else {
          // Si aucun message n'existe, générer des messages fictifs
          const mockMessages = generateMockMessages(teamId, teamName);
          setMessages(mockMessages);
          // Sauvegarder les messages fictifs dans localStorage
          localStorage.setItem(`teamMessages_${teamId}`, JSON.stringify(mockMessages));
        }
      } catch (error) {
        console.error('Erreur lors du chargement des messages:', error);
        // En cas d'erreur, utiliser des messages fictifs
        setMessages(generateMockMessages(teamId, teamName));
      }
    }
  }, [open, teamId, teamName]);

  // Faire défiler automatiquement vers le bas lorsque de nouveaux messages sont ajoutés
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    setIsSending(true);

    // Créer un nouveau message
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      senderId: 'admin',
      senderName: 'Admin',
      senderRole: 'Gestionnaire de programme',
      content: newMessage,
      timestamp: new Date(),
      isAdmin: true,
    };

    // Ajouter le message à la liste des messages
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);

    // Sauvegarder dans localStorage
    localStorage.setItem(`teamMessages_${teamId}`, JSON.stringify(updatedMessages));

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
      const responseMsg: Message = {
        id: `msg-${Date.now()}`,
        senderId: `team-${teamId}`,
        senderName: teamName,
        senderRole: 'Équipe',
        content: randomResponse,
        timestamp: new Date(),
        isAdmin: false,
      };

      // Ajouter la réponse à la liste des messages
      const withResponseMessages = [...updatedMessages, responseMsg];
      setMessages(withResponseMessages);

      // Sauvegarder dans localStorage
      localStorage.setItem(`teamMessages_${teamId}`, JSON.stringify(withResponseMessages));

      // Mettre à jour le compteur de messages non lus global
      const unreadCountJSON = localStorage.getItem('unreadMessageCount') || '0';
      const unreadCount = parseInt(unreadCountJSON, 10);
      localStorage.setItem('unreadMessageCount', (unreadCount + 1).toString());

      // Mettre à jour les messages globaux pour l'interface principale
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
      } catch (error) {
        console.error('Erreur lors de la mise à jour des messages globaux:', error);
      }
    }, responseDelay);

    // Réinitialiser le champ de message
    setNewMessage('');
    setIsSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Conversation avec {teamName}</DialogTitle>
        </DialogHeader>

        {/* Messages area */}
        <ScrollArea className="flex-1 p-4" type="always">
          <div className="space-y-4" style={{ paddingRight: '8px' }}>
            {messages.map((message, index) => {
              // Check if we should show the date separator
              const showDateSeparator = index === 0 ||
                new Date(message.timestamp).toDateString() !== new Date(messages[index - 1].timestamp).toDateString();

              return (
                <React.Fragment key={message.id}>
                  {showDateSeparator && (
                    <div className="flex items-center my-4">
                      <div className="flex-grow border-t border-gray-200"></div>
                      <div className="mx-4 text-xs text-gray-500">
                        {new Date(message.timestamp).toLocaleDateString()}
                      </div>
                      <div className="flex-grow border-t border-gray-200"></div>
                    </div>
                  )}

                  <div className={`flex ${message.isAdmin ? 'justify-end' : 'justify-start'}`}>
                    {!message.isAdmin && (
                      <Avatar className="h-8 w-8 mr-2 mt-1">
                        <AvatarImage src={message.senderAvatar} />
                        <AvatarFallback className="bg-primary-100 text-primary-800">
                          {message.senderName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div className="flex flex-col max-w-[80%]">
                      {!message.isAdmin && (
                        <div className="flex items-baseline mb-1">
                          <span className="font-medium text-sm">{message.senderName}</span>
                          {message.senderRole && (
                            <span className="text-xs text-gray-500 ml-2">{message.senderRole}</span>
                          )}
                        </div>
                      )}

                      <div
                        className={`p-3 rounded-lg ${
                          message.isAdmin
                            ? 'bg-primary text-white rounded-tr-none'
                            : 'bg-gray-100 rounded-tl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.isAdmin ? 'text-primary-100' : 'text-gray-500'
                        }`}>
                          {formatDate(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message input */}
        <div className="p-4 border-t mt-auto">
          <div className="flex items-center">
            <Input
              placeholder="Écrivez votre message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1 mr-2"
            />
            <Button
              variant="outline"
              size="icon"
              className="mr-2"
              type="button"
            >
              <PaperclipIcon className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
              type="button"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TeamMessageDialog;
