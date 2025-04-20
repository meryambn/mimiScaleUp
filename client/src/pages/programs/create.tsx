import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { v4 as uuidv4 } from 'uuid';
import { EnhancedProgressSteps } from "@/components/ui/enhanced-progress-steps";
import { Button } from "@/components/ui/button";
import ProgramTemplateCard from "@/components/program/ProgramTemplateCard";
import ProgramTemplateSelector from "@/components/program/ProgramTemplateSelector";
import ProgramPhase from "@/components/program/ProgramPhase";
import PhaseDetailView, { PhaseDetails } from "@/components/program/PhaseDetailView";
import ProgramForm from "@/components/program/ProgramForm";
import WidgetContainer from "@/components/dashboard/WidgetContainer";
import MentorSelection from "@/components/mentor/MentorSelection";
import ApplicationFormTabs from "@/components/application/ApplicationFormTabs";
import { useProgramContext } from "@/context/ProgramContext";
import { saveFormDirect, checkAndRepairStorage } from "@/utils/directStorage";
import { saveProgramAsTemplate, getSavedProgramTemplates } from "@/utils/programTemplates";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, PlusCircle, BarChart, Calendar, Users, BarChart2, Flag, MessageSquare, Filter } from "lucide-react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useToast } from "@/hooks/use-toast";
import { AvailableWidget } from "@/components/dashboard/AvailableWidget";
import NumberOfStartupsWidget from "@/components/widgets/NumberOfStartupsWidget";
import ProgressTrackerWidget from "@/components/widgets/ProgressTrackerWidget";
import UpcomingMeetingsWidget from "@/components/widgets/UpcomingMeetingsWidget";
import EvaluationCriteriaWidget from "@/components/widgets/EvaluationCriteriaWidget";
import EligibilityCriteriaWidget from "@/components/widgets/EligibilityCriteriaWidget";
import OverallTasksWidget from "@/components/widgets/OverallTasksWidget";
import PhasesWidget from "@/components/widgets/PhasesWidget";
import ResourcesWidget from "@/components/widgets/ResourcesWidget";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import { WidgetData, WidgetType } from '@/components/dashboard/types';
import { ProgramTemplate, Program, Phase, EvaluationCriterion, FormTemplate, DashboardWidget } from "@/types/program";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";

interface ProgramState {
  id?: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  dashboardWidgets: WidgetData[];
  eligibilityCriteria: {
    minTeamSize: number;
    maxTeamSize: number;
    requiredStages: string[];
    requiredIndustries: string[];
    minRevenue: number;
    maxRevenue: number;
    requiredDocuments: string[];
  };
  mentors: any[];
  status: 'draft' | 'active';
}

// Add type definition for the window object
declare global {
  interface Window {
    globalApplicationForms: any[];
    globalEvaluationCriteria: any[];
  }
}

// Create global in-memory stores for application forms and evaluation criteria
// These will be accessible across the entire application
if (!window.globalApplicationForms) {
  window.globalApplicationForms = [];
}

if (!window.globalEvaluationCriteria) {
  window.globalEvaluationCriteria = [];
}

// Create utility functions to reliably dispatch creation events
// Function to dispatch when an application form is created
function dispatchApplicationFormCreated(programId: string, formData: any, queryClient: any) {

  console.log("*** DISPATCHING APPLICATION FORM CREATED EVENT ***");
  console.log("Program ID:", programId);
  console.log("Form Data:", formData);

  // Vérifier et réparer le stockage local avant de créer un formulaire
  checkAndRepairStorage();

  // Vérifier si le programId est un UUID (chaîne de caractères avec des tirets)
  const isUuid = typeof programId === 'string' && programId.includes('-');
  console.log(`%c Le programId est-il un UUID? ${isUuid}`, "background: orange; color: black; padding: 3px;");

  // Utiliser directement l'UUID comme programId sans le convertir en nombre
  console.log(`%c programId original dans dispatchApplicationFormCreated: ${programId} (${typeof programId})`, "background: green; color: white; padding: 3px;");

  // Utiliser saveFormDirect pour créer le formulaire de manière cohérente
  const savedForm = saveFormDirect({
    name: formData.name || '',
    description: formData.description || '',
    programId: programId, // Utiliser l'ID original sans conversion
    questions: formData.questions || [],
    settings: formData.settings || {}
  }, programId); // Utiliser l'ID original sans conversion

  console.log("Formulaire sauvegardé avec saveFormDirect:", savedForm);

  // Normalize the form data structure for React Query cache
  const normalizedFormData = savedForm;

  console.log("Normalized form data:", normalizedFormData);

  // CRITICAL FIX: Initialize global store if it doesn't exist
  if (!window.globalApplicationForms) {
    window.globalApplicationForms = [];
  }

  // Add the form to the global store with uniqueness check
  const formExists = window.globalApplicationForms.some((f: any) =>
    f && f.id && f.id === normalizedFormData.id
  );

  if (!formExists) {
    window.globalApplicationForms.push(normalizedFormData);
    console.log("Added form to global store. Total forms:", window.globalApplicationForms.length);
    console.log("Global forms:", JSON.stringify(window.globalApplicationForms));
  } else {
    console.log("Form already exists in global store");

    // Update the existing form
    const index = window.globalApplicationForms.findIndex((f: any) => f.id === normalizedFormData.id);
    if (index !== -1) {
      window.globalApplicationForms[index] = normalizedFormData;
      console.log("Updated existing form in global store");
    }
  }

  // Store in localStorage for persistence
  try {
    // Get existing forms
    let existingForms = [];
    const storedForms = localStorage.getItem('applicationForms');
    if (storedForms) {
      existingForms = JSON.parse(storedForms);
    }

    // Add the new form if it doesn't exist already
    const localFormExists = existingForms.some((f: any) => f.id === normalizedFormData.id);

    if (!localFormExists) {
      existingForms.push(normalizedFormData);
      console.log("Adding form to localStorage. Total forms:", existingForms.length);
    } else {
      // Update the existing form
      const index = existingForms.findIndex((f: any) => f.id === normalizedFormData.id);
      if (index !== -1) {
        existingForms[index] = normalizedFormData;
        console.log("Updated existing form in localStorage");
      }
    }

    localStorage.setItem('applicationForms', JSON.stringify(existingForms));
    console.log("Saved forms to localStorage");

  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }

  // Update the React Query cache
  if (queryClient) {
    // Force a direct cache update for both global and program-specific queries
    console.log("Updating React Query cache");

    // Get the latest global forms
    const allForms = window.globalApplicationForms;

    // Update the global forms cache
    queryClient.setQueryData(['/api/application-forms'], allForms);

    // Vérifier si le programId est un UUID (chaîne de caractères avec des tirets)
    const isUuid = typeof programId === 'string' && programId.includes('-');

    // Filtrer les formulaires en fonction du type de programId
    const programForms = allForms.filter((f: any) => {
      if (isUuid) {
        // Si c'est un UUID, faire une comparaison de chaînes
        return String(f.programId) === String(programId);
      } else {
        // Sinon, faire une comparaison numérique
        const formProgramId = Number(f.programId);
        const programIdNum = Number(programId);
        return formProgramId === programIdNum;
      }
    });

    console.log(`Found ${programForms.length} forms for program ${programId}`);
    // Utiliser l'ID original pour mettre à jour le cache
    queryClient.setQueryData(['/api/application-forms', programId], programForms);

    // Invalidate queries to force refetches
    console.log("Invalidating React Query cache");
    queryClient.invalidateQueries({queryKey: ['/api/application-forms']});
    queryClient.invalidateQueries({queryKey: ['/api/application-forms', programId]});
  }

  // Dispatch a custom event that can be listened to elsewhere
  // Utiliser 'application-form-updated' pour être cohérent avec les autres parties de l'application
  const formEvent = new CustomEvent('application-form-updated', {
    detail: { form: normalizedFormData, action: 'create' }
  });
  document.dispatchEvent(formEvent);
  console.log("Dispatched application-form-updated event with action 'create'");

  // CRITICAL: Alert to verify form has been created
  console.log("%c FORM CREATED AND STORED! Check Applications tab to view it", "background: green; color: white; padding: 5px; font-weight: bold;");
}

// Function to dispatch when an evaluation criterion is created
function dispatchEvaluationCriterionCreated(programId: string, criterionData: any, queryClient: any) {
  console.log("*** DISPATCHING EVALUATION CRITERION CREATED EVENT ***");
  console.log("Program ID:", programId);
  console.log("Criterion Data:", criterionData);

  // Normalize the criterion data structure
  const normalizedCriterionData = {
    ...criterionData,
    id: criterionData.id || uuidv4(),
    // Keep programId as is to preserve type (string or number)
    programId: criterionData.programId || programId,
    createdAt: criterionData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  console.log("Normalized criterion data with programId:", normalizedCriterionData.programId);

  // Initialize global store if it doesn't exist
  if (!window.globalEvaluationCriteria) {
    window.globalEvaluationCriteria = [];
    console.log("Initialized global evaluation criteria store");
  }

  // Add the criterion to the global store with uniqueness check
  const criterionExists = window.globalEvaluationCriteria.some((c: any) =>
    c && c.id && c.id === normalizedCriterionData.id
  );

  if (!criterionExists) {
    window.globalEvaluationCriteria.push(normalizedCriterionData);
    console.log("Added criterion to global store. Total criteria:", window.globalEvaluationCriteria.length);
  } else {
    // Update the existing criterion
    const index = window.globalEvaluationCriteria.findIndex((c: any) => c.id === normalizedCriterionData.id);
    if (index !== -1) {
      window.globalEvaluationCriteria[index] = normalizedCriterionData;
      console.log("Updated existing criterion in global store");
    }
  }

  // Store in localStorage for persistence
  try {
    // Get existing criteria
    let existingCriteria = [];
    const storedCriteria = localStorage.getItem('evaluationCriteria');
    if (storedCriteria) {
      existingCriteria = JSON.parse(storedCriteria);
    }

    // Add the new criterion if it doesn't exist already
    const localCriterionExists = existingCriteria.some((c: any) => c.id === normalizedCriterionData.id);

    if (!localCriterionExists) {
      // Create a clean version for localStorage (no circular references)
      const storableCriterion = {
        ...normalizedCriterionData,
        // Ensure programId is stored in multiple formats for maximum compatibility
        programId: normalizedCriterionData.programId,
        programIdStr: String(normalizedCriterionData.programId || programId),
        programIdNum: Number(normalizedCriterionData.programId || programId)
      };

      existingCriteria.push(storableCriterion);
      console.log("Adding criterion to localStorage. Total criteria:", existingCriteria.length);
    } else {
      // Update the existing criterion
      const index = existingCriteria.findIndex((c: any) => c.id === normalizedCriterionData.id);
      if (index !== -1) {
        // Update with clean version
        existingCriteria[index] = {
          ...normalizedCriterionData,
          programId: normalizedCriterionData.programId,
          programIdStr: String(normalizedCriterionData.programId || programId),
          programIdNum: Number(normalizedCriterionData.programId || programId)
        };
        console.log("Updated existing criterion in localStorage");
      }
    }

    localStorage.setItem('evaluationCriteria', JSON.stringify(existingCriteria));
    console.log("Saved criteria to localStorage:", existingCriteria);

    // CRITICAL: Also save program-specific criteria for direct access
    const programSpecificKey = `evaluationCriteria_program_${String(programId)}`;
    const programCriteria = existingCriteria.filter((c: any) => {
      // Match by any programId format
      return String(c.programId) === String(programId) ||
             (c.programIdStr && c.programIdStr === String(programId)) ||
             (c.programIdNum && c.programIdNum === Number(programId));
    });

    localStorage.setItem(programSpecificKey, JSON.stringify(programCriteria));
    console.log(`Saved ${programCriteria.length} criteria specifically for program ${programId} to localStorage`);

  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }

  // Update the React Query cache
  if (queryClient) {
    // Get the latest global criteria
    const allCriteria = window.globalEvaluationCriteria;

    // Update the global criteria cache
    queryClient.setQueryData(['/api/evaluation-criteria'], allCriteria);

    // Update the program-specific cache
    const programCriteria = allCriteria.filter((c: any) => {
      if (!c || !c.programId) return false;

      // Try string comparison first
      if (String(c.programId) === String(programId)) {
        return true;
      }

      // Vérifier si le programId est un UUID (chaîne de caractères avec des tirets)
      const isUuid = typeof programId === 'string' && programId.includes('-');

      if (isUuid) {
        // Si c'est un UUID, faire une comparaison de chaînes
        return String(c.programId) === String(programId);
      } else {
        // Sinon, essayer une comparaison numérique
        try {
          const criterionProgramId = Number(c.programId);
          const targetProgramId = Number(programId);
          if (!isNaN(criterionProgramId) && !isNaN(targetProgramId)) {
            return criterionProgramId === targetProgramId;
          }
        } catch (e) {
          // Ignorer les erreurs d'analyse
        }
      }

      return false;
    });

    console.log(`Found ${programCriteria.length} criteria for program ${programId}`);

    // Use both string and number versions of programId for maximum compatibility
    const programIdStr = String(programId);
    const programIdNum = Number(programId);

    // Set data for both string and number keys to ensure it's found regardless of type
    queryClient.setQueryData(['/api/evaluation-criteria', programIdStr], programCriteria);
    queryClient.setQueryData(['/api/evaluation-criteria', programIdNum], programCriteria);

    // Invalidate queries to force refetches
    console.log("Invalidating React Query cache for evaluation criteria");
    queryClient.invalidateQueries({queryKey: ['/api/evaluation-criteria']});
    queryClient.invalidateQueries({queryKey: ['/api/evaluation-criteria', programIdStr]});
    queryClient.invalidateQueries({queryKey: ['/api/evaluation-criteria', programIdNum]});
  }

  // Dispatch a custom event
  const criterionEvent = new CustomEvent('evaluation-criterion-created', {
    detail: {
      programId: programId, // Keep original type
      programIdStr: String(programId), // String version
      programIdNum: Number(programId), // Number version
      criterion: normalizedCriterionData
    }
  });
  document.dispatchEvent(criterionEvent);
  console.log("Dispatched evaluation-criterion-created event");

  // CRITICAL: Alert to verify criterion has been created
  console.log("%c EVALUATION CRITERION CREATED AND STORED! Check Evaluation tab to view it", "background: green; color: white; padding: 5px; font-weight: bold;");
}

const CreateProgram: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [savedTemplates, setSavedTemplates] = useState<any[]>([]);
  const [currentProgram, setCurrentProgram] = useState<ProgramState>({
    name: "",
    description: "",
    startDate: new Date(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    dashboardWidgets: [],
    eligibilityCriteria: {
      minTeamSize: 1,
      maxTeamSize: 10,
      requiredStages: [],
      requiredIndustries: [],
      minRevenue: 0,
      maxRevenue: 1000000,
      requiredDocuments: []
    },
    mentors: [],
    status: 'draft'
  });
  const [programPhases, setProgramPhases] = useState<PhaseDetails[]>([]);
  const [applicationForm, setApplicationForm] = useState<any>({
    questions: [],
    settings: {
      allowTeamSize: true,
      requireTeamMembers: true,
      allowMultipleSubmissions: false
    }
  });
  const [dashboardLayout, setDashboardLayout] = useState<WidgetData[]>([]);
  const [availableWidgets, setAvailableWidgets] = useState<WidgetData[]>([
    {
      id: 'numberOfStartups',
      type: 'numberOfStartups',
      title: 'Nombre d\'\u00e9quipes',
      description: 'Suivre le nombre d\'\u00e9quipes dans votre programme',
      icon: Users,
      color: '#0ea5e9',
      position: { x: 0, y: 0, w: 2, h: 1 },
      content: <NumberOfStartupsWidget />,
      data: { count: 0 }
    },
    {
      id: 'progressTracker',
      type: 'progressTracker',
      title: 'Suivi de progression',
      description: 'Surveiller la progression globale du programme',
      icon: BarChart,
      color: '#8b5cf6',
      position: { x: 2, y: 0, w: 4, h: 2 },
      content: <ProgressTrackerWidget />,
      data: { progress: 0 }
    },
    {
      id: 'upcomingMeetings',
      type: 'upcomingMeetings',
      title: 'Réunions à venir',
      description: 'Voir et gérer les réunions à venir',
      icon: Calendar,
      color: '#f59e0b',
      position: { x: 0, y: 1, w: 2, h: 2 },
      content: <UpcomingMeetingsWidget />,
      data: { meetings: [] }
    },
    {
      id: 'evaluationCriteria',
      type: 'evaluationCriteria',
      title: 'Critères d\'\u00e9valuation',
      description: 'Suivre les métriques d\'\u00e9valuation des startups',
      icon: Flag,
      color: '#10b981',
      position: { x: 2, y: 2, w: 2, h: 2 },
      content: <EvaluationCriteriaWidget />,
      data: { criteria: [] }
    },
    {
      id: 'eligibilityCriteria',
      type: 'eligibilityCriteria',
      title: 'Critères d\'\u00e9ligibilité',
      description: 'Voir les exigences d\'\u00e9ligibilité du programme',
      icon: Filter,
      color: '#3b82f6',
      position: { x: 4, y: 2, w: 2, h: 2 },
      content: <EligibilityCriteriaWidget />,
      data: { criteria: [] }
    },
    {
      id: 'overallTasks',
      type: 'overallTasks',
      title: 'Tâches globales',
      description: 'Surveiller les tâches et échéances du programme',
      icon: MessageSquare,
      color: '#ec4899',
      position: { x: 0, y: 3, w: 2, h: 2 },
      content: <OverallTasksWidget />,
      data: { tasks: [] }
    },
    {
      id: 'phases',
      type: 'phases',
      title: 'Phases du programme',
      description: 'Voir et gérer les phases du programme',
      icon: BarChart2,
      color: '#6366f1',
      position: { x: 2, y: 3, w: 3, h: 2 },
      content: <PhasesWidget />,
      data: { phases: [] }
    },
    {
      id: 'resources',
      type: 'resources',
      title: 'Ressources',
      description: 'Accéder aux ressources et matériels du programme',
      icon: PlusCircle,
      color: '#14b8a6',
      position: { x: 5, y: 3, w: 3, h: 2 },
      content: <ResourcesWidget />,
      data: { resources: [] }
    }
  ]);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isDraft, setIsDraft] = useState(false);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { createProgram: contextCreateProgram } = useProgramContext();

  // Charger les modèles enregistrés au chargement de la page
  React.useEffect(() => {
    const loadedTemplates = getSavedProgramTemplates();
    setSavedTemplates(loadedTemplates);

    // Vérifier s'il y a un programme en brouillon à éditer
    const editingProgramJSON = localStorage.getItem('editingProgram');

    if (editingProgramJSON) {
      try {
        const editingProgram = JSON.parse(editingProgramJSON);

        // Mettre à jour le programme courant
        const programToLoad = {
          id: editingProgram.id,
          name: editingProgram.name || "",
          description: editingProgram.description || "",
          startDate: new Date(editingProgram.startDate || new Date()),
          endDate: new Date(editingProgram.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)),
          dashboardWidgets: editingProgram.dashboardWidgets || [],
          eligibilityCriteria: {
            minTeamSize: editingProgram.eligibilityCriteria?.minTeamSize || 1,
            maxTeamSize: editingProgram.eligibilityCriteria?.maxTeamSize || 10,
            requiredStages: editingProgram.eligibilityCriteria?.requiredStages || [],
            requiredIndustries: editingProgram.eligibilityCriteria?.requiredIndustries || [],
            minRevenue: editingProgram.eligibilityCriteria?.minRevenue || 0,
            maxRevenue: editingProgram.eligibilityCriteria?.maxRevenue || 1000000,
            requiredDocuments: editingProgram.eligibilityCriteria?.requiredDocuments || []
          },
          mentors: editingProgram.mentors || [],
          status: 'draft' as 'draft'
        };

        // Définir également selectedTemplate pour que ProgramForm utilise les bonnes valeurs
        const templateToLoad = {
          id: editingProgram.id,
          name: editingProgram.name || "",
          description: editingProgram.description || "",
          startDate: new Date(editingProgram.startDate || new Date()),
          endDate: new Date(editingProgram.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)),
          phases: editingProgram.phases || [],
          dashboardWidgets: editingProgram.dashboardWidgets || [],
          mentors: editingProgram.mentors || [],
          eligibilityCriteria: editingProgram.eligibilityCriteria || {
            minTeamSize: 1,
            maxTeamSize: 10,
            requiredStages: [],
            requiredIndustries: [],
            minRevenue: 0,
            maxRevenue: 1000000,
            requiredDocuments: []
          },
          evaluationCriteria: editingProgram.evaluationCriteria || [],
          formTemplates: []
        };

        setCurrentProgram(programToLoad);
        setSelectedTemplate(templateToLoad);

        // Mettre à jour les phases
        if (editingProgram.phases && editingProgram.phases.length > 0) {
          // S'assurer que chaque phase a toutes les propriétés nécessaires
          const updatedPhases = editingProgram.phases.map((phase: any) => ({
            id: phase.id,
            name: phase.name,
            color: phase.color || "#000000",
            description: phase.description || "",
            startDate: phase.startDate ? new Date(phase.startDate) : new Date(),
            endDate: phase.endDate ? new Date(phase.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: phase.status || "not_started",
            tasks: Array.isArray(phase.tasks) ? phase.tasks : [],
            meetings: Array.isArray(phase.meetings) ? phase.meetings : [],
            evaluationCriteria: Array.isArray(phase.evaluationCriteria) ? phase.evaluationCriteria : [],
            deliverables: Array.isArray(phase.deliverables) ? phase.deliverables : [],
            hasWinner: phase.hasWinner || false
          }));
          setProgramPhases(updatedPhases);
        }

        // Mettre à jour le formulaire de candidature
        if (editingProgram.applicationForm) {
          // S'assurer que le formulaire a toutes les propriétés nécessaires
          const updatedForm = {
            id: editingProgram.applicationForm.id || Date.now(),
            name: editingProgram.applicationForm.name || `Formulaire de candidature - ${editingProgram.name}`,
            description: editingProgram.applicationForm.description || `Formulaire de candidature pour le programme ${editingProgram.name}`,
            programId: editingProgram.id,
            questions: Array.isArray(editingProgram.applicationForm.questions) ? editingProgram.applicationForm.questions : [
              {
                id: "q1",
                type: "short_text",
                text: "Quel est le nom de votre startup?",
                required: true
              },
              {
                id: "q2",
                type: "long_text",
                text: "Décrivez votre projet en quelques phrases",
                required: true
              }
            ],
            settings: editingProgram.applicationForm.settings || {
              title: `Formulaire de candidature - ${editingProgram.name}`,
              description: `Formulaire de candidature pour le programme ${editingProgram.name}`,
              submitButtonText: "Soumettre",
              successMessage: "Votre candidature a été soumise avec succès."
            },
            isActive: editingProgram.applicationForm.isActive !== undefined ? editingProgram.applicationForm.isActive : true,
            createdAt: editingProgram.applicationForm.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setApplicationForm(updatedForm);
        } else {
          // Créer un formulaire par défaut si aucun n'existe
          const defaultForm = {
            id: Date.now(),
            name: `Formulaire de candidature - ${editingProgram.name}`,
            description: `Formulaire de candidature pour le programme ${editingProgram.name}`,
            programId: editingProgram.id,
            questions: [
              {
                id: "q1",
                type: "short_text",
                text: "Quel est le nom de votre startup?",
                required: true
              },
              {
                id: "q2",
                type: "long_text",
                text: "Décrivez votre projet en quelques phrases",
                required: true
              }
            ],
            settings: {
              title: `Formulaire de candidature - ${editingProgram.name}`,
              description: `Formulaire de candidature pour le programme ${editingProgram.name}`,
              submitButtonText: "Soumettre",
              successMessage: "Votre candidature a été soumise avec succès."
            },
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setApplicationForm(defaultForm);
        }

        // Marquer la première étape comme terminée
        setCompletedSteps([1]);

        // Aller directement à l'étape des détails du programme
        setCurrentStep(2);

        // Supprimer le programme du localStorage pour éviter de le charger à nouveau
        localStorage.removeItem('editingProgram');

        toast({
          title: "Programme chargé",
          description: "Le programme en brouillon a été chargé avec succès.",
        });
      } catch (error) {
        console.error("Erreur lors du chargement du programme en brouillon:", error);
        localStorage.removeItem('editingProgram');
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors du chargement du programme en brouillon.",
          variant: "destructive",
        });
      }
    }
  }, []);

  const handleNextStep = () => {
    if (!completedSteps.includes(currentStep)) {
    setCompletedSteps([...completedSteps, currentStep]);
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const isStepCompleted = (step: number) => completedSteps.includes(step);

  const createProgram = (programData: any) => {
    try {
      // Vérifier et réparer le stockage local avant de créer un programme
      checkAndRepairStorage();
      // Convert the program data to the format expected by the context
      const programToCreate = {
        name: programData.name,
        description: programData.description,
        startDate: programData.startDate,
        endDate: programData.endDate,
        status: programData.status,
        phases: programPhases.map(phase => ({
          id: phase.id,
          name: phase.name,
          color: phase.color || "#000000",
          description: phase.description || "",
          startDate: phase.startDate,
          endDate: phase.endDate,
          status: phase.status || "not_started",
          tasks: phase.tasks || [],
          meetings: phase.meetings || [],
          evaluationCriteria: phase.evaluationCriteria || [],
          deliverables: phase.deliverables || []
        })),
        // Collect all tasks, meetings, and evaluation criteria for sidebar display
        tasks: programPhases.reduce((allTasks: any[], phase) =>
          allTasks.concat(Array.isArray(phase.tasks) ? phase.tasks.map((task: any) => ({
            id: task.id,
            phaseId: phase.id,
            phaseName: phase.name,
            // Map program.Task properties to TasksContext.Task properties
            title: task.name,
            description: task.description || '',
            dueDate: task.dueDate ? (typeof task.dueDate === 'string' ? task.dueDate : task.dueDate.toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
            status: 'todo',
            priority: 'medium',
            assignee: 'Unassigned',
            tags: [],
            isOverdue: false,
            forAllTeams: true
          })) : []), []),
        meetings: programPhases.reduce((allMeetings: any[], phase) =>
          allMeetings.concat(Array.isArray(phase.meetings) ? phase.meetings.map((meeting: any) => ({
            ...meeting,
            phaseId: phase.id,
            phaseName: phase.name
          })) : []), []),
        evaluationCriteria: programPhases.reduce((allCriteria: any[], phase) =>
          allCriteria.concat(Array.isArray(phase.evaluationCriteria) ? phase.evaluationCriteria.map((criterion: any) => ({
            ...criterion,
            phaseId: phase.id,
            phaseName: phase.name
          })) : []), []),
        deliverables: programPhases.reduce((allDeliverables: any[], phase) =>
          allDeliverables.concat(Array.isArray(phase.deliverables) ? phase.deliverables.map((deliverable: any) => ({
            ...deliverable,
            phaseId: phase.id,
            phaseName: phase.name
          })) : []), []),
        eligibilityCriteria: programData.eligibilityCriteria,
        dashboardWidgets: programData.dashboardWidgets || [],
        mentors: programData.mentors || [],
        applicationForm: applicationForm // Add the application form to the program data
      };

      // Use the context method instead of API request
      const newProgramId = contextCreateProgram(programToCreate);

      // Create application form for the program
      // Même si aucune question n'est fournie, créer un formulaire par défaut
      if (applicationForm) {
        // Si aucune question n'est fournie, créer des questions par défaut
        const questions = (applicationForm.questions && applicationForm.questions.length > 0)
          ? applicationForm.questions
          : [
              {
                id: "q1",
                type: "short_text",
                text: "Quel est le nom de votre startup?",
                required: true
              },
              {
                id: "q2",
                type: "long_text",
                text: "Décrivez votre projet en quelques phrases",
                required: true
              }
            ];
        // Prepare form data to save
        const formData = {
          id: Date.now(), // Use timestamp as ID
          name: applicationForm.settings?.title || `Formulaire de candidature - ${programToCreate.name}`,
          description: applicationForm.settings?.description || `Formulaire de candidature pour le programme ${programToCreate.name}`,
          programId: newProgramId, // Utiliser directement l'UUID sans conversion
          questions: questions, // Utiliser les questions par défaut si aucune n'est fournie
          settings: applicationForm.settings,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        console.log("%c Creating application form with programId:", "background: blue; color: white; padding: 5px; font-size: 14px;", newProgramId, "type:", typeof newProgramId, "Form data:", formData);

        // HIGHEST PRIORITY: DIRECT STORAGE METHOD
        // Utiliser saveFormDirect pour être cohérent avec le reste de l'application
        console.log("%c === SAUVEGARDE DU FORMULAIRE DANS LE PROGRAMME ====", "background: blue; color: white; padding: 5px; font-size: 14px;");
        console.log("formData avant saveFormDirect:", formData);
        console.log("programId avant saveFormDirect:", formData.programId);

        // Vérifier que le programId est bien défini
        if (!formData.programId) {
          console.error("%c ERREUR: programId non défini dans formData", "background: red; color: white; padding: 5px; font-size: 14px;");

          // Modifier directement la propriété programId en utilisant une conversion de type
          (formData as any).programId = newProgramId;

          console.log("%c programId corrigé:", "background: green; color: white; padding: 5px; font-size: 14px;", formData.programId, typeof formData.programId);
        }

        // Vérifier si le programId est un UUID (chaîne de caractères avec des tirets)
        const isUuid = typeof newProgramId === 'string' && newProgramId.includes('-');
        console.log(`%c Le newProgramId est-il un UUID? ${isUuid}`, "background: orange; color: black; padding: 5px; font-size: 14px;");

        // Utiliser directement l'UUID comme programId sans le convertir en nombre
        console.log(`%c newProgramId original: ${newProgramId} (${typeof newProgramId})`, "background: green; color: white; padding: 5px; font-size: 14px;");

        const savedForm = saveFormDirect({
          name: formData.name,
          description: formData.description,
          programId: newProgramId, // Utiliser l'ID original sans conversion
          questions: formData.questions,
          settings: formData.settings
        }, newProgramId); // Utiliser l'ID original sans conversion

        console.log("%c FORMULAIRE SAUVEGARDÉ AVEC SUCCÈS", "background: green; color: white; padding: 5px; font-size: 14px;");
        console.log("Formulaire sauvegardé:", savedForm);

        // Pas besoin d'appeler dispatchApplicationFormCreated car saveFormDirect déclenche déjà l'événement
        // dispatchApplicationFormCreated(String(newProgramId), formData, queryClient);

        // Mettre à jour le cache React Query directement
        queryClient.setQueryData(['/api/application-forms'], (oldData: any[] = []) => {
          console.log("%c Setting global form cache data", "background: green; color: white; padding: 3px;");
          return [...(oldData || []), savedForm];
        });

        // Force an immediate refetch
        queryClient.invalidateQueries({queryKey: ['/api/application-forms']});

        // Déclencher un événement pour notifier les autres composants
        console.log("%c Déclenchement de l'événement application-form-updated", "background: purple; color: white; padding: 3px;");
        const event = new CustomEvent('application-form-updated', {
          detail: { form: savedForm, action: 'create', programId: newProgramId }
        });
        document.dispatchEvent(event);
      }

      // Create evaluation criteria for the program
      // Check if program has evaluation criteria, if not, add default ones
      if (!programToCreate.evaluationCriteria || programToCreate.evaluationCriteria.length === 0) {
        console.log("No evaluation criteria found, adding default criteria");

        // Default evaluation criteria
        const defaultCriteria = [
          {
            id: `criterion_${Date.now()}_1`,
            name: "Opportunité de marché",
            description: "Évaluation de la taille du marché, du potentiel de croissance et de la compréhension de la dynamique du marché",
            weight: 25,
            importance: 5,
            color: "rgba(79, 70, 229, 1)",
            type: "scale",
            minValue: 1,
            maxValue: 5,
            required: true
          },
          {
            id: `criterion_${Date.now()}_2`,
            name: "Innovation produit",
            description: "Évaluation de l'unicité du produit, de l'avantage concurrentiel et de l'approche innovante",
            weight: 20,
            importance: 4,
            color: "rgba(236, 72, 153, 1)",
            type: "scale",
            minValue: 1,
            maxValue: 5,
            required: true
          },
          {
            id: `criterion_${Date.now()}_3`,
            name: "Capacité de l'équipe",
            description: "Évaluation de l'expertise, de l'expérience et de la capacité d'exécution de l'équipe",
            weight: 20,
            importance: 4,
            color: "rgba(34, 197, 94, 1)",
            type: "scale",
            minValue: 1,
            maxValue: 5,
            required: true
          },
          {
            id: `criterion_${Date.now()}_4`,
            name: "Modèle d'affaires",
            description: "Évaluation de la viabilité, de l'évolutivité et du potentiel de rentabilité du modèle d'affaires",
            weight: 15,
            importance: 3,
            color: "rgba(249, 115, 22, 1)",
            type: "scale",
            minValue: 1,
            maxValue: 5,
            required: true
          },
          {
            id: `criterion_${Date.now()}_5`,
            name: "Impact social",
            description: "Évaluation de l'impact social ou environnemental positif potentiel",
            weight: 10,
            importance: 2,
            color: "rgba(168, 85, 247, 1)",
            type: "scale",
            minValue: 1,
            maxValue: 5,
            required: true
          }
        ];

        // Add default criteria to the program
        programToCreate.evaluationCriteria = defaultCriteria;
      }

      // Process evaluation criteria
      if (programToCreate.evaluationCriteria && programToCreate.evaluationCriteria.length > 0) {
        // Process each evaluation criterion
        programToCreate.evaluationCriteria.forEach((criterion: any) => {
          // Prepare criterion data to save
          const criterionData = {
            id: criterion.id || `criterion_${Date.now()}`,
            name: criterion.name,
            description: criterion.description || "",
            weight: criterion.weight || 10,
            importance: criterion.importance || 3,
            color: criterion.color || "rgba(79, 70, 229, 1)",
            programId: newProgramId, // Keep as string to match the program ID type
            type: criterion.type || "scale",
            minValue: criterion.minValue || 1,
            maxValue: criterion.maxValue || 5,
            required: criterion.required !== undefined ? criterion.required : true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          console.log("Creating evaluation criterion with exact programId:", newProgramId, "Criterion data:", criterionData);

          console.log("%c Creating evaluation criterion with programId:", "background: green; color: white; padding: 5px; font-size: 14px;", newProgramId, "type:", typeof newProgramId, "Criterion data:", criterionData);

          // Use the utility function to dispatch the event
          dispatchEvaluationCriterionCreated(String(newProgramId), criterionData, queryClient);
        });
      }

      // Show success toast and navigate
      toast({
        title: "Success",
        description: "Program created successfully",
      });
      setLocation("/programs");
    } catch (error) {
      console.error("Error creating program:", error);
      toast({
        title: "Error",
        description: "Failed to create program",
        variant: "destructive",
      });
    }
  };

  const saveDraft = () => {
    setIsDraft(true);
    createProgram({
      ...currentProgram,
      status: 'draft'
    });
  };

  // Fonction pour enregistrer le programme comme modèle
  const saveAsTemplate = () => {
    // Ouvrir une boîte de dialogue pour demander le nom et la description du modèle
    const templateName = prompt("Nom du modèle:", currentProgram.name);
    if (!templateName) return; // L'utilisateur a annulé

    const templateDescription = prompt("Description du modèle:", currentProgram.description);
    if (!templateDescription) return; // L'utilisateur a annulé

    try {
      // Enregistrer le programme comme modèle
      saveProgramAsTemplate(
        {
          id: uuidv4(),
          name: currentProgram.name,
          description: currentProgram.description,
          startDate: currentProgram.startDate.toISOString(),
          endDate: currentProgram.endDate.toISOString(),
          dashboardWidgets: (currentProgram.dashboardWidgets || []).map(widget => ({
            ...widget,
            size: widget.size || 'medium',
            config: {}
          })) as any,
          eligibilityCriteria: currentProgram.eligibilityCriteria,
          mentors: currentProgram.mentors || [],
          status: 'draft',
          phases: programPhases,
          evaluationCriteria: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        templateName,
        templateDescription
      );

      toast({
        title: "Modèle enregistré",
        description: `Le modèle "${templateName}" a été enregistré avec succès.`,
      });
    } catch (error) {
      console.error("Error saving program template:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement du modèle.",
        variant: "destructive",
      });
    }
  };

  const handleWidgetsChange = (widgets: WidgetData[]) => {
    setCurrentProgram(prev => ({
      ...prev,
      dashboardWidgets: widgets
    }));
  };

  const handleUpdatePhase = (updatedPhase: PhaseDetails) => {
    setProgramPhases(phases =>
      phases.map(phase =>
        phase.id === updatedPhase.id ? updatedPhase : phase
      )
    );
  };

  const handleRemovePhase = (phaseId: string) => {
    setProgramPhases(phases => phases.filter(phase => phase.id !== phaseId));
    if (expandedPhase === phaseId) {
      setExpandedPhase(null);
    }
  };

  // Import the mentors from the MentorManagement component
  // This ensures we use the same mentors in both places
  const sampleMentors = [
    {
      id: 1,
      name: "John Doe",
      expertise: ["Technologie", "Équipes"],
      bio: "Entrepreneur en série avec plus de 10 ans d'expérience",
      email: "john.doe@example.com",
      rating: 4.8,
      isTopMentor: true,
      title: "PDG, TechVentures"
    },
    {
      id: 2,
      name: "Jane Smith",
      expertise: ["Santé", "Innovation"],
      bio: "Expert de l'industrie de la santé et conseiller en startups",
      email: "jane.smith@example.com",
      rating: 4.9,
      isTopMentor: true,
      title: "Fondateur, HealthTech Innovations"
    },
    {
      id: 3,
      name: "Mike Johnson",
      expertise: ["Impact social", "Technologie"],
      bio: "Entrepreneur social et mentor de startups",
      email: "mike.johnson@example.com",
      rating: 4.7,
      isTopMentor: false,
      title: "Directeur, Impact Ventures"
    },
    {
      id: 4,
      name: "Sarah Wilson",
      expertise: ["Fintech", "Marketing"],
      bio: "Spécialiste en marketing fintech et conseiller en croissance",
      email: "sarah.wilson@example.com",
      rating: 4.6,
      isTopMentor: false,
      title: "Directeur marketing, FinGrowth"
    }
  ];

  const templates: ProgramTemplate[] = [
    {
      id: "1",
                  name: "Programme d'accélération",
      description: "Un programme d'accélération complet pour les équipes en phase de démarrage",
      mentors: [sampleMentors[0], sampleMentors[1]],
                  phases: [
                    {
          id: "phase-1",
                      name: "Candidature",
          description: "Phase de candidature et de sélection",
                      startDate: new Date(),
                      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          tasks: [
            {
              id: "task-1",
              name: "Soumettre la candidature",
              description: "Remplir le formulaire de candidature au programme",
              dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
            }
          ],
          meetings: [
            {
              id: "meeting-1",
              title: "Séance d'information",
              date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              type: "group"
            }
          ],
          evaluationCriteria: [
            {
              id: "eval-1",
              name: "Composition de l'équipe",
              description: "Évaluer la composition de l'équipe et les rôles",
              weight: 30,
              type: "star_rating",
              accessibleBy: ["mentors", "teams"],
              requiresValidation: false
            }
          ],
          status: "not_started"
        }
      ],
      evaluationCriteria: [
        {
          id: "eval-1",
          name: "Composition de l'équipe",
          description: "Évaluer la composition de l'équipe et les rôles",
          weight: 30,
          type: "star_rating",
          accessibleBy: ["mentors", "teams"],
          requiresValidation: false
        }
      ],
      formTemplates: [
        {
          id: "form-1",
          name: "Informations sur l'équipe",
          description: "Formulaire d'informations de base sur l'équipe",
          questions: [
            {
              id: "q-1",
              type: "text",
              text: "Nom de l'équipe",
              required: true
            }
          ]
        }
      ],
      dashboardWidgets: [
        {
          id: "widget-1",
          type: "numberOfStartups",
          title: "Nombre d\'\u00e9quipes",
          description: "Suivre le nombre d\'\u00e9quipes dans votre programme",
          icon: Users,
          color: "#0ea5e9",
          position: {
            x: 0,
            y: 0,
            w: 2,
            h: 1
          },
          size: "medium",
          config: {},
          content: null
        }
      ],
                  eligibilityCriteria: {
                    minTeamSize: 2,
                    maxTeamSize: 5,
                    requiredStages: ["Pré-amorçage", "Amorçage"],
                    requiredIndustries: ["Technologie", "Santé", "Fintech"],
                    minRevenue: 0,
                    maxRevenue: 100000,
                    requiredDocuments: ["Présentation", "Projections financières", "Biographies de l'équipe"]
      }
    },
    {
      id: "2",
      name: "Programme d'incubation",
      description: "Un programme de 6 mois conçu pour aider les startups en phase de démarrage à affiner leur modèle d'affaires et à se préparer à la croissance",
      mentors: [sampleMentors[1], sampleMentors[2]],
      phases: [
        {
          id: "phase-1",
          name: "Candidature et sélection",
          description: "Examiner et sélectionner les startups prometteuses",
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          tasks: [
            {
              id: "task-1",
              name: "Examiner les candidatures",
              description: "Évaluer les candidatures soumises",
              dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
            }
          ],
          meetings: [
            {
              id: "meeting-1",
              title: "Comité de sélection",
              date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
              type: "internal"
            }
          ],
          evaluationCriteria: [
            {
              id: "eval-1",
              name: "Potentiel d'innovation",
              description: "Évaluer les aspects innovants de l'entreprise",
              weight: 40,
              type: "star_rating",
              accessibleBy: ["mentors"],
              requiresValidation: true
            }
          ],
          status: "not_started"
        }
      ],
      evaluationCriteria: [
        {
          id: "eval-1",
          name: "Viabilité du modèle d'affaires",
          description: "Évaluer la viabilité du modèle d'affaires",
          weight: 35,
          type: "star_rating",
          accessibleBy: ["mentors", "teams"],
          requiresValidation: false
        }
      ],
      formTemplates: [
        {
          id: "form-1",
          name: "Candidature à l'incubateur",
          description: "Candidature détaillée pour le programme d'incubation",
          questions: [
            {
              id: "q-1",
              type: "text",
              text: "Décrivez votre modèle d'affaires",
              required: true
            }
          ]
        }
      ],
      dashboardWidgets: [
        {
          id: "widget-1",
          type: "progressTracker",
          title: "Progression de l'incubation",
          description: "Suivre la progression des startups incubées",
          icon: BarChart,
          color: "#8b5cf6",
          position: {
            x: 0,
            y: 0,
            w: 2,
            h: 2
          },
          size: "large",
          config: {},
          content: null
        }
      ],
      eligibilityCriteria: {
        minTeamSize: 1,
        maxTeamSize: 4,
        requiredStages: ["Idée", "Pré-amorçage"],
        requiredIndustries: ["Technologie", "Impact social", "Durabilité"],
        minRevenue: 0,
        maxRevenue: 50000,
        requiredDocuments: ["Plan d'affaires", "Documentation du prototype", "CV de l'équipe"]
      }
    },
    {
      id: "3",
      name: "Hackathon",
      description: "Un événement intensif où les équipes collaborent pour résoudre des défis et construire des prototypes dans un court laps de temps",
      mentors: [sampleMentors[0], sampleMentors[3]],
                  phases: [
                    {
          id: "phase-1",
          name: "Inscription",
          description: "Inscription des participants et formation des équipes",
                      startDate: new Date(),
          endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          tasks: [
            {
              id: "task-1",
              name: "Compléter l'inscription",
              description: "Inscrire les équipes pour le hackathon",
              dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
            }
          ],
          meetings: [
            {
              id: "meeting-1",
              title: "Briefing pré-hackathon",
              date: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000),
              type: "group"
            }
          ],
          evaluationCriteria: [],
          status: "not_started"
        }
      ],
      evaluationCriteria: [
        {
          id: "eval-1",
          name: "Implémentation technique",
          description: "Qualité de l'implémentation technique",
          weight: 30,
          type: "star_rating",
          accessibleBy: ["mentors", "judges"],
          requiresValidation: false
        },
        {
          id: "eval-2",
          name: "Innovation",
          description: "Niveau d'innovation dans la solution",
          weight: 30,
          type: "star_rating",
          accessibleBy: ["mentors", "judges"],
          requiresValidation: false
        },
        {
          id: "eval-3",
          name: "Présentation",
          description: "Qualité de la présentation finale",
          weight: 20,
          type: "star_rating",
          accessibleBy: ["mentors", "judges"],
          requiresValidation: false
        }
      ],
      formTemplates: [
        {
          id: "form-1",
          name: "Inscription au hackathon",
          description: "Formulaire d'inscription rapide pour les participants au hackathon",
          questions: [
            {
              id: "q-1",
              type: "text",
              text: "Nom de l'équipe",
              required: true
            },
            {
              id: "q-2",
              type: "text",
              text: "Catégorie de défi",
              required: true
            }
          ]
        }
      ],
      dashboardWidgets: [
        {
          id: "widget-1",
          type: "numberOfStartups",
          title: "Équipes participantes",
          description: "Nombre d'équipes participant au hackathon",
          icon: Users,
          color: "#10b981",
          position: {
            x: 0,
            y: 0,
            w: 2,
            h: 1
          },
          size: "medium",
          config: {},
          content: null
        }
      ],
                  eligibilityCriteria: {
        minTeamSize: 1,
                    maxTeamSize: 10,
        requiredStages: [],
        requiredIndustries: [],
                    minRevenue: 0,
        maxRevenue: 0,
        requiredDocuments: []
      }
    },
    {
      id: "4",
      name: "Défi d'innovation",
      description: "Un programme d'innovation d'entreprise où les équipes développent des solutions pour des défis industriels spécifiques",
      phases: [
        {
          id: "phase-1",
          name: "Définition du défi",
          description: "Définir les défis d'innovation et les exigences",
          startDate: new Date(),
          endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
          tasks: [
            {
              id: "task-1",
              name: "Publier le briefing du défi",
              description: "Créer et publier les exigences du défi",
              dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
            }
          ],
          meetings: [
            {
              id: "meeting-1",
              title: "Alignement des parties prenantes",
              date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              type: "internal"
            }
          ],
          evaluationCriteria: [],
          status: "not_started"
        }
      ],
      evaluationCriteria: [
        {
          id: "eval-1",
          name: "Impact sur l'entreprise",
          description: "Impact potentiel sur les résultats de l'entreprise",
          weight: 40,
          type: "star_rating",
          accessibleBy: ["mentors", "judges"],
          requiresValidation: false
        },
        {
          id: "eval-2",
          name: "Faisabilité",
          description: "Faisabilité technique et opérationnelle",
          weight: 30,
          type: "star_rating",
          accessibleBy: ["mentors", "judges"],
          requiresValidation: false
        }
      ],
      formTemplates: [
        {
          id: "form-1",
          name: "Candidature au défi",
          description: "Candidature pour participer au défi d'innovation",
          questions: [
            {
              id: "q-1",
              type: "text",
              text: "Aperçu de la solution",
              required: true
            },
            {
              id: "q-2",
              type: "textarea",
              text: "Comment votre solution répond-elle au défi?",
              required: true
            }
          ]
        }
      ],
      dashboardWidgets: [
        {
          id: "widget-1",
          type: "evaluationCriteria",
          title: "Évaluation du défi",
          description: "Suivre l'évaluation des soumissions au défi",
          icon: Flag,
          color: "#f59e0b",
          position: {
            x: 0,
            y: 0,
            w: 3,
            h: 2
          },
          size: "large",
          config: {},
          content: null
        }
      ],
                  eligibilityCriteria: {
        minTeamSize: 1,
        maxTeamSize: 8,
        requiredStages: ["MVP", "Croissance"],
        requiredIndustries: ["Logiciel d'entreprise", "Industrie 4.0", "Analyse de données"],
        minRevenue: 0,
        maxRevenue: 500000,
        requiredDocuments: ["Résumé de la solution", "Profil de l'entreprise", "Plan de mise en œuvre"]
      }
    }
  ];

  const onTemplateSelect = (template: ProgramTemplate) => {
    const newProgram: ProgramState = {
      name: template.name,
      description: template.description,
      startDate: template.startDate || new Date(),
      endDate: template.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      dashboardWidgets: template.dashboardWidgets.map(widget => ({
        ...widget,
        position: {
          x: widget.position.x,
          y: widget.position.y,
          w: widget.position.w,
          h: widget.position.h
        }
      })) as WidgetData[],
      eligibilityCriteria: template.eligibilityCriteria ?? {
                    minTeamSize: 1,
                    maxTeamSize: 10,
                    requiredStages: [],
                    requiredIndustries: [],
                    minRevenue: 0,
                    maxRevenue: 1000000,
                    requiredDocuments: []
                  },
      mentors: template.mentors || [],
      status: 'draft'
    };

    // Mettre à jour le template sélectionné
    setSelectedTemplate(template);

    // Mettre à jour le programme courant
    setCurrentProgram(newProgram);

    // Mettre à jour les phases si elles existent dans le template
    if (template.phases) {
      // Convertir les phases du template en PhaseDetails
      const phaseDetails = template.phases.map(phase => ({
        id: phase.id,
        name: phase.name,
        color: phase.color || "#000000",
        description: phase.description || "",
        startDate: phase.startDate ? new Date(phase.startDate) : new Date(),
        endDate: phase.endDate ? new Date(phase.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: phase.status || "not_started",
        tasks: Array.isArray(phase.tasks) ? phase.tasks : [],
        meetings: Array.isArray(phase.meetings) ? phase.meetings : [],
        evaluationCriteria: Array.isArray(phase.evaluationCriteria) ? phase.evaluationCriteria : [],
        deliverables: [], // Propriété requise pour PhaseDetails
        hasWinner: phase.hasWinner || false
      }));
      setProgramPhases(phaseDetails);
    }

    // Marquer l'étape comme terminée
    setCompletedSteps([1]);

    // Passer à l'étape suivante
    setCurrentStep(2);
  };

  // Fonction pour sélectionner un modèle enregistré
  const onSavedTemplateSelect = (template: any) => {
    console.log('Saved template selected:', template);

    // Créer un nouveau programme à partir du modèle enregistré
    const newProgram: ProgramState = {
      name: template.name,
      description: template.description,
      startDate: new Date(template.programData.startDate),
      endDate: new Date(template.programData.endDate),
      dashboardWidgets: template.programData.dashboardWidgets || [],
      eligibilityCriteria: template.programData.eligibilityCriteria || {
        minTeamSize: 1,
        maxTeamSize: 10,
        requiredStages: [],
        requiredIndustries: [],
        minRevenue: 0,
        maxRevenue: 1000000,
        requiredDocuments: []
      },
      mentors: template.programData.mentors || [],
      status: 'draft'
    };

    // Mettre à jour le template sélectionné
    setSelectedTemplate({
      id: template.id,
      name: template.name,
      description: template.description,
      phases: template.programData.phases || [],
      dashboardWidgets: template.programData.dashboardWidgets || [],
      mentors: template.programData.mentors || [],
      startDate: new Date(template.programData.startDate),
      endDate: new Date(template.programData.endDate),
      eligibilityCriteria: template.programData.eligibilityCriteria
    });

    // Mettre à jour le programme courant
    setCurrentProgram(newProgram);

    // Mettre à jour les phases si elles existent dans le template
    if (template.programData.phases) {
      // Convertir les phases du template en PhaseDetails
      const phaseDetails = template.programData.phases.map((phase: any) => ({
        id: phase.id,
        name: phase.name,
        color: phase.color || "#000000",
        description: phase.description || "",
        startDate: phase.startDate ? new Date(phase.startDate) : new Date(),
        endDate: phase.endDate ? new Date(phase.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: phase.status || "not_started",
        tasks: Array.isArray(phase.tasks) ? phase.tasks : [],
        meetings: Array.isArray(phase.meetings) ? phase.meetings : [],
        evaluationCriteria: Array.isArray(phase.evaluationCriteria) ? phase.evaluationCriteria : [],
        deliverables: [], // Propriété requise pour PhaseDetails
        hasWinner: phase.hasWinner || false
      }));
      setProgramPhases(phaseDetails);
    }

    // Marquer l'étape comme terminée
    setCompletedSteps([1]);

    // Passer à l'étape suivante
    setCurrentStep(2);
  };

  const onCustomProgramCreate = () => {
    const defaultEligibilityCriteria = {
                    minTeamSize: 1,
                    maxTeamSize: 10,
                    requiredStages: [],
                    requiredIndustries: [],
                    minRevenue: 0,
                    maxRevenue: 1000000,
                    requiredDocuments: []
    };

    const customTemplate: ProgramTemplate = {
      id: "custom",
      name: "",
      description: "",
      phases: [],
      evaluationCriteria: [],
      formTemplates: [],
      eligibilityCriteria: defaultEligibilityCriteria,
      mentors: [],
      dashboardWidgets: []
    };

    // Reset all states for custom program
                setSelectedTemplate(customTemplate);
    setProgramPhases([]);
    setApplicationForm({
      questions: [],
      settings: {
        allowTeamSize: true,
        requireTeamMembers: true,
        allowMultipleSubmissions: false
      }
    });

    // Set empty program
                setCurrentProgram({
      name: "",
      description: "",
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      dashboardWidgets: [],
      eligibilityCriteria: defaultEligibilityCriteria,
      mentors: [],
      status: 'draft'
    });

    // Reset completed steps
    setCompletedSteps([1]);

    // Move to next step
    setCurrentStep(2);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
                    <div>
              <h2 className="text-lg font-medium text-gray-900">Sélectionner un modèle de programme</h2>
              <p className="mt-1 text-sm text-gray-500">
                Choisissez un modèle pour commencer ou créez un programme personnalisé.
              </p>
                    </div>
            <ProgramTemplateSelector
              templates={templates}
              savedTemplates={savedTemplates}
              selectedTemplateId={selectedTemplate?.id}
              onTemplateSelect={(template) => {
                console.log('Template selected:', template);
                onTemplateSelect(template);
              }}
              onSavedTemplateSelect={(template) => {
                console.log('Saved template selected:', template);
                onSavedTemplateSelect(template);
              }}
              onCustomProgramCreate={onCustomProgramCreate}
            />
                    </div>
        );
      case 2:
        return (
          <div className="space-y-6">
                      <div>
              <h2 className="text-lg font-medium text-gray-900">Détails du programme</h2>
              <p className="mt-1 text-sm text-gray-500">
                Configurez les détails de votre programme.
              </p>
                      </div>
            <Card>
              <CardContent className="pt-6">
                <ProgramForm
                  initialData={{
                    name: selectedTemplate?.name || '',
                    description: selectedTemplate?.description || '',
                    startDate: selectedTemplate?.startDate || new Date(),
                    endDate: selectedTemplate?.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
                  }}
                  onSubmit={(data) => {
                    setCurrentProgram(prev => ({
                      ...prev,
                      ...data,
                      dashboardWidgets: selectedTemplate?.dashboardWidgets || [],
                      mentors: selectedTemplate?.mentors || [],
                      eligibilityCriteria: selectedTemplate?.eligibilityCriteria || prev.eligibilityCriteria,
                      status: 'draft'
                    }));

                    console.log('Template selected, mentors:', selectedTemplate?.mentors || []);

                    // Set phases if they exist in template
                    if (selectedTemplate?.phases) {
                      setProgramPhases(selectedTemplate.phases);
                    }

                    // Set application form if it exists in template
                    if (selectedTemplate?.applicationForm) {
                      setApplicationForm(selectedTemplate.applicationForm);
                    }

                    // Mark steps as completed
                    setCompletedSteps([1, 2]);
                  }}
                />
              </CardContent>
            </Card>

            <div className="mt-6">
              <h2 className="text-lg font-medium text-gray-900">Paramètres supplémentaires</h2>
              <Tabs defaultValue={selectedTemplate?.name === "Hackathon" ? "mentors" : "eligibility"} className="w-full mt-4">
                <TabsList className={`grid w-full ${selectedTemplate?.name === "Hackathon" ? "grid-cols-1" : "grid-cols-2"}`}>
                  {selectedTemplate?.name !== "Hackathon" && <TabsTrigger value="eligibility">Critères d'éligibilité</TabsTrigger>}
                  <TabsTrigger value="mentors">Mentors</TabsTrigger>
                </TabsList>
                <TabsContent value="eligibility">
                  {selectedTemplate?.name !== "Hackathon" && (
                    <Card>
                      <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Taille minimale de l'équipe</Label>
                            <Input
                              type="number"
                              value={currentProgram.eligibilityCriteria.minTeamSize}
                              onChange={(e) => setCurrentProgram(prev => ({
                                ...prev,
                                eligibilityCriteria: {
                                  ...prev.eligibilityCriteria,
                                  minTeamSize: parseInt(e.target.value)
                                }
                              }))} />
                          </div>
                          <div className="space-y-2">
                            <Label>Taille maximale de l'équipe</Label>
                            <Input
                              type="number"
                              value={currentProgram.eligibilityCriteria.maxTeamSize}
                              onChange={(e) => setCurrentProgram(prev => ({
                                ...prev,
                                eligibilityCriteria: {
                                  ...prev.eligibilityCriteria,
                                  maxTeamSize: parseInt(e.target.value)
                                }
                              }))}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Chiffre d'affaires minimum (USD)</Label>
                            <Input
                              type="number"
                              value={currentProgram.eligibilityCriteria.minRevenue}
                              onChange={(e) => setCurrentProgram(prev => ({
                                ...prev,
                                eligibilityCriteria: {
                                  ...prev.eligibilityCriteria,
                                  minRevenue: parseInt(e.target.value)
                                }
                              }))} />
                          </div>
                          <div className="space-y-2">
                            <Label>Chiffre d'affaires maximum (USD)</Label>
                            <Input
                              type="number"
                              value={currentProgram.eligibilityCriteria.maxRevenue}
                              onChange={(e) => setCurrentProgram(prev => ({
                                ...prev,
                                eligibilityCriteria: {
                                  ...prev.eligibilityCriteria,
                                  maxRevenue: parseInt(e.target.value)
                                }
                              }))}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Phases requises</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {["Pre-seed", "Seed", "Series A", "Series B", "Growth"].map((stage) => (
                              <div key={stage} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`stage-${stage}`}
                                  checked={currentProgram.eligibilityCriteria.requiredStages.includes(stage)}
                                  onCheckedChange={(checked) => {
                                    setCurrentProgram(prev => ({
                                      ...prev,
                                      eligibilityCriteria: {
                                        ...prev.eligibilityCriteria,
                                        requiredStages: checked
                                          ? [...prev.eligibilityCriteria.requiredStages, stage]
                                          : prev.eligibilityCriteria.requiredStages.filter(s => s !== stage)
                                      }
                                    }));
                                  }}
                                />
                                <Label htmlFor={`stage-${stage}`}>{stage}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Industries requises</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {["Technology", "Healthcare", "Fintech", "Social Impact", "Education", "Other"].map((industry) => (
                              <div key={industry} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`industry-${industry}`}
                                  checked={currentProgram.eligibilityCriteria.requiredIndustries.includes(industry)}
                                  onCheckedChange={(checked) => {
                                    setCurrentProgram(prev => ({
                                      ...prev,
                                      eligibilityCriteria: {
                                        ...prev.eligibilityCriteria,
                                        requiredIndustries: checked
                                          ? [...prev.eligibilityCriteria.requiredIndustries, industry]
                                          : prev.eligibilityCriteria.requiredIndustries.filter(i => i !== industry)
                                      }
                                    }));
                                  }}
                                />
                                <Label htmlFor={`industry-${industry}`}>{industry}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Documents requis</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {["Pitch Deck", "Financial Projections", "Team Bios", "Business Plan"].map((doc) => (
                              <div key={doc} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`doc-${doc}`}
                                  checked={currentProgram.eligibilityCriteria.requiredDocuments.includes(doc)}
                                  onCheckedChange={(checked) => {
                                    setCurrentProgram(prev => ({
                                      ...prev,
                                      eligibilityCriteria: {
                                        ...prev.eligibilityCriteria,
                                        requiredDocuments: checked
                                          ? [...prev.eligibilityCriteria.requiredDocuments, doc]
                                          : prev.eligibilityCriteria.requiredDocuments.filter(d => d !== doc)
                                      }
                                    }));
                                  }}
                                />
                                <Label htmlFor={`doc-${doc}`}>{doc}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
                <TabsContent value="mentors">
                  <Card>
                    <CardContent className="pt-6">
                    <MentorSelection
                        selectedMentors={currentProgram.mentors}
                        availableMentors={sampleMentors}
                        onMentorsChange={(mentors) => {
                          setCurrentProgram(prev => ({
                            ...prev,
                            mentors
                          }));
                          console.log('Updated mentors:', mentors);
                        }}
                      />
                    </CardContent>
                  </Card>
                  </TabsContent>
                </Tabs>
                </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Phases du programme</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Définissez les phases de votre programme.
                </p>
              </div>
              <Button onClick={() => setExpandedPhase(null)}>Tout réduire</Button>
            </div>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />

              {/* Phase cards */}
              <div className="space-y-4">
                {programPhases.map((phase, index) => (
                  <Card
                    key={phase.id}
                    className={`
                      ${expandedPhase === phase.id ? "border-blue-400" : ""}
                      relative z-10 transition-all duration-300 hover:shadow-md
                      ${expandedPhase === phase.id ? 'shadow-blue-100' : ''}
                    `}
                  >
                    <CardHeader
                      className="cursor-pointer flex flex-row justify-between items-center p-4"
                      onClick={() => setExpandedPhase(phase.id)}
                    >
                      <div className="flex items-center">
                        <div className={`
                          flex-shrink-0 w-6 h-6 rounded-full mr-4 flex items-center justify-center
                          ${expandedPhase === phase.id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}
                        `}>
                          {index + 1}
                        </div>
                        <div>
                          <CardTitle>{phase.name}</CardTitle>
                          <CardDescription>
                            {format(phase.startDate, 'MMM d, yyyy')} - {format(phase.endDate, 'MMM d, yyyy')}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePhase(phase.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          {expandedPhase === phase.id ?
                            <ChevronUp className="h-4 w-4" /> :
                            <ChevronDown className="h-4 w-4" />
                          }
                        </Button>
                      </div>
                    </CardHeader>

                    {expandedPhase === phase.id && (
                      <CardContent className="pb-4 ml-10">
                        <PhaseDetailView
                          phase={phase}
                          onUpdate={handleUpdatePhase}
                          isLastPhase={index === programPhases.length - 1}
                        />
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>

            {/* Add Phase Button */}
            <div className="flex justify-center">
              <Button
                className="w-full max-w-md"
                onClick={() => {
                  const newPhase = {
                    id: Date.now().toString(),
                    name: "New Phase",
                    description: "",
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    tasks: [],
                    meetings: [],
                    evaluationCriteria: [],
                    deliverables: [],
                    status: 'not_started' as const
                  };
                  setProgramPhases([...programPhases, newPhase]);
                  setExpandedPhase(newPhase.id);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Ajouter une phase
              </Button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Formulaire de candidature</h2>
              <p className="mt-1 text-sm text-gray-500">
                Personnalisez le formulaire de candidature pour votre programme.
              </p>
            </div>
            <ApplicationFormTabs
              defaultQuestions={applicationForm?.questions || []}
              defaultSettings={applicationForm?.settings || {}}
              onSave={(questions, settings) => {
                setApplicationForm({ questions, settings });
              }}
              programId={typeof currentProgram.id === 'string' ? parseInt(currentProgram.id) : (currentProgram.id || 0)}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Créer un programme</h1>
            <p className="text-gray-600 mt-2">
              Suivez les étapes ci-dessous pour créer un nouveau programme
            </p>
          </div>

          <div className="space-y-8">
            {renderStepContent()}

            <div className="flex justify-between mt-8">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={handlePreviousStep}
                >
                  Précédent
                </Button>
              )}
              <div className="flex space-x-4">
                {currentStep === 4 && (
                  <>
                    <Button
                      variant="outline"
                      onClick={saveDraft}
                    >
                      Enregistrer le brouillon
                    </Button>
                    <Button
                      variant="outline"
                      onClick={saveAsTemplate}
                    >
                      Enregistrer comme modèle
                    </Button>
                  </>
                )}
                <Button
                  onClick={() => {
                    if (currentStep === 4) {
                      createProgram({
                        ...currentProgram,
                        status: 'active'
                      });
                    } else {
                      handleNextStep();
                    }
                  }}
                >
                  {currentStep === 4 ? 'Créer le programme' : 'Suivant'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default CreateProgram;