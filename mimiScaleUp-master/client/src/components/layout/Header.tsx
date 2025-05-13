import React, { useState } from "react";
import { Bell, Menu, MessageSquare, HelpCircle, ChevronDown, LogOut } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
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
import ProgramSelector from "@/components/program/ProgramSelector";
import MessagesDialog from "@/components/messages/MessagesDialog";
import { useAuth } from "@/context/AuthContext";

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const [location] = useLocation();
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const { user, logout } = useAuth();

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
    { name: 'Tableau de bord', href: '/admin/dashboard' },
    { name: 'Programmes', href: '/admin/programs' }
  ];

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
                  "px-3 py-2 text-base font-medium transition-colors cursor-pointer rounded-md",
                  location.startsWith(link.href)
                    ? "text-primary bg-red-50 border-primary"
                    : "text-gray-600 hover:text-primary hover:bg-red-50"
                )}>
                  {link.name}
                </span>
              </Link>
            ))}
          </nav>

          {/* Program Selector */}
          <div className="ml-8">
            <ProgramSelector />
          </div>
        </div>

        <div className="admin-header-actions flex items-center space-x-3 ml-6">
          <Button variant="ghost" size="icon" className="rounded-full">
            <HelpCircle className="h-5 w-5 text-gray-500" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full relative" onClick={() => setMessagesOpen(true)}>
            <MessageSquare className="h-5 w-5 text-gray-500" />
            {unreadMessageCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">{unreadMessageCount}</span>
            )}
          </Button>
          <MessagesDialog open={messagesOpen} onOpenChange={setMessagesOpen} />
          <Button variant="ghost" size="icon" className="rounded-full relative">
            <NotificationBell />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="admin-header-profile rounded-full flex items-center gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary-100 text-primary-800">AU</AvatarFallback>
                </Avatar>
                <span className="font-medium hidden md:inline-block">
                  {user?.role === 'mentor'
                    ? user?.email || 'Mentor'
                    : user?.name || 'Utilisateur'}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <Link href={user?.role === 'mentor' ? '/mentors/profile' : (user?.role === 'admin' ? '/admin/profile' : '/')}>
                <DropdownMenuItem className="cursor-pointer">Profil</DropdownMenuItem>
              </Link>
              <DropdownMenuItem className="cursor-pointer">Paramètres du compte</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-600" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default Header;