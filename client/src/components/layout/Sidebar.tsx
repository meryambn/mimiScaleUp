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
  TestTube
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useProgramContext } from "@/context/ProgramContext";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

const Sidebar: React.FC = () => {
  const [location] = useLocation();
  const { selectedProgram } = useProgramContext();
  const [applicationCount, setApplicationCount] = useState<number>(3);
  const queryClient = useQueryClient();

  // Define interface for application form
  interface ApplicationForm {
    id: number;
    name: string;
    programId: number;
    description?: string;
  }

  // Fetch application forms for the selected program
  const { data: applicationForms = [] } = useQuery<ApplicationForm[]>({
    queryKey: ['/api/application-forms', selectedProgram?.id],
    queryFn: async () => {
      const response = await apiRequest(`/api/application-forms${selectedProgram?.id ? `?programId=${selectedProgram.id}` : ''}`, 'GET');
      const data = await response.json();
      return data;
    },
    enabled: !!selectedProgram?.id, // Only fetch when a program is selected
    staleTime: 0, // Consider cache immediately stale to always refetch when needed
    refetchOnMount: true // Always refetch when component mounts
  });

  // Update application count when forms change
  useEffect(() => {
    if (applicationForms && Array.isArray(applicationForms)) {
      // Only count forms that belong to the selected program
      const programForms = selectedProgram?.id
        ? applicationForms.filter(form => {
            // Convert both to string for comparison to handle potential type mismatches
            return String(form.programId) === String(selectedProgram.id);
          })
        : applicationForms;

      console.log('Updating application count in Sidebar:', programForms.length);
      setApplicationCount(programForms.length);
    }

    // Listen for application forms created during program creation
    const handleApplicationFormCreated = (event: Event) => {
      type CustomApplicationFormEvent = CustomEvent<{ programId: string | number; form: { id: number, name: string, programId: number, description?: string } }>;
      const customEvent = event as CustomApplicationFormEvent;
      const { programId, form } = customEvent.detail;

      console.log('Application form created event received in Sidebar:', form);

      // Increment the count directly
      setApplicationCount(prevCount => prevCount + 1);

      // Also update the query cache if possible
      if (queryClient) {
        // Update the program-specific cache
        queryClient.setQueryData(['/api/application-forms', Number(programId)], (oldData: any[] = []) => {
          if (oldData?.some(f => String(f.programId) === String(programId) && f.name === form.name)) {
            return oldData;
          }
          return [...(oldData || []), {...form, id: form.id || Date.now(), programId: Number(programId)}];
        });

        // Update the global cache
        queryClient.setQueryData(['/api/application-forms'], (oldData: any[] = []) => {
          if (oldData?.some(f => String(f.programId) === String(programId) && f.name === form.name)) {
            return oldData;
          }
          return [...(oldData || []), {...form, id: form.id || Date.now(), programId: Number(programId)}];
        });

        // Force an immediate refetch to ensure UI updates
        queryClient.invalidateQueries({queryKey: ['/api/application-forms']});
        queryClient.invalidateQueries({queryKey: ['/api/application-forms', Number(programId)]});

        // Also trigger a manual refetch after a short delay as a backup
        setTimeout(() => {
          queryClient.refetchQueries({queryKey: ['/api/application-forms']});
          queryClient.refetchQueries({queryKey: ['/api/application-forms', Number(programId)]});
        }, 500);
      }
    };

    document.addEventListener('application-form-created', handleApplicationFormCreated);

    return () => {
      document.removeEventListener('application-form-created', handleApplicationFormCreated);
    };
  }, [applicationForms]);

  const navItems = [
    {
      name: "Programmes",
      path: "/programs",
      icon: <GraduationCap className="h-5 w-5" />
    },
    {
      name: "Tableau de bord",
      path: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
      name: "Équipes",
      path: "/teams",
      icon: <UserSquare2 className="h-5 w-5" />
    },
    {
      name: "Mentors",
      path: "/mentors",
      icon: <Users className="h-5 w-5" />
    },
    {
      name: "Candidatures",
      path: "/applications",
      icon: <FormInput className="h-5 w-5" />,
      badge: applicationCount.toString(),
      badgeColor: "bg-green-500"
    },
    {
      name: "Réunions",
      path: "/meetings",
      icon: <CalendarClock className="h-5 w-5" />
    },
    {
      name: "Tâches",
      path: "/tasks",
      icon: <ClipboardCheck className="h-5 w-5" />
    },
    {
      name: "Livrables",
      path: "/deliverables",
      icon: <FileCheck className="h-5 w-5" />
    }
  ];

  const secondaryNavItems = [
    { name: "Ressources", path: "/resources", icon: <BookOpen className="h-5 w-5" /> },
    { name: "Paramètres", path: "/settings", icon: <Settings className="h-5 w-5" /> },
    { name: "Aide", path: "/help", icon: <HelpCircle className="h-5 w-5" /> },
    { name: "Créer Équipe Test", path: "/test/create-team", icon: <TestTube className="h-5 w-5" /> },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="flex flex-col w-64 bg-[#003366] h-full">
      <div className="flex items-center justify-center h-28 flex-shrink-0 px-4 border-b border-[#1a4d80]">
        <img
          src="/images/logo.png"
          alt="ScaleUp Dashboard Logo"
          className="h-24 w-auto max-w-[90%] object-contain"
        />
      </div>

      <div className="px-3 py-3">
        <Link href="/programs/create">
          <Button className="w-full justify-start gap-2 bg-white text-[#003366] hover:bg-gray-100">
            <span className="text-lg font-bold">+</span> Créer un programme
          </Button>
        </Link>
      </div>

      {selectedProgram && (
        <div className="px-4 py-2 mb-2 bg-[#0a4d82]">
          <p className="text-white text-sm font-medium truncate">
            Programme: {selectedProgram.name}
          </p>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="px-3 py-2">
          <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider px-2 py-1">
            Principal
          </h3>
          <nav className="mt-1 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ease-in-out group",
                  isActive(item.path)
                    ? "bg-white text-[#003366]"
                    : "text-white hover:bg-[#1a4d80]"
                )}
              >
                <div className="flex items-center">
                  <span className={cn(
                    "mr-3",
                    isActive(item.path)
                      ? "text-[#003366]"
                      : "text-white group-hover:text-white"
                  )}>
                    {item.icon}
                  </span>
                  {item.name}
                </div>
                {item.badge && (
                  <Badge variant="outline" className={cn(
                    "text-xs py-0 px-2",
                    isActive(item.path)
                      ? "bg-[#003366] text-white border-[#003366]"
                      : item.badgeColor || "bg-white text-[#003366]"
                  )}>
                    {item.badge}
                  </Badge>
                )}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-6 px-3 py-2">
          <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider px-2 py-1">
            Plus
          </h3>
          <nav className="mt-1 space-y-1">
            {secondaryNavItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ease-in-out",
                  isActive(item.path)
                    ? "bg-white text-[#003366]"
                    : "text-white hover:bg-[#1a4d80]"
                )}
              >
                <span className={cn(
                  "mr-3",
                  isActive(item.path)
                    ? "text-[#003366]"
                    : "text-white group-hover:text-white"
                )}>
                  {item.icon}
                </span>
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
