import React, { useState } from "react";
import { Bell, Menu, MessageSquare, HelpCircle, ChevronDown, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import MessagesDialog from "@/components/messages/MessagesDialog";
import NotificationBell from "@/components/NotificationBell";

interface ParticulierHeaderProps {
  onToggleSidebar: () => void;
}

const ParticulierHeader: React.FC<ParticulierHeaderProps> = ({ onToggleSidebar }) => {
  const [location] = useLocation();
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  // Charger le compteur de messages non lus depuis localStorage
  React.useEffect(() => {
    const checkUnreadMessages = () => {
      try {
        const count = localStorage.getItem('unreadMessageCount') || '0';
        setUnreadMessageCount(parseInt(count, 10));
      } catch (error) {
        console.error('Erreur lors du chargement du compteur de messages:', error);
      }
    };

    // Vérifier au chargement
    checkUnreadMessages();

    // Vérifier toutes les 5 secondes
    const interval = setInterval(checkUnreadMessages, 5000);

    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { name: 'Tableau de bord', href: '/particulier/dashboard' },
    { name: 'Profil', href: '/particulier/profile' }
  ];

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/';
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="admin-header relative z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200">
      <button
        type="button"
        className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
        onClick={onToggleSidebar}
      >
        <span className="sr-only">Ouvrir la barre latérale</span>
        <Menu className="h-6 w-6" />
      </button>
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex items-center">
          {/* Navigation Links */}
          <nav className="flex space-x-4" style={{ display: 'flex !important' }}>
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <span className={cn(
                  "text-base font-medium transition-colors cursor-pointer",
                  location.startsWith(link.href)
                    ? "text-primary border-primary"
                    : "text-gray-600 hover:text-primary"
                )}>
                  {link.name}
                </span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="admin-header-actions flex items-center space-x-2 ml-4">
          <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0">
            <HelpCircle className="h-4 w-4 text-gray-500" />
          </Button>
          <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0 relative" onClick={() => setMessagesOpen(true)}>
            <MessageSquare className="h-4 w-4 text-gray-500" />
            {unreadMessageCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-white">{unreadMessageCount}</span>
            )}
          </Button>
          <MessagesDialog open={messagesOpen} onOpenChange={setMessagesOpen} />
          <div className="rounded-full relative flex items-center justify-center h-8 w-8">
            <NotificationBell />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="admin-header-profile rounded-full flex items-center gap-1 px-1 h-8">
                <Avatar className="h-6 w-6">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary-100 text-primary-800 text-xs">
                    {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-xs hidden md:inline-block">{user?.email || 'Utilisateur'}</span>
                <ChevronDown className="h-3 w-3 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="cursor-pointer" onClick={() => window.location.href = '/particulier/profile'}>
                Profil
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">Paramètres du compte</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-600" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Déconnexion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default ParticulierHeader;
