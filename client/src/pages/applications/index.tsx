import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import EligibilityCriteriaWidget from "@/components/widgets/EligibilityCriteriaWidget";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
// import { Program } from "@shared/schema";
// Import directement depuis le chemin relatif pour éviter les problèmes de résolution de module
import { getAllFormsDirect, getFormsByProgramDirect, createTestFormDirect, checkAndRepairStorage } from "../../utils/directStorage";
import {
  Plus,
  FormInput,
  ClipboardList,
  Eye,
  PencilLine,
  Copy,
  Link,
  CalendarRange,
  Users,
  Inbox,
  Trash2,
  Edit,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  UserPlus,
  UsersRound
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProgramContext } from "@/context/ProgramContext";
import ApplicationSubmissionCard, { ApplicationSubmission } from "@/components/application/ApplicationSubmissionCard";
import ApplicationFormViewer from "@/components/application/ApplicationFormViewer";
import TeamCreationDialog from "@/components/application/TeamCreationDialog";
import TeamInvitationNotification from "@/components/application/TeamInvitationNotification";
import { v4 as uuidv4 } from 'uuid';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

// Type definitions for API responses
// Modifier l'interface pour qu'elle soit compatible avec ApplicationForm
interface ApplicationFormResponse {
  id: number;
  name: string;
  description: string;
  programId: number | string; // Accepter string ou number pour être compatible avec ApplicationForm
  questions?: unknown;
  settings?: {
    title: string;
    description: string;
    submitButtonText: string;
    showProgressBar: boolean;
    allowSaveDraft: boolean;
    confirmationMessage: string;
  };
  formSchema?: string; // Ajout pour être compatible avec ApplicationForm
  isActive: boolean; // Ajout pour être compatible avec ApplicationForm
  createdAt: string;
  updatedAt: string;
  title?: string;
  submitButtonText?: string;
  showProgressBar?: boolean;
  allowSaveDraft?: boolean;
  confirmationMessage?: string;
}

interface ApplicationSubmissionResponse {
  id: number;
  programId: number;
  formId: number;
  teamName: string;
  teamEmail: string;
  teamSize: number;
  industry: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  formData: Record<string, any>;
}

const ApplicationsPage = () => {
  type CustomApplicationFormEvent = CustomEvent<{ programId: string | number; form: ApplicationFormResponse }>;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedProgram, selectedProgramId } = useProgramContext();
  // Ne pas convertir selectedProgramId en nombre pour conserver l'UUID
  const programId = selectedProgramId;
  const [activeTab, setActiveTab] = React.useState("forms");
  const [deleteFormPending, setDeleteFormPending] = useState(false);
  const [localForms, setLocalForms] = useState<ApplicationFormResponse[]>([]);
  const [previewForm, setPreviewForm] = useState<ApplicationFormResponse | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<ApplicationSubmission | null>(null);
  const [showTeamCreationDialog, setShowTeamCreationDialog] = useState(false);
  const [showInvitationDialog, setShowInvitationDialog] = useState(false);
  const [invitationDetails, setInvitationDetails] = useState<{
    teamName: string;
    teamDescription: string;
    programName: string;
  }>({ teamName: '', teamDescription: '', programName: '' });

  // Function to add a team to the program
  const handleAddTeamToProgram = (submission: ApplicationSubmission) => {
    // Create a new startup object
    const newStartup = {
      id: Date.now(),
      name: submission.teamName,
      logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(submission.teamName)}&background=random`,
      industry: submission.industry,
      currentPhase: "Application",
      progress: 0,
      status: 'active' as const,
      programId: String(selectedProgramId)
    };

    // Save the new startup to localStorage
    try {
      // Get existing startups from localStorage
      const existingStartups = JSON.parse(localStorage.getItem('startups') || '[]');

      // Add the new startup
      existingStartups.push(newStartup);

      // Save back to localStorage
      localStorage.setItem('startups', JSON.stringify(existingStartups));

      // Update the submission status
      const updatedSubmissions = mockSubmissions.map(s =>
        s.id === submission.id ? { ...s, status: 'approved' as const } : s
      );
      setMockSubmissions(updatedSubmissions);

      // Show success message
      toast({
        title: "Team added to program",
        description: `${submission.teamName} has been successfully added to ${selectedProgram?.name}.`,
      });
    } catch (error) {
      console.error("Error saving startup to localStorage:", error);
      toast({
        title: "Error adding team",
        description: "Failed to add team to program. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Create a direct function to manually fetch forms - with improved error handling
  const fetchApplicationForms = async () => {
    // Get forms from localStorage first (most reliable source)
    let localStorageForms: ApplicationFormResponse[] = [];
    try {
      const storedForms = localStorage.getItem('applicationForms');
      if (storedForms) {
        localStorageForms = JSON.parse(storedForms);
        console.log('Forms from localStorage:', localStorageForms);
      }
    } catch (localStorageError) {
      console.warn('Error reading from localStorage, continuing with other sources');
    }

    // Get forms from global store
    let globalStoreForms: ApplicationFormResponse[] = [];
    if (window.globalApplicationForms && Array.isArray(window.globalApplicationForms)) {
      globalStoreForms = window.globalApplicationForms;
    }

    // Get forms from React Query cache
    let cachedForms: ApplicationFormResponse[] = [];
    const queryCache = queryClient.getQueryData(['/api/application-forms']);
    if (queryCache && Array.isArray(queryCache)) {
      cachedForms = queryCache as ApplicationFormResponse[];
    }

    // Try the API request, but don't let it block if it fails
    let apiForms: ApplicationFormResponse[] = [];
    try {
      // Use a timeout to prevent long-hanging requests
      const timeoutPromise = new Promise<Response>((_, reject) =>
        setTimeout(() => reject(new Error('API request timeout')), 3000)
      );
      const response = await Promise.race([apiRequest('/api/application-forms', 'GET'), timeoutPromise]);
      const data = await response.json();
      if (Array.isArray(data)) {
        apiForms = data;
        console.log('Successfully fetched forms from API:', apiForms.length);
      }
    } catch (apiError) {
      // Just log a warning and continue with other data sources
      console.warn('Could not fetch forms from API, using cached data instead');
    }

    // Combine all forms from different sources with deduplication
    const allFormsMap = new Map<number, ApplicationFormResponse>();

    // Priority order: localStorage, global store, cache, API (add in reverse order)
    apiForms.forEach(form => {
      if (form && form.id) allFormsMap.set(form.id, form);
    });

    cachedForms.forEach(form => {
      if (form && form.id) allFormsMap.set(form.id, form);
    });

    globalStoreForms.forEach(form => {
      if (form && form.id) allFormsMap.set(form.id, form);
    });

    localStorageForms.forEach(form => {
      if (form && form.id) allFormsMap.set(form.id, form);
    });

    const allForms = Array.from(allFormsMap.values());
    console.log('Combined forms from all sources:', allForms.length);

    // No state updates here - will be handled by the effect
    return allForms;
  };

  // Fetch forms on initial load and set up automatic refresh
  React.useEffect(() => {
    // Initial fetch
    fetchApplicationForms();

    // Set up interval for refreshing
    const interval = setInterval(() => {
      fetchApplicationForms();
    }, 3000); // Refresh every 3 seconds

    return () => clearInterval(interval);
  }, []);

  // Create a fallback query that won't be used directly but keeps the React Query infrastructure
  const { data: applicationForms = [], isLoading: isFormsLoading } = useQuery<ApplicationFormResponse[], Error, ApplicationFormResponse[]>({
    queryKey: ['/api/application-forms'],
    queryFn: async () => {
      console.log('Regular query fetching application forms');
      return localForms; // Just return local forms since we're handling fetching separately
    },
    enabled: true
  });

  // Écouter les événements de mise à jour des formulaires
  React.useEffect(() => {
    // Fonction pour gérer les mises à jour de formulaires
    const handleFormUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ form: any, action: string }>;
      const { form, action } = customEvent.detail;

      console.log(`💙 Formulaire ${action === 'create' ? 'créé' : 'mis à jour'}:`, form);

      // Mettre à jour l'état local avec les formulaires filtrés pour le programme sélectionné
      if (programId) {
        const updatedForms = getFormsByProgramDirect(programId);
        setLocalForms(updatedForms as ApplicationFormResponse[]);
      } else {
        // Si aucun programme n'est sélectionné, récupérer tous les formulaires
        const allForms = getAllFormsDirect();
        setLocalForms(allForms as ApplicationFormResponse[]);
      }

      // Afficher une notification
      toast({
        title: action === 'create' ? "Formulaire créé" : "Formulaire mis à jour",
        description: `Le formulaire "${form.name}" a été ${action === 'create' ? 'créé' : 'mis à jour'} avec succès.`,
      });
    };

    // Écouter l'événement de mise à jour des formulaires
    document.addEventListener('application-form-updated', handleFormUpdated as EventListener);

    // Écouter également l'événement formSaved
    document.addEventListener('formSaved', handleFormUpdated as EventListener);

    // Écouter les événements de stockage
    window.addEventListener('storage', () => {
      console.log('💙 Événement de stockage détecté, rechargement des formulaires');
      if (programId) {
        const updatedForms = getFormsByProgramDirect(programId);
        setLocalForms(updatedForms as ApplicationFormResponse[]);
      } else {
        const allForms = getAllFormsDirect();
        setLocalForms(allForms as ApplicationFormResponse[]);
      }
    });

    // Charger les formulaires initiaux
    if (programId) {
      const programForms = getFormsByProgramDirect(programId);
      console.log('💙 Formulaires initiaux pour le programme', programId, ':', programForms.length);
      if (programForms.length > 0) {
        setLocalForms(programForms as ApplicationFormResponse[]);
      }
    } else {
      const allForms = getAllFormsDirect();
      console.log('💙 Tous les formulaires initiaux:', allForms.length);
      if (allForms.length > 0) {
        setLocalForms(allForms as ApplicationFormResponse[]);
      }
    }

    return () => {
      document.removeEventListener('application-form-updated', handleFormUpdated as EventListener);
      document.removeEventListener('formSaved', handleFormUpdated as EventListener);
      window.removeEventListener('storage', () => {});
    };
  }, [programId, toast]);

  // Load forms from localStorage when component mounts
  React.useEffect(() => {
    try {
      // Read forms from localStorage
      const storedForms = localStorage.getItem('applicationForms');
      if (storedForms) {
        const parsedForms = JSON.parse(storedForms);
        console.log("LOADED APPLICATION FORMS FROM LOCAL STORAGE:", parsedForms);

        if (Array.isArray(parsedForms) && parsedForms.length > 0) {
          // Update local state with localStorage forms
          setLocalForms(prevForms => {
            // Combine forms, prioritizing new ones
            const combinedForms = [...prevForms];
            let hasNewForms = false;

            parsedForms.forEach((form: ApplicationFormResponse) => {
              if (!combinedForms.some(f => f.id === form.id)) {
                combinedForms.push(form);
                hasNewForms = true;
              }
            });

            return hasNewForms ? combinedForms : prevForms;
          });

          // Also update React Query cache
          queryClient.setQueryData(['/api/application-forms'], (oldData: any[] = []) => {
            const existingData = Array.isArray(oldData) ? oldData : [];
            const combinedData = [...existingData];

            parsedForms.forEach((form: ApplicationFormResponse) => {
              if (!combinedData.some(f => f.id === form.id)) {
                combinedData.push(form);
              }
            });

            return combinedData;
          });
        }
      }
    } catch (error) {
      console.error("Error loading forms from localStorage:", error);
    }
  }, [queryClient]);

  // Ensure the global array exists
  if (!window.globalApplicationForms) {
    window.globalApplicationForms = [];
  }

  // DIRECT ACCESS: Function to get all forms from all possible sources
  const getAllForms = () => {
    // Try all possible sources and combine them
    const allFormsMap = new Map<number, ApplicationFormResponse>();

    // 1. Check global in-memory store (highest priority)
    if (window.globalApplicationForms && Array.isArray(window.globalApplicationForms) && window.globalApplicationForms.length > 0) {
      console.log("Found forms in global store:", window.globalApplicationForms);
      window.globalApplicationForms.forEach((form: any) => {
        if (form && form.id) {
          allFormsMap.set(form.id, form);
        }
      });
    }

    // 2. Check localStorage
    try {
      const storedForms = localStorage.getItem('applicationForms');
      if (storedForms) {
        const localStorageForms = JSON.parse(storedForms);
        if (Array.isArray(localStorageForms)) {
          console.log("Found forms in localStorage:", localStorageForms);
          localStorageForms.forEach((form: ApplicationFormResponse) => {
            allFormsMap.set(form.id, form);
          });
        }
      }
    } catch (error) {
      console.error("Error parsing localStorage forms:", error);
    }

    // 3. Check React Query cache
    const cachedForms = queryClient.getQueryData(['/api/application-forms']) || [];
    if (Array.isArray(cachedForms)) {
      console.log("Found forms in React Query cache:", cachedForms);
      cachedForms.forEach((form: any) => {
        allFormsMap.set(form.id, form);
      });
    }

    // 4. Include local state forms
    if (localForms.length > 0) {
      console.log("Found forms in local state:", localForms);
      localForms.forEach(form => {
        allFormsMap.set(form.id, form);
      });
    }

    // 5. Include forms from API response
    if (applicationForms.length > 0) {
      console.log("Found forms from API response:", applicationForms);
      applicationForms.forEach(form => {
        allFormsMap.set(form.id, form);
      });
    }

    // Convert map to array and return
    return Array.from(allFormsMap.values());
  };

  // Get all forms from all possible sources - without state updates
  const getAllFormsWithoutStateUpdates = () => {
    // This version doesn't update state, to avoid infinite loops
    const allFormsMap = new Map<number, ApplicationFormResponse>();

    // 1. Check global in-memory store
    if (window.globalApplicationForms && Array.isArray(window.globalApplicationForms) && window.globalApplicationForms.length > 0) {
      window.globalApplicationForms.forEach((form: any) => {
        if (form && form.id) {
          allFormsMap.set(form.id, form);
        }
      });
    }

    // 2. Check localStorage
    try {
      const storedForms = localStorage.getItem('applicationForms');
      if (storedForms) {
        const localStorageForms = JSON.parse(storedForms);
        if (Array.isArray(localStorageForms)) {
          localStorageForms.forEach((form: ApplicationFormResponse) => {
            allFormsMap.set(form.id, form);
          });
        }
      }
    } catch (error) {
      console.error("Error parsing localStorage forms:", error);
    }

    // 3. Check React Query cache
    const cachedForms = queryClient.getQueryData(['/api/application-forms']) || [];
    if (Array.isArray(cachedForms)) {
      cachedForms.forEach((form: any) => {
        allFormsMap.set(form.id, form);
      });
    }

    // 4. Include local state forms
    if (localForms.length > 0) {
      localForms.forEach(form => {
        allFormsMap.set(form.id, form);
      });
    }

    // 5. Include forms from API response
    if (applicationForms.length > 0) {
      applicationForms.forEach(form => {
        allFormsMap.set(form.id, form);
      });
    }

    return Array.from(allFormsMap.values());
  };

  // Use an effect to synchronize the forms across different storage mechanisms
  React.useEffect(() => {
    const allForms = getAllFormsWithoutStateUpdates();
    console.log("Synchronizing forms across storage mechanisms:", allForms);

    // Only update local state if there are new forms
    if (localForms.length !== allForms.length ||
        JSON.stringify(localForms.map(f => f.id).sort()) !== JSON.stringify(allForms.map(f => f.id).sort())) {
      setLocalForms(allForms);
    }

    // Update React Query cache
    queryClient.setQueryData(['/api/application-forms'], allForms);

    // Update localStorage
    try {
      localStorage.setItem('applicationForms', JSON.stringify(allForms));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }

    // Update global store
    window.globalApplicationForms = [...allForms];

  }, [applicationForms, queryClient]);

  // Debug function to check what's in localStorage
  const debugLocalStorage = () => {
    try {
      const storedForms = localStorage.getItem('applicationForms');
      if (storedForms) {
        const forms = JSON.parse(storedForms);
        console.log("%c LOCALSTORAGE FORMS (" + forms.length + " forms)", "background: blue; color: white; padding: 3px;");
        console.table(forms.map((f: any) => ({ id: f.id, programId: f.programId, name: f.name })));
      } else {
        console.log("%c NO FORMS IN LOCALSTORAGE", "background: red; color: white; padding: 3px;");
      }
    } catch (error) {
      console.error("Error reading localStorage:", error);
    }

    // Check global store
    if (window.globalApplicationForms && Array.isArray(window.globalApplicationForms)) {
      console.log("%c GLOBAL STORE FORMS (" + window.globalApplicationForms.length + " forms)", "background: green; color: white; padding: 3px;");
      console.table(window.globalApplicationForms.map(f => ({ id: f.id, programId: f.programId, name: f.name })));
    } else {
      console.log("%c NO FORMS IN GLOBAL STORE", "background: red; color: white; padding: 3px;");
    }
  };

  // Call debug function on initial render
  // Set up event listener for application form creation and perform initialization
  React.useEffect(() => {
    console.log("%c DEBUGGING FORMS ISSUE - Initial load", "background: red; color: white; padding: 5px; font-size: 16px;");

    // Vérifier et réparer le stockage local si nécessaire
    checkAndRepairStorage();

    // Afficher l'état actuel du stockage
    debugLocalStorage();

    // Forcer la mise à jour de l'état local avec les formulaires réparés
    const repaired = getAllFormsDirect();
    if (repaired.length > 0) {
      console.log("%c Formulaires récupérés après réparation:", "background: green; color: white; padding: 3px;", repaired.length);
      setLocalForms(repaired as ApplicationFormResponse[]);

      // Mettre à jour le store global
      window.globalApplicationForms = [...repaired];
    }

    // Log message for testing navigation from program creation
    console.log("%c APPLICATION PAGE LOADED - Check for forms", "background: purple; color: white; padding: 5px; font-size: 14px;");

    // Add form creation listener
    const handleFormCreated = (event: any) => {
      console.log("%c FORM CREATION EVENT RECEIVED!", "background: green; color: white; padding: 5px; font-size: 14px;");
      console.log("Event details:", event.detail);
      debugLocalStorage();

      // Force refresh of forms by updating local state
      const allForms = getAllFormsWithoutStateUpdates();
      setLocalForms(allForms);
    };

    // Add form update listener
    const handleFormUpdated = (event: any) => {
      console.log("%c FORM UPDATE EVENT RECEIVED!", "background: purple; color: white; padding: 5px; font-size: 14px;");
      console.log("Event details:", event.detail);
      debugLocalStorage();

      // Force refresh of forms by updating local state
      const allForms = getAllFormsDirect();
      console.log("%c Formulaires rechargés après événement:", "background: green; color: white; padding: 3px;", allForms.length);

      // Mettre à jour l'état local
      setLocalForms(allForms as ApplicationFormResponse[]);

      // Invalider le cache React Query
      queryClient.invalidateQueries({queryKey: ['/api/application-forms']});
      if (event.detail && event.detail.programId) {
        queryClient.invalidateQueries({queryKey: ['/api/application-forms', event.detail.programId]});
      }

      // Directly add the form to local state if it's not there
      if (event.detail && event.detail.form) {
        const newForm = event.detail.form;
        setLocalForms(prev => {
          // Check if form already exists
          const exists = prev.some(f => f.id === newForm.id);
          if (!exists) {
            console.log("%c Adding new form to local state", "background: orange; color: black; padding: 3px;");
            return [...prev, newForm];
          }
          return prev;
        });
      }
    };

    document.addEventListener('application-form-created', handleFormCreated);
    document.addEventListener('application-form-updated', handleFormUpdated);

    // CRITICAL: Initial forced retrieval from localStorage to ensure we don't miss any forms
    try {
      const storedForms = localStorage.getItem('applicationForms');
      if (storedForms) {
        const parsedForms = JSON.parse(storedForms);
        if (Array.isArray(parsedForms) && parsedForms.length > 0) {
          console.log("%c Found forms in localStorage on initial load: ", "background: purple; color: white; padding: 3px;", parsedForms.length);
          // Update localForms state with these forms
          setLocalForms(prev => {
            // Combine with previous forms and deduplicate
            const combined = [...prev];
            let hasNew = false;

            parsedForms.forEach((form: any) => {
              if (!combined.some(f => f.id === form.id)) {
                combined.push(form);
                hasNew = true;
              }
            });

            if (hasNew) {
              console.log("%c Added forms from localStorage to state", "background: green; color: white; padding: 3px;");
              return combined;
            }
            return prev;
          });
        }
      }
    } catch (error) {
      console.error("Error reading from localStorage on component mount:", error);
    }

    // CRITICAL: Also check global store
    if (window.globalApplicationForms && Array.isArray(window.globalApplicationForms) && window.globalApplicationForms.length > 0) {
      console.log("%c Found forms in global store on initial load: ", "background: purple; color: white; padding: 3px;", window.globalApplicationForms.length);
      // Update localForms state with these forms
      setLocalForms(prev => {
        // Combine with previous forms and deduplicate
        const combined = [...prev];
        let hasNew = false;

        window.globalApplicationForms.forEach((form: any) => {
          if (form && form.id && !combined.some(f => f.id === form.id)) {
            combined.push(form);
            hasNew = true;
          }
        });

        if (hasNew) {
          console.log("%c Added forms from global store to state", "background: green; color: white; padding: 3px;");
          return combined;
        }
        return prev;
      });
    }

    // Clean up event listeners
    return () => {
      document.removeEventListener('application-form-created', handleFormCreated);
      document.removeEventListener('application-form-updated', handleFormUpdated);
    };
  }, []);

  // Monitor forms in localStorage and update when they change
  React.useEffect(() => {
    const checkLocalStorage = () => {
      try {
        const storedForms = localStorage.getItem('applicationForms');
        if (storedForms) {
          const parsedForms = JSON.parse(storedForms);
          if (Array.isArray(parsedForms) && parsedForms.length > 0) {
            // Only update if there are new forms
            if (localForms.length !== parsedForms.length) {
              setLocalForms(parsedForms);
            }
          }
        }
      } catch (error) {
        console.error("Error checking localStorage:", error);
      }
    };

    // Check localStorage every 2 seconds as a backup
    const interval = setInterval(checkLocalStorage, 2000);
    return () => clearInterval(interval);
  }, [localForms.length]);

  // Program application forms filtering logic
  const programApplicationForms = React.useMemo(() => {
    // Utiliser notre solution directe pour récupérer les formulaires
    const allForms = getAllFormsDirect();

    // Si aucun formulaire n'est trouvé, créer un formulaire de test
    if (allForms.length === 0 && programId) {
      const testForm = createTestFormDirect(programId);
      return [testForm];
    }

    // If no program is selected, show all forms
    if (!programId) {
      return allForms;
    }

    // Utiliser notre fonction directe pour filtrer par programme
    const filteredForms = getFormsByProgramDirect(programId);

    // Mettre à jour l'état local avec les formulaires filtrés
    if (filteredForms.length > 0) {
      setLocalForms(filteredForms as ApplicationFormResponse[]);
      return filteredForms;
    }

    // Si aucun formulaire n'est trouvé, créer un formulaire de test
    const testForm = createTestFormDirect(programId);
    return [testForm];
  }, [programId, localForms.length]);

  // Mock application submissions data
  const [mockSubmissions, setMockSubmissions] = useState<ApplicationSubmission[]>([
    {
      id: 1,
      programId: selectedProgramId,
      formId: 1,
      teamName: "TechInnovators",
      teamEmail: "contact@techinnovators.com",
      teamSize: 4,
      industry: "Technology",
      status: 'pending',
      submittedAt: new Date().toISOString(),
      formData: {
        "Project Description": "We are building an AI-powered platform that helps small businesses automate their customer service.",
        "Current Stage": "MVP",
        "Funding Raised": "$50,000",
        "Team Experience": "Our team has over 10 years of combined experience in AI and customer service technologies."
      }
    },
    {
      id: 2,
      programId: selectedProgramId,
      formId: 1,
      teamName: "GreenSolutions",
      teamEmail: "info@greensolutions.co",
      teamSize: 3,
      industry: "Sustainability",
      status: 'pending',
      submittedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      formData: {
        "Project Description": "Developing sustainable packaging solutions for e-commerce businesses.",
        "Current Stage": "Seed",
        "Funding Raised": "$120,000",
        "Team Experience": "Our founders previously worked at major packaging companies and have patents in biodegradable materials."
      }
    },
    {
      id: 3,
      programId: selectedProgramId,
      formId: 1,
      teamName: "HealthTech Innovations",
      teamEmail: "team@healthtechinnovations.com",
      teamSize: 5,
      industry: "Healthcare",
      status: 'approved',
      submittedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      formData: {
        "Project Description": "Creating a wearable device that monitors vital signs and predicts potential health issues.",
        "Current Stage": "Growth",
        "Funding Raised": "$500,000",
        "Team Experience": "Our team includes medical doctors and engineers with experience in medical device development."
      }
    }
  ]);

  // Use mock data instead of API call
  const isSubmissionsLoading = false;
  const applicationSubmissions = mockSubmissions;

  // Filter submissions for the selected program
  const programApplicationSubmissions = React.useMemo(() => {
    if (!programId) return applicationSubmissions;
    return applicationSubmissions.filter(submission => {
      // Convertir les deux valeurs en chaînes pour la comparaison
      return String(submission.programId) === String(programId);
    });
  }, [applicationSubmissions, programId]);

  const deleteFormMutation = useMutation({
    mutationFn: (formId: number) =>
      apiRequest(`/api/application-forms/${formId}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/application-forms'] });
      toast({
        title: "Form deleted",
        description: "Application form has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error deleting form",
        description: "Failed to delete application form. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleDeleteForm = (formId: number) => {
    if (window.confirm('Are you sure you want to delete this form?')) {
      setDeleteFormPending(true);

      // Mock deletion
      setTimeout(() => {
        setDeleteFormPending(false);
        toast({
          title: "Form deleted",
          description: "Application form has been successfully deleted.",
        });
      }, 1000);
    }
  };

  // The useEffect cleanup is already handled in the main useEffect above

  // FormPreview component with proper typing
  const FormPreview: React.FC<{ form: ApplicationFormResponse }> = ({ form }) => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">{form.settings?.title || form.name}</h2>
          <p className="text-gray-500 mt-2">{form.settings?.description || form.description}</p>
        </div>

        {/* Questions preview */}
        {Array.isArray(form.questions) && form.questions.length > 0 && (
          <div className="space-y-8">
            {form.questions.map((question: any, index: number) => (
              <div key={index} className="border p-4 rounded-lg">
                {/* Question preview content */}
                <p className="font-medium">{question.text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Form settings */}
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Submit button text:</span>
            <span>{form.settings?.submitButtonText || "Soumettre"}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Show progress bar:</span>
            <span>{form.settings?.showProgressBar ? "Oui" : "Non"}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Allow save draft:</span>
            <span>{form.settings?.allowSaveDraft ? "Oui" : "Non"}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Confirmation message:</span>
            <span>{form.settings?.confirmationMessage || "Merci pour votre candidature!"}</span>
          </div>
        </div>
      </div>
    );
  };

  if (!selectedProgram) {
    return (
      <div className="container mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">No Program Selected</h1>
        <p className="text-gray-500 mb-6">Please select a program to view its applications.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Candidatures</h1>
          <p className="text-muted-foreground">
            Gérer les candidatures pour <span className="font-medium">{selectedProgram?.name || 'Programme sélectionné'}</span>
          </p>
        </div>


      </div>

      {/* Eligibility Criteria Widget */}
      <div className="mb-6">
        <Card>
          <CardContent className="p-0">
            <EligibilityCriteriaWidget />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="forms" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="forms">
            <ClipboardList className="h-4 w-4 mr-2" />
            Formulaires
          </TabsTrigger>
          <TabsTrigger value="submissions">
            <Inbox className="h-4 w-4 mr-2" />
            Soumissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="forms" className="space-y-4">
          {isFormsLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : programApplicationForms.length === 0 ? (
            <div className="text-center p-10">
              <FormInput className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium">Aucun formulaire de candidature</h3>
              <p className="text-gray-500 mt-2">
                {selectedProgram
                  ? `Il n'y a pas encore de formulaires de candidature pour ${selectedProgram.name}.`
                  : 'Il n\'y a pas encore de formulaires de candidature.'}
              </p>

            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {programApplicationForms.map((form: ApplicationFormResponse) => (
                <Card key={form.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{form.name}</CardTitle>
                      <Badge variant="secondary">
                        Active
                      </Badge>
                    </div>
                    <CardDescription>
                      {form.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="h-4 w-4 mr-1" />
                      <span>0 Submissions</span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-wrap gap-2 pt-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setPreviewForm(form)}
                        style={{ backgroundColor: 'transparent', color: '#0c4c80', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.875rem' }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </button>
                      <button
                        style={{ backgroundColor: 'transparent', color: '#0c4c80', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.875rem' }}
                        onClick={() => {
                          // Créer l'URL du formulaire
                          const formUrl = `${window.location.origin}/apply/${form.id}`;
                          // Copier l'URL dans le presse-papiers
                          navigator.clipboard.writeText(formUrl)
                            .then(() => {
                              toast({
                                title: "Lien copié",
                                description: "Le lien du formulaire a été copié dans le presse-papiers.",
                              });
                            })
                            .catch((error) => {
                              console.error('Erreur lors de la copie du lien:', error);
                              toast({
                                title: "Erreur",
                                description: "Impossible de copier le lien. Veuillez réessayer.",
                                variant: "destructive",
                              });
                            });
                        }}
                      >
                        <Link className="h-4 w-4 mr-1" />
                        Share
                      </button>
                      <button
                        style={{ backgroundColor: 'transparent', color: '#0c4c80', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.875rem' }}
                        onClick={() => setLocation(`/applications/edit/${form.id}`)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                      <button
                        style={{ backgroundColor: 'transparent', color: '#e43e32', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.875rem' }}
                        onClick={() => handleDeleteForm(form.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4">
          {isSubmissionsLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : programApplicationSubmissions.length === 0 ? (
            <div className="text-center p-10">
              <ClipboardList className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium">Aucune soumission</h3>
              <p className="text-gray-500 mt-2">
                {selectedProgram
                  ? `Il n'y a pas encore de soumissions de candidature pour ${selectedProgram.name}.`
                  : 'Il n\'y a pas encore de soumissions de candidature.'}
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Soumissions de candidature</h3>
                <button
                  onClick={() => setShowTeamCreationDialog(true)}
                  style={{ background: 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)', color: 'white', display: 'flex', alignItems: 'center', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', border: 'none' }}
                >
                  <UsersRound className="h-4 w-4 mr-2" />
                  Créer une équipe
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {programApplicationSubmissions.map((submission) => (
                  <ApplicationSubmissionCard
                    key={submission.id}
                    submission={submission}
                    onViewForm={(submission) => setViewingSubmission(submission)}
                    onAddTeam={(submission) => handleAddTeamToProgram(submission)}
                  />
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {deleteFormPending && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Deleting form...</p>
          </div>
        </div>
      )}

      {previewForm && (
        <Dialog open={!!previewForm} onOpenChange={() => setPreviewForm(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Application Form Preview</DialogTitle>
              <DialogDescription>
                This is how the form will appear to applicants
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {previewForm && <FormPreview form={previewForm} />}
            </div>

            <DialogFooter className="flex justify-between">
              <button
                onClick={() => {
                  const formId = previewForm?.id;
                  setPreviewForm(null);
                  if (formId) {
                    setLocation(`/applications/edit/${formId}`);
                  }
                }}
                style={{ backgroundColor: 'white', color: '#0c4c80', border: '1px solid #e5e7eb', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Form
              </button>
              <DialogClose asChild>
                <button
                  type="button"
                  style={{ background: 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)', color: 'white', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', border: 'none' }}
                >
                  Close Preview
                </button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Application Form Viewer Dialog */}
      {viewingSubmission && (
        <ApplicationFormViewer
          submission={viewingSubmission}
          open={!!viewingSubmission}
          onOpenChange={(open) => !open && setViewingSubmission(null)}
          onAddTeam={handleAddTeamToProgram}
        />
      )}

      {/* Team Creation Dialog */}
      <TeamCreationDialog
        open={showTeamCreationDialog}
        onOpenChange={setShowTeamCreationDialog}
        submissions={programApplicationSubmissions}
        onCreateTeam={(teamData) => {
          // Create a new startup object
          const newStartup = {
            id: Date.now(),
            name: teamData.name,
            logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(teamData.name)}&background=random`,
            industry: teamData.members[0]?.industry || 'Technology',
            currentPhase: "Application",
            progress: 0,
            status: 'active' as const,
            programId: String(selectedProgramId),
            description: teamData.description,
            members: teamData.members.map(m => ({
              id: m.id,
              name: m.teamName,
              email: m.teamEmail
            }))
          };

          // Save the new startup to localStorage
          try {
            // Get existing startups from localStorage
            const existingStartups = JSON.parse(localStorage.getItem('startups') || '[]');

            // Add the new startup
            existingStartups.push(newStartup);

            // Save back to localStorage
            localStorage.setItem('startups', JSON.stringify(existingStartups));

            // Update the submission status for all team members
            const updatedSubmissions = mockSubmissions.map(s =>
              teamData.members.some(m => m.id === s.id) ? { ...s, status: 'approved' as const } : s
            );
            setMockSubmissions(updatedSubmissions);

            // Show invitation dialog (simulating sending invitations)
            setInvitationDetails({
              teamName: teamData.name,
              teamDescription: teamData.description,
              programName: selectedProgram?.name || 'Program'
            });
            setShowInvitationDialog(true);

            // Show success message
            toast({
              title: "Team created successfully",
              description: `${teamData.name} has been created with ${teamData.members.length} members.`,
            });
          } catch (error) {
            console.error("Error saving team to localStorage:", error);
            toast({
              title: "Error creating team",
              description: "Failed to create team. Please try again.",
              variant: "destructive",
            });
          }
        }}
      />

      {/* Team Invitation Notification */}
      <TeamInvitationNotification
        open={showInvitationDialog}
        onOpenChange={setShowInvitationDialog}
        teamName={invitationDetails.teamName}
        teamDescription={invitationDetails.teamDescription}
        programName={invitationDetails.programName}
        onAccept={() => {
          toast({
            title: "Invitation accepted",
            description: "You have joined the team.",
          });
          setShowInvitationDialog(false);
        }}
        onDecline={() => {
          toast({
            title: "Invitation declined",
            description: "You have declined to join the team.",
          });
          setShowInvitationDialog(false);
        }}
      />

    </div>
  );
};

export default ApplicationsPage;