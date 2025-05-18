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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { API_BASE_URL } from "@/lib/constants";
// Note: teamService is imported dynamically to avoid circular dependencies
// import { Program } from "@shared/schema";
// Import directement depuis le chemin relatif pour éviter les problèmes de résolution de module
// No longer using localStorage utilities
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
  Loader2,
  AlertCircle,
  ArrowRight,
  UsersRound
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useProgramContext } from "@/context/ProgramContext";
import ApplicationSubmissionCard, { ApplicationSubmission } from "@/components/application/ApplicationSubmissionCard";
import ApplicationFormViewer from "@/components/application/ApplicationFormViewer";
import TeamCreationDialog from "@/components/application/TeamCreationDialog";
import { getFormWithQuestions, deleteForm, getSubmissionsByProgram } from "@/services/formService";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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



const ApplicationsPage = () => {
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
  const [backendFormData, setBackendFormData] = useState<any>(null);
  const [isLoadingBackendForm, setIsLoadingBackendForm] = useState<boolean>(false);
  const [backendFormError, setBackendFormError] = useState<string | null>(null);



  // Function to add a team to the program
  const handleAddTeamToProgram = async (submission: ApplicationSubmission) => {
    try {
      // Import the team service dynamically to avoid circular dependencies
      const { addSubmissionAsTeam } = await import('@/services/teamService');

      // Call the team service to add the submission as a team
      if (selectedProgramId) {
        await addSubmissionAsTeam(submission, selectedProgramId);
      } else {
        throw new Error("Aucun programme sélectionné");
      }

      // Update the submission status in the UI
      const updatedSubmissions = submissions.map(s =>
        s.id === submission.id ? { ...s, status: 'approved' as const } : s
      );
      setSubmissions(updatedSubmissions);

      // Show success message
      toast({
        title: "Équipe ajoutée au programme",
        description: `${submission.teamName} a été ajouté avec succès à ${selectedProgram?.name}.`,
      });

      // Refresh submissions from backend
      fetchSubmissionsFromBackend(selectedProgramId);
    } catch (error) {
      console.error("Error creating team:", error);
      toast({
        title: "Erreur lors de l'ajout de l'équipe",
        description: error instanceof Error ? error.message : "Échec de l'ajout de l'équipe au programme. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  // Create a direct function to fetch forms from the backend API
  const fetchApplicationForms = async () => {
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
      const response = await Promise.race([apiRequest('GET', '/api/application-forms'), timeoutPromise]);
      const data = await response.json();
      if (Array.isArray(data)) {
        apiForms = data;
        console.log('Successfully fetched forms from API:', apiForms.length);

        // Update the query cache with the API forms
        queryClient.setQueryData(['/api/application-forms'], apiForms);

        return apiForms;
      }
    } catch (apiError) {
      // Just log a warning and continue with cached data
      console.warn('Could not fetch forms from API, using cached data instead');
    }

    // If we couldn't fetch from the API, return the cached forms
    return cachedForms;
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

  // Fetch forms from backend when program is selected
  React.useEffect(() => {
    if (programId) {
      console.log('Program selected, fetching forms from backend API');
      fetchFormsFromBackend(programId)
        .then(backendForm => {
          if (backendForm) {
            console.log('Successfully fetched form from backend for program', programId);
            // Update the forms list with the backend form
            setLocalForms([backendForm]);
          }
        })
        .catch(error => {
          console.error('Error fetching forms from backend:', error);
        });
    }
  }, [programId]);

  // Create a query to fetch application forms from the backend
  const { isLoading: isFormsLoading } = useQuery<ApplicationFormResponse[], Error, ApplicationFormResponse[]>({
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

      // If we have a programId, try to fetch the form from the backend
      if (programId) {
        fetchFormsFromBackend(programId);
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

    // If we have a programId, try to fetch the form from the backend on initial load
    if (programId) {
      fetchFormsFromBackend(programId);
    }

    return () => {
      document.removeEventListener('application-form-updated', handleFormUpdated as EventListener);
      document.removeEventListener('formSaved', handleFormUpdated as EventListener);
    };
  }, [programId, toast]);

  // No longer loading forms from localStorage

  // No longer using localStorage or global store for forms

  // Call debug function on initial render
  // Set up event listener for application form creation and perform initialization
  React.useEffect(() => {
    console.log("%c APPLICATION PAGE LOADED - Check for forms", "background: purple; color: white; padding: 5px; font-size: 14px;");

    // Add form creation listener
    const handleFormCreated = (event: any) => {
      console.log("%c FORM CREATION EVENT RECEIVED!", "background: green; color: white; padding: 5px; font-size: 14px;");
      console.log("Event details:", event.detail);

      // If we have a programId, try to fetch the form from the backend
      if (programId && event.detail && event.detail.programId) {
        fetchFormsFromBackend(programId);
      }
    };

    // Add form update listener
    const handleFormUpdated = (event: any) => {
      console.log("%c FORM UPDATE EVENT RECEIVED!", "background: purple; color: white; padding: 5px; font-size: 14px;");
      console.log("Event details:", event.detail);

      // Invalidate React Query cache
      queryClient.invalidateQueries({queryKey: ['/api/application-forms']});
      if (event.detail && event.detail.programId) {
        queryClient.invalidateQueries({queryKey: ['/api/application-forms', event.detail.programId]});

        // If we have a programId, try to fetch the form from the backend
        if (programId) {
          fetchFormsFromBackend(programId);
        }
      }
    };

    document.addEventListener('application-form-created', handleFormCreated);
    document.addEventListener('application-form-updated', handleFormUpdated);

    // If we have a programId, try to fetch the form from the backend on initial load
    if (programId) {
      fetchFormsFromBackend(programId);
    }

    // Clean up event listeners
    return () => {
      document.removeEventListener('application-form-created', handleFormCreated);
      document.removeEventListener('application-form-updated', handleFormUpdated);
    };
  }, [programId, queryClient]);

  // No longer monitoring localStorage

  // Function to fetch forms from backend API
  const fetchFormsFromBackend = async (programId: string | number | null) => {
    if (!programId) return null;

    setIsLoadingBackendForm(true);
    setBackendFormError(null);

    try {
      const result = await getFormWithQuestions(programId);
      console.log('Forms fetched from backend API:', result);

      // Make sure we have questions at the top level
      if (!result.questions && result.formulaire && result.formulaire.questions) {
        console.log('Moving questions from formulaire to top level');
        result.questions = result.formulaire.questions;
      }

      // Check if there was an error
      if (result.error) {
        console.warn(`Backend form error: ${result.message}`);

        // Don't set error for "Formulaire introuvable" - this is expected after deletion
        if (result.message === "Formulaire introuvable") {
          console.log('No form found for this program - this is normal after deletion');
          // Clear any existing form data
          setBackendFormData(null);
          setLocalForms([]);
          return null;
        }

        // For other errors, show the error message
        setBackendFormError(result.message);
        toast({
          title: "Erreur de récupération du formulaire",
          description: result.message,
          variant: "destructive"
        });
        return null;
      }

      if (result && result.formulaire) {
        // Extract questions from the response
        let questions = [];
        if (result.questions && Array.isArray(result.questions)) {
          questions = result.questions;
        } else if (result.formulaire.questions && Array.isArray(result.formulaire.questions)) {
          questions = result.formulaire.questions;
        }

        console.log("Questions extracted from backend response in fetchFormsFromBackend:", questions);

        // Create a form object compatible with the application
        const backendForm: ApplicationFormResponse = {
          id: result.formulaire.id || Date.now(),
          name: result.formulaire.titre || "Formulaire de candidature",
          description: result.formulaire.description || "",
          programId: programId,
          questions: questions,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          settings: {
            title: result.formulaire.titre || "Formulaire de candidature",
            description: result.formulaire.description || "",
            submitButtonText: "Soumettre la candidature",
            showProgressBar: false,
            allowSaveDraft: false,
            confirmationMessage: result.formulaire.message_confirmation || "Merci pour votre candidature!"
          }
        };

        setBackendFormData(result);

        // Show success message
        toast({
          title: "Formulaire récupéré",
          description: "Le formulaire a été récupéré depuis le backend avec succès.",
        });

        return backendForm;
      }

      // If we get here, there was no error but also no form
      toast({
        title: "Aucun formulaire trouvé",
        description: "Aucun formulaire n'a été trouvé pour ce programme.",
      });

      return null;
    } catch (err) {
      console.error('Error fetching forms from backend:', err);
      setBackendFormError(err instanceof Error ? err.message : 'Erreur inconnue');
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la récupération du formulaire.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoadingBackendForm(false);
    }
  };

  // Program application forms filtering logic - only using backend data
  const programApplicationForms = React.useMemo(() => {
    // If we have a backend form already, use it
    if (programId && backendFormData && backendFormData.formulaire) {
      // Make sure we have questions at the top level
      if (!backendFormData.questions && backendFormData.formulaire && backendFormData.formulaire.questions) {
        console.log('Moving questions from formulaire to top level in programApplicationForms');
        backendFormData.questions = backendFormData.formulaire.questions;
      }

      // Extract questions from the response
      let questions = [];
      if (backendFormData.questions && Array.isArray(backendFormData.questions)) {
        questions = backendFormData.questions;
      } else if (backendFormData.formulaire.questions && Array.isArray(backendFormData.formulaire.questions)) {
        questions = backendFormData.formulaire.questions;
      }

      console.log("Questions extracted for programApplicationForms:", questions);

      const backendForm: ApplicationFormResponse = {
        id: backendFormData.formulaire.id || Date.now(),
        name: backendFormData.formulaire.titre || "Formulaire de candidature",
        description: backendFormData.formulaire.description || "",
        programId: programId,
        questions: questions,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        settings: {
          title: backendFormData.formulaire.titre || "Formulaire de candidature",
          description: backendFormData.formulaire.description || "",
          submitButtonText: "Soumettre la candidature",
          showProgressBar: false,
          allowSaveDraft: false,
          confirmationMessage: backendFormData.formulaire.message_confirmation || "Merci pour votre candidature!"
        }
      };
      console.log('Using existing backend form data');
      return [backendForm];
    }

    // If we don't have backend data yet, return empty array
    console.log('No backend forms available yet, returning empty array');
    return [];
  }, [programId, backendFormData]);

  // Submissions data from backend
  const [submissions, setSubmissions] = useState<ApplicationSubmission[]>([]);
  const [isSubmissionsLoading, setIsSubmissionsLoading] = useState<boolean>(false);

  // Function to fetch submissions from backend
  const fetchSubmissionsFromBackend = async (programId: string | number | null) => {
    if (!programId) return;

    setIsSubmissionsLoading(true);

    try {
      const result = await getSubmissionsByProgram(programId);
      console.log('Submissions fetched from backend API:', result);

      if (result.error) {
        toast({
          title: "Erreur de récupération des soumissions",
          description: result.message,
          variant: "destructive"
        });
        return;
      }

      if (result.submissions && Array.isArray(result.submissions)) {
        setSubmissions(result.submissions);
        toast({
          title: "Soumissions récupérées",
          description: `${result.submissions.length} soumissions récupérées avec succès.`,
        });
      } else {
        setSubmissions([]);
      }
    } catch (err) {
      console.error('Error fetching submissions from backend:', err);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la récupération des soumissions.",
        variant: "destructive"
      });
    } finally {
      setIsSubmissionsLoading(false);
    }
  };

  // Fetch submissions when program is selected
  React.useEffect(() => {
    if (programId) {
      console.log('Program selected, fetching submissions from backend API');
      fetchSubmissionsFromBackend(programId);
    }
  }, [programId]);

  // Use real data from backend
  const applicationSubmissions = submissions;

  // Filter submissions for the selected program
  const programApplicationSubmissions = React.useMemo(() => {
    if (!programId) return applicationSubmissions;
    return applicationSubmissions.filter(submission => {
      // Convertir les deux valeurs en chaînes pour la comparaison
      return String(submission.programId) === String(programId);
    });
  }, [applicationSubmissions, programId]);

  // Function to delete a form
  const handleDeleteForm = async (formId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce formulaire ?')) {
      setDeleteFormPending(true);

      try {
        // Get the program ID from the form
        const form = programApplicationForms.find(f => f.id === formId);
        if (!form) {
          throw new Error('Form not found');
        }

        // Use the programId from the form to delete it from the backend
        const programIdToDelete = form.programId;

        // Call the backend API to delete the form
        await deleteForm(programIdToDelete);

        // Invalidate the query cache to refresh the forms list
        queryClient.invalidateQueries({ queryKey: ['/api/application-forms'] });

        // Show success message
        toast({
          title: "Formulaire supprimé",
          description: "Le formulaire de candidature a été supprimé avec succès.",
        });

        // If we have a programId, refresh the forms for this program
        if (programId) {
          fetchFormsFromBackend(programId);

          // Redirect to the program page if we're not already there
          if (window.location.pathname.includes('/applications')) {
            setLocation(`/programs/${programId}`);
          }
        }
      } catch (error) {
        console.error('Error deleting form:', error);
        // Show error message
        toast({
          title: "Erreur de suppression",
          description: "Échec de la suppression du formulaire. Veuillez réessayer.",
          variant: "destructive",
        });
      } finally {
        setDeleteFormPending(false);
      }
    }
  };

  // The useEffect cleanup is already handled in the main useEffect above

  // FormPreview component that extracts just the "Aperçu" part from ApplicationFormTabs
  const FormPreview: React.FC<{ form: ApplicationFormResponse }> = ({ form }) => {
    console.log("FormPreview received form:", form);
    console.log("FormPreview form.questions:", form.questions);
    console.log("FormPreview backendFormData:", backendFormData);

    // Add state to track form responses
    const [formResponses, setFormResponses] = useState<Record<string, any>>({});

    const settings = form.settings || {
      title: form.name || "Formulaire de candidature",
      description: form.description || "Veuillez remplir ce formulaire pour postuler à notre programme.",
      submitButtonText: "Soumettre la candidature",
      showProgressBar: false,
      allowSaveDraft: false,
      confirmationMessage: "Merci pour votre candidature ! Nous l'examinerons et reviendrons vers vous bientôt.",
      notificationEmail: "",
      applicationFormLink: ""
    };

    // Handle both frontend and backend question formats
    let questions: any[] = [];

    // First check if we have backend form data
    if (backendFormData) {
      // Check if questions are at the top level
      if (backendFormData.questions && Array.isArray(backendFormData.questions)) {
        console.log("Using questions from backendFormData.questions:", backendFormData.questions);
        questions = backendFormData.questions;
      }
      // Check if questions are nested inside formulaire
      else if (backendFormData.formulaire && backendFormData.formulaire.questions && Array.isArray(backendFormData.formulaire.questions)) {
        console.log("Using questions from backendFormData.formulaire.questions:", backendFormData.formulaire.questions);
        questions = backendFormData.formulaire.questions;
      }
    }

    // If no backend questions, use the form's questions
    if (questions.length === 0 && form.questions && Array.isArray(form.questions)) {
      console.log("Using questions from form:", form.questions);
      questions = form.questions;
    }

    console.log("Final questions for preview:", questions);

    // Add more detailed debugging
    if (questions.length === 0) {
      console.warn("⚠️ No questions found for preview!");
      console.log("Form object structure:", JSON.stringify(form, null, 2));
      console.log("BackendFormData structure:", backendFormData ? JSON.stringify(backendFormData, null, 2) : "null");
    } else {
      console.log("✅ Questions found for preview:", questions.length);
      // Log the first question as an example
      if (questions[0]) {
        console.log("First question example:", JSON.stringify(questions[0], null, 2));
      }

      // Initialize form responses with default values for multiple choice questions
      React.useEffect(() => {
        const initialResponses: Record<string, any> = {};

        questions.forEach((question: any) => {
          const questionId = question.id || `question-${Math.random().toString(36).slice(2, 11)}`;

          // For multiple choice questions, initialize with empty array
          if (question.type === 'multiple_choice' ||
              question.type === 'Checkboxes' ||
              question.type === 'cases_a_cocher') {
            initialResponses[questionId] = [];
          }
        });

        if (Object.keys(initialResponses).length > 0) {
          setFormResponses(prev => ({...prev, ...initialResponses}));
        }
      }, [questions]);
    }

    // Handle form input changes
    const handleInputChange = (questionId: string | number, value: any) => {
      setFormResponses(prev => ({
        ...prev,
        [questionId]: value
      }));
    };

    // Handle checkbox changes (multiple choice)
    const handleCheckboxChange = (questionId: string | number, optionId: string | number, checked: boolean) => {
      setFormResponses(prev => {
        const currentValues = prev[questionId] || [];
        if (checked) {
          return {
            ...prev,
            [questionId]: [...currentValues, optionId]
          };
        } else {
          return {
            ...prev,
            [questionId]: currentValues.filter((id: string | number) => id !== optionId)
          };
        }
      });
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      console.log("Form responses:", formResponses);
      toast({
        title: "Formulaire soumis (simulation)",
        description: "Dans un environnement de production, ces données seraient envoyées au serveur.",
      });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow-sm rounded-lg border p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">{settings.title}</h3>
            <p className="text-gray-600">{settings.description}</p>
          </div>

          {questions.length > 0 ? (
            <div className="space-y-8">
              {questions.map((question: any, idx: number) => {
                // Handle both frontend and backend question formats
                const questionText = question.text || question.texte_question || "";
                const questionDesc = question.description || "";
                const isRequired = question.required || question.obligatoire || false;
                const questionId = question.id || `question-${idx}`;

                // Determine the question type (handle both frontend and backend formats)
                let questionType = question.type || "";

                // Map backend question types to frontend types for display
                if (questionType === "Single-Line" || questionType === "texte_court") {
                  questionType = "short_text";
                } else if (questionType === "Multi-Line" || questionType === "texte_long") {
                  questionType = "long_text";
                } else if (questionType === "Radio" || questionType === "boutons_radio" || questionType === "RadioButtons") {
                  questionType = "single_choice";
                } else if (questionType === "Checkbox" || questionType === "cases_a_cocher" || questionType === "Checkboxes") {
                  questionType = "multiple_choice";
                } else if (questionType === "Select" || questionType === "liste_deroulante" || questionType === "dropdown") {
                  questionType = "dropdown";
                } else if (questionType === "File" || questionType === "fichier" || questionType === "telechargement_fichier") {
                  questionType = "file_upload";
                } else if (questionType === "Rating" || questionType === "evaluation") {
                  questionType = "rating";
                }

                console.log(`Question type mapping: ${question.type} -> ${questionType}`);

                // Debug options if they exist
                if (question.options) {
                  console.log(`Question ${questionId} has options:`, question.options);
                } else if (question.option_text) {
                  console.log(`Question ${questionId} has option_text:`, question.option_text);
                  // Convert option_text to options array if it's a string
                  if (typeof question.option_text === 'string') {
                    try {
                      const parsedOptions = JSON.parse(question.option_text);
                      if (Array.isArray(parsedOptions)) {
                        question.options = parsedOptions;
                        console.log(`Converted option_text to options array:`, question.options);
                      }
                    } catch (e) {
                      // If parsing fails, create options from the string
                      question.options = [{ id: `option-1-${questionId}`, text: question.option_text }];
                    }
                  }
                } else if (question.question_options && Array.isArray(question.question_options)) {
                  // Handle backend format where options are in question_options
                  question.options = question.question_options.map((opt: any, idx: number) => ({
                    id: opt.id || `option-${idx}-${questionId}`,
                    text: opt.option_text || `Option ${idx + 1}`
                  }));
                  console.log(`Converted question_options to options array:`, question.options);
                } else if (questionType === "single_choice" || questionType === "multiple_choice" || questionType === "dropdown") {
                  // Create default options if none exist but the question type requires them
                  question.options = [
                    { id: `option-1-${questionId}`, text: "Option 1" },
                    { id: `option-2-${questionId}`, text: "Option 2" },
                    { id: `option-3-${questionId}`, text: "Option 3" }
                  ];
                  console.log(`Created default options for question ${questionId}:`, question.options);
                }

                return (
                  <div key={questionId} className="space-y-3">
                    <h4 className="text-md font-medium text-gray-800">
                      {idx + 1}. {questionText} {isRequired && <span className="text-red-500">*</span>}
                    </h4>
                    {questionDesc && (
                      <p className="text-sm text-gray-500">{questionDesc}</p>
                    )}
                    <div className="text-xs text-gray-500 mb-2">
                      Type: {questionType}
                    </div>

                  {questionType === "short_text" && (
                    <Input
                      placeholder="Réponse courte"
                      value={formResponses[questionId] || ""}
                      onChange={(e) => handleInputChange(questionId, e.target.value)}
                      required={isRequired}
                    />
                  )}

                  {questionType === "long_text" && (
                    <Textarea
                      placeholder="Réponse longue"
                      rows={3}
                      value={formResponses[questionId] || ""}
                      onChange={(e) => handleInputChange(questionId, e.target.value)}
                      required={isRequired}
                    />
                  )}

                  {questionType === "single_choice" && (
                    <div className="space-y-2">
                      {question.options ? (
                        // Frontend format
                        question.options.map((option: any, optIdx: number) => {
                          // Handle different option formats from backend and frontend
                          const optionId = option.id || option.value || `option-${optIdx}`;
                          const optionText = option.text || option.label || option.option_text || `Option ${optIdx + 1}`;

                          return (
                            <div key={optionId} className="flex items-center">
                              <input
                                type="radio"
                                id={`option-${questionId}-${optionId}`}
                                name={`question-${questionId}`}
                                value={optionId}
                                checked={formResponses[questionId] === optionId}
                                onChange={() => handleInputChange(questionId, optionId)}
                                className="mr-2 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                                required={isRequired && !formResponses[questionId]}
                              />
                              <Label
                                htmlFor={`option-${questionId}-${optionId}`}
                                className="text-sm font-medium text-gray-700"
                              >
                                {optionText}
                              </Label>
                            </div>
                          );
                        })
                      ) : (
                        // If no options are available
                        <div className="text-sm text-gray-500">Options non disponibles</div>
                      )}
                    </div>
                  )}

                  {questionType === "multiple_choice" && (
                    <div className="space-y-2">
                      {question.options ? (
                        // Frontend format
                        question.options.map((option: any, optIdx: number) => {
                          // Handle different option formats from backend and frontend
                          const optionId = option.id || option.value || `option-${optIdx}`;
                          const optionText = option.text || option.label || option.option_text || `Option ${optIdx + 1}`;

                          const isChecked = Array.isArray(formResponses[questionId]) &&
                                           formResponses[questionId].includes(optionId);

                          return (
                            <div key={optionId} className="flex items-center">
                              <input
                                type="checkbox"
                                id={`option-${questionId}-${optionId}`}
                                checked={isChecked}
                                onChange={(e) => handleCheckboxChange(questionId, optionId, e.target.checked)}
                                className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <Label
                                htmlFor={`option-${questionId}-${optionId}`}
                                className="text-sm font-medium text-gray-700"
                              >
                                {optionText}
                              </Label>
                            </div>
                          );
                        })
                      ) : (
                        // If no options are available
                        <div className="text-sm text-gray-500">Options non disponibles</div>
                      )}
                    </div>
                  )}

                  {questionType === "dropdown" && (
                    <div className="relative">
                      <select
                        className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={formResponses[questionId] || ""}
                        onChange={(e) => handleInputChange(questionId, e.target.value)}
                        required={isRequired}
                      >
                        <option value="">Sélectionnez une option</option>
                        {question.options ? (
                          // Handle different option formats from backend and frontend
                          question.options.map((option: any, optIdx: number) => {
                            const optionId = option.id || option.value || `option-${optIdx}`;
                            const optionText = option.text || option.label || option.option_text || `Option ${optIdx + 1}`;

                            return (
                              <option key={optionId} value={optionId}>
                                {optionText}
                              </option>
                            );
                          })
                        ) : (
                          <option value="" disabled>Options non disponibles</option>
                        )}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </div>
                    </div>
                  )}

                  {questionType === "file_upload" && (
                    <div className="border border-dashed border-gray-300 rounded-md p-4 text-center">
                      <label className="flex flex-col items-center justify-center cursor-pointer">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                          </svg>
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Cliquez pour télécharger</span> ou glissez-déposez
                          </p>
                          <p className="text-xs text-gray-500">
                            {formResponses[questionId] ? formResponses[questionId] : "SVG, PNG, JPG ou GIF (MAX. 800x400px)"}
                          </p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              handleInputChange(questionId, e.target.files[0].name);
                            }
                          }}
                          required={isRequired}
                        />
                      </label>
                    </div>
                  )}

                  {questionType === "rating" && (
                    <div className="flex space-x-2">
                      {Array.from({ length: (question.maxRating || 5) - (question.minRating || 1) + 1 }).map((_, i) => {
                        const ratingValue = (question.minRating || 1) + i;
                        return (
                          <button
                            type="button"
                            key={i}
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              formResponses[questionId] === ratingValue
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-500'
                            }`}
                            onClick={() => handleInputChange(questionId, ratingValue)}
                          >
                            {ratingValue}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Aucune question ajoutée pour l'instant</p>
              <p className="text-sm mt-2">Allez dans l'onglet Questions pour ajouter des questions au formulaire</p>
            </div>
          )}

          <div className="pt-4 border-t">
            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                border: 'none'
              }}
            >
              {settings.submitButtonText || "Soumettre la candidature"}
            </button>
          </div>
        </div>
      </form>
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
          ) : backendFormError && backendFormError !== "Formulaire introuvable" ? (
            <div className="text-center p-10">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium">Erreur de récupération du formulaire</h3>
              <p className="text-gray-500 mt-2">
                {backendFormError}
              </p>

              <p className="text-xs text-gray-400 mt-4">
                Affichage des formulaires en cache en attendant.
              </p>

              <div className="mt-6">
                <button
                  onClick={() => fetchFormsFromBackend(programId)}
                  style={{
                    backgroundColor: 'white',
                    color: '#0c4c80',
                    border: '1px solid #e5e7eb',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    margin: '0 auto'
                  }}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Réessayer
                </button>
              </div>
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

              <div className="mt-6">
                <button
                  onClick={() => setLocation(`/forms/create/${programId}`)}
                  style={{
                    background: 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    border: 'none',
                    margin: '0 auto'
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un formulaire
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {programApplicationForms.map((form: ApplicationFormResponse) => (
                <Card key={form.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{form.name}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="secondary">
                          Active
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>
                      {form.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    {(() => {
                      // Calculate submission count once
                      const submissionCount = programApplicationSubmissions.filter(submission =>
                        String(submission.formId) === String(form.id)
                      ).length;

                      return (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="h-4 w-4 mr-1" />
                          <span>
                            {submissionCount} {submissionCount <= 1 ? 'Soumission' : 'Soumissions'}
                          </span>
                        </div>
                      );
                    })()}
                  </CardContent>
                  <CardFooter className="flex flex-wrap gap-2 pt-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={async () => {
                          // Fetch the latest form data from the backend before showing preview
                          setIsLoadingBackendForm(true);
                          try {
                            const result = await getFormWithQuestions(form.programId);
                            if (result && !result.error && result.formulaire) {
                              // Make sure we have questions at the top level
                              if (!result.questions && result.formulaire && result.formulaire.questions) {
                                console.log('Moving questions from formulaire to top level in preview button');
                                result.questions = result.formulaire.questions;
                              }

                              setBackendFormData(result);
                              // Extract questions from the response
                              let questions = [];
                              if (result.questions && Array.isArray(result.questions)) {
                                questions = result.questions;
                              } else if (result.formulaire && result.formulaire.questions && Array.isArray(result.formulaire.questions)) {
                                questions = result.formulaire.questions;
                              }

                              console.log("Questions extracted for preview button:", questions);

                              // Create a form object compatible with the application
                              const backendForm: ApplicationFormResponse = {
                                ...form,
                                questions: questions
                              };
                              setPreviewForm(backendForm);
                            } else {
                              // If backend fetch fails, fall back to the form data we have
                              setPreviewForm(form);
                            }
                          } catch (err) {
                            console.error('Error fetching form for preview:', err);
                            // If there's an error, just use the form data we have
                            setPreviewForm(form);
                          } finally {
                            setIsLoadingBackendForm(false);
                          }
                        }}
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
                        Partager
                      </button>

                      <button
                        style={{ backgroundColor: 'transparent', color: '#e43e32', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.875rem' }}
                        onClick={() => handleDeleteForm(form.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Supprimer
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
            <p>Suppression du formulaire en cours...</p>
          </div>
        </div>
      )}

      {previewForm && (
        <Dialog open={!!previewForm} onOpenChange={() => setPreviewForm(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Aperçu du formulaire de candidature</DialogTitle>
              <DialogDescription>
                Voici comment le formulaire apparaîtra aux candidats
              </DialogDescription>
            </DialogHeader>

            {isLoadingBackendForm ? (
              <div className="flex justify-center items-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p>Chargement du formulaire...</p>
                </div>
              </div>
            ) : (
              <div className="py-4">
                {previewForm && <FormPreview form={previewForm} />}
              </div>
            )}

            <DialogFooter className="flex flex-wrap justify-between mt-4 gap-2">
              <div className="flex flex-wrap gap-2">
                {backendFormData && backendFormData.formulaire && backendFormData.formulaire.url_formulaire && (
                  <>
                    <button
                      onClick={() => window.open(backendFormData.formulaire.url_formulaire, '_blank')}
                      style={{ backgroundColor: 'white', color: '#0c4c80', border: '1px solid #e5e7eb', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <Link className="h-4 w-4 mr-2" />
                      Ouvrir le formulaire
                    </button>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(backendFormData.formulaire.url_formulaire)
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
                      style={{ backgroundColor: 'white', color: '#0c4c80', border: '1px solid #e5e7eb', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Partager
                    </button>
                  </>
                )}
              </div>

              <DialogClose asChild>
                <button
                  type="button"
                  style={{ background: 'linear-gradient(135deg, #e43e32 0%, #0c4c80 100%)', color: 'white', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', border: 'none' }}
                >
                  Fermer l'aperçu
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
        onCreateTeam={async (teamData) => {
          try {
            // Import the team service dynamically to avoid circular dependencies
            const { createTeam } = await import('@/services/teamService');

            // Call the team service to create a team
            if (selectedProgramId) {
              await createTeam(teamData, selectedProgramId);
            } else {
              throw new Error("Aucun programme sélectionné");
            }

            // Update the submission status in the UI for all team members
            const updatedSubmissions = submissions.map(s =>
              teamData.members.some(m => m.id === s.id) ? { ...s, status: 'approved' as const } : s
            );
            setSubmissions(updatedSubmissions);

            // No need to show invitation dialog in admin interface
            // Notifications will be sent to team members automatically

            // Show success message
            toast({
              title: "Équipe créée avec succès",
              description: `${teamData.name} a été créée avec ${teamData.members.length} membres.`,
            });

            // Refresh submissions from backend
            fetchSubmissionsFromBackend(selectedProgramId);
          } catch (error) {
            console.error("Error creating team:", error);
            toast({
              title: "Erreur lors de la création de l'équipe",
              description: error instanceof Error ? error.message : "Échec de la création de l'équipe. Veuillez réessayer.",
              variant: "destructive",
            });
          }
        }}
      />

      {/* Team Invitation Notification removed - notifications will be shown in user interfaces */}

    </div>
  );
};

export default ApplicationsPage;