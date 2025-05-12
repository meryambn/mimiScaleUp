import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  UserSquare2,
  FormInput,
  CalendarClock,
  BookOpen,
  Settings,
  HelpCircle,
  ClipboardCheck,
  FileCheck,
  LogOut,
  TestTube
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useProgramContext } from "@/context/ProgramContext";
import { useAuth, UserRole } from "@/context/AuthContext";

const RoleSidebar: React.FC = () => {
  const [location] = useLocation();
  const { selectedProgram } = useProgramContext();
  const { user, logout } = useAuth();
  const [applicationCount, setApplicationCount] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Always set isCollapsed to false to disable collapsible functionality
  useEffect(() => {
    setIsCollapsed(false);
  }, []);

  // Get application count from localStorage
  useEffect(() => {
    try {
      const storedApplications = localStorage.getItem('applications');
      if (storedApplications) {
        const applications = JSON.parse(storedApplications);
        setApplicationCount(Array.isArray(applications) ? applications.length : 0);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
    }
  }, []);

  // Define navigation items based on user role
  const getNavItems = (role: UserRole) => {
    // Common items for all roles
    const commonItems = [
      {
        name: "Tableau de bord",
        path: "/dashboard",
        icon: <LayoutDashboard className="h-5 w-5" />
      }
    ];

    // Admin-specific items
    if (role === 'admin') {
      return [
        {
          name: "Programmes",
          path: "/admin/programs",
          icon: <GraduationCap className="h-5 w-5" />
        },
        {
          name: "Tableau de bord",
          path: "/admin/dashboard",
          icon: <LayoutDashboard className="h-5 w-5" />
        },
        {
          name: "Équipes",
          path: "/admin/teams",
          icon: <UserSquare2 className="h-5 w-5" />
        },
        {
          name: "Mentors",
          path: "/admin/mentors",
          icon: <Users className="h-5 w-5" />
        },
        {
          name: "Candidatures",
          path: "/admin/applications",
          icon: <FormInput className="h-5 w-5" />,
          badge: applicationCount.toString(),
          badgeColor: "bg-green-500"
        },
        {
          name: "Réunions",
          path: "/admin/meetings",
          icon: <CalendarClock className="h-5 w-5" />
        },
        {
          name: "Tâches",
          path: "/admin/tasks",
          icon: <ClipboardCheck className="h-5 w-5" />
        },
        {
          name: "Livrables",
          path: "/admin/deliverables",
          icon: <FileCheck className="h-5 w-5" />
        }
      ];
    }

    // Mentor-specific items
    if (role === 'mentor') {
      return [
        {
          name: "Programmes",
          path: "/mentors/programs",
          icon: <GraduationCap className="h-5 w-5" />
        },
        {
          name: "Tableau de bord",
          path: "/mentors/dashboard",
          icon: <LayoutDashboard className="h-5 w-5" />
        },
        {
          name: "Équipes",
          path: "/mentors/teams",
          icon: <UserSquare2 className="h-5 w-5" />
        },
        {
          name: "Candidatures",
          path: "/mentors/applications",
          icon: <FormInput className="h-5 w-5" />,
          badge: applicationCount.toString(),
          badgeColor: "bg-green-500"
        },
        {
          name: "Réunions",
          path: "/mentors/meetings",
          icon: <CalendarClock className="h-5 w-5" />
        },
        {
          name: "Tâches",
          path: "/mentors/tasks",
          icon: <ClipboardCheck className="h-5 w-5" />
        },
        {
          name: "Livrables",
          path: "/mentors/deliverables",
          icon: <FileCheck className="h-5 w-5" />
        }
      ];
    }

    // Default to common items if role is not recognized
    return commonItems;
  };

  // Secondary navigation items based on role
  const getSecondaryNavItems = (role: UserRole) => {
    if (role === 'admin') {
      return [
        { name: "Ressources", path: "/admin/resources", icon: <BookOpen className="h-5 w-5" /> },
        { name: "Paramètres", path: "/admin/settings", icon: <Settings className="h-5 w-5" /> },
        { name: "Aide", path: "/admin/help", icon: <HelpCircle className="h-5 w-5" /> },
        { name: "Créer Équipe Test", path: "/admin/test/create-team", icon: <TestTube className="h-5 w-5" /> },
      ];
    } else if (role === 'mentor') {
      return [
        { name: "Ressources", path: "/mentors/resources", icon: <BookOpen className="h-5 w-5" /> },
        { name: "Paramètres", path: "/mentors/settings", icon: <Settings className="h-5 w-5" /> },
        { name: "Aide", path: "/mentors/help", icon: <HelpCircle className="h-5 w-5" /> },
      ];
    }

    // Default items for other roles
    return [
      { name: "Ressources", path: "/resources", icon: <BookOpen className="h-5 w-5" /> },
      { name: "Aide", path: "/help", icon: <HelpCircle className="h-5 w-5" /> },
    ];
  };

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const navItems = user ? getNavItems(user.role) : [];

  return (
    <div className={cn(
      "flex flex-col h-full transition-all duration-300",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <div className="admin-sidebar-logo flex items-center justify-center h-28 flex-shrink-0 px-4">
        <img
          src="/images/logo.png"
          alt="ScaleUp Dashboard Logo"
          className={cn(
            "h-24 max-w-[90%] object-contain transition-all duration-300",
            isCollapsed ? "w-12" : "w-auto"
          )}
        />
      </div>

      {!isCollapsed && user?.role === 'admin' && (
        <div className="px-3 py-3">
          <Link href="/admin/programs/create">
            <Button className="w-full justify-start gap-2 bg-white text-[#003366] hover:bg-gray-100">
              <span className="text-lg font-bold">+</span> Créer un programme
            </Button>
          </Link>
        </div>
      )}

      {selectedProgram && !isCollapsed && (
        <div className="admin-program-selected">
          <p className="truncate">
            Programme: {selectedProgram.name}
          </p>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-y-auto thin-scrollbar">
        <div className="px-3 py-2">
          <h3 className={cn(
            "admin-nav-section-title",
            isCollapsed && "text-center"
          )}>
            {isCollapsed ? "" : "Principal"}
          </h3>
          <nav className="admin-nav-menu mt-1 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "admin-nav-item flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ease-in-out group",
                  isActive(item.path)
                    ? "active"
                    : ""
                )}
              >
                <div className="flex items-center">
                  {item.icon}
                  {!isCollapsed && <span className="ml-3">{item.name}</span>}
                </div>
                {!isCollapsed && item.badge && (
                  <Badge className={cn("ml-auto", item.badgeColor || "bg-gray-500")}>
                    {item.badge}
                  </Badge>
                )}
              </Link>
            ))}
          </nav>
        </div>

        <div className="px-3 py-2 mt-auto">
          <h3 className={cn(
            "admin-nav-section-title",
            isCollapsed && "text-center"
          )}>
            {isCollapsed ? "" : "Autres"}
          </h3>
          <nav className="admin-nav-menu mt-1 space-y-1">
            {user && getSecondaryNavItems(user.role).map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "admin-nav-item flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ease-in-out",
                  isActive(item.path)
                    ? "active"
                    : ""
                )}
              >
                {item.icon}
                {!isCollapsed && <span className="ml-3">{item.name}</span>}
              </Link>
            ))}
            <button
              onClick={() => logout()}
              className="admin-nav-item w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ease-in-out"
            >
              <LogOut className="h-5 w-5" />
              {!isCollapsed && <span className="ml-3">Déconnexion</span>}
            </button>
          </nav>
        </div>
      </div>

      {/* Removed collapsible button */}
    </div>
  );
};

export default RoleSidebar;
