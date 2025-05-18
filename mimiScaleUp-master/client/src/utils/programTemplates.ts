import { Program, SavedProgramTemplate } from "@/types/program";
import { v4 as uuidv4 } from 'uuid';

// Clé de stockage local pour les modèles de programme
const PROGRAM_TEMPLATES_STORAGE_KEY = 'program_templates';

/**
 * Récupère tous les modèles de programme enregistrés
 * Combine les modèles du localStorage et ceux du backend
 */
export const getSavedProgramTemplates = async (): Promise<SavedProgramTemplate[]> => {
  try {
    // Get templates from localStorage
    const templatesJson = localStorage.getItem(PROGRAM_TEMPLATES_STORAGE_KEY);
    const localTemplates = templatesJson ? JSON.parse(templatesJson) : [];

    // Get templates from backend API
    let backendTemplates: SavedProgramTemplate[] = [];
    try {
      const response = await fetch('/api/programmes/templates', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          // Map backend templates to SavedProgramTemplate format
          backendTemplates = data.map(program => ({
            id: String(program.id),
            name: program.nom,
            description: program.description,
            programData: {
              name: program.nom,
              description: program.description,
              startDate: program.date_debut,
              endDate: program.date_fin,
              phases: [],
              evaluationCriteria: [],
              eligibilityCriteria: {
                minTeamSize: program.taille_equipe_min || 1,
                maxTeamSize: program.taille_equipe_max || 5,
                requiredStages: program.phases_requises || [],
                requiredIndustries: program.industries_requises || [],
                minRevenue: program.ca_min || 0,
                maxRevenue: program.ca_max || 1000000,
                requiredDocuments: program.documents_requis || []
              },
              dashboardWidgets: [],
              mentors: program.mentors || [],
              status: 'draft',
              hasWinner: false
            },
            createdAt: new Date().toISOString(),
            isBackendTemplate: true // Flag to identify backend templates
          }));
        }
      }
    } catch (apiError) {
      console.error('Error fetching templates from API:', apiError);
    }

    // Combine templates, preferring backend templates if there are duplicates by ID
    const combinedTemplates = [...localTemplates];

    // Add backend templates that don't exist in local templates
    backendTemplates.forEach(backendTemplate => {
      const existsInLocal = combinedTemplates.some(localTemplate =>
        localTemplate.id === backendTemplate.id
      );

      if (!existsInLocal) {
        combinedTemplates.push(backendTemplate);
      }
    });

    return combinedTemplates;
  } catch (error) {
    console.error('Error loading program templates:', error);
    return [];
  }
};

/**
 * Synchronous version that only returns localStorage templates
 * Used when async operation is not possible
 */
export const getLocalProgramTemplates = (): SavedProgramTemplate[] => {
  try {
    const templatesJson = localStorage.getItem(PROGRAM_TEMPLATES_STORAGE_KEY);
    if (!templatesJson) return [];
    return JSON.parse(templatesJson);
  } catch (error) {
    console.error('Error loading local program templates:', error);
    return [];
  }
};

/**
 * Enregistre un programme comme modèle
 */
export const saveProgramAsTemplate = (
  program: Program,
  templateName: string,
  templateDescription: string
): SavedProgramTemplate => {
  // Créer un nouvel objet de modèle
  const newTemplate: SavedProgramTemplate = {
    id: uuidv4(),
    name: templateName,
    description: templateDescription,
    programData: {
      name: program.name,
      description: program.description,
      startDate: program.startDate,
      endDate: program.endDate,
      phases: program.phases || [],
      evaluationCriteria: program.evaluationCriteria || [],
      eligibilityCriteria: program.eligibilityCriteria || {
        minTeamSize: 1,
        maxTeamSize: 5,
        requiredStages: [],
        requiredIndustries: [],
        minRevenue: 0,
        maxRevenue: 1000000,
        requiredDocuments: []
      },
      dashboardWidgets: program.dashboardWidgets || [],
      mentors: program.mentors || [],
      status: 'draft',
      hasWinner: program.hasWinner || false
    },
    createdAt: new Date().toISOString()
  };

  // Récupérer les modèles existants (using synchronous version)
  const existingTemplates = getLocalProgramTemplates();

  // Ajouter le nouveau modèle
  const updatedTemplates = [...existingTemplates, newTemplate];

  // Enregistrer dans le stockage local
  localStorage.setItem(PROGRAM_TEMPLATES_STORAGE_KEY, JSON.stringify(updatedTemplates));

  return newTemplate;
};

/**
 * Supprime un modèle de programme
 */
export const deleteProgramTemplate = (templateId: string): boolean => {
  try {
    // Only delete from localStorage - backend templates should be deleted via API
    const templates = getLocalProgramTemplates();
    const updatedTemplates = templates.filter((template: SavedProgramTemplate) => template.id !== templateId);
    localStorage.setItem(PROGRAM_TEMPLATES_STORAGE_KEY, JSON.stringify(updatedTemplates));
    return true;
  } catch (error) {
    console.error('Error deleting program template:', error);
    return false;
  }
};

/**
 * Supprime un modèle de programme du backend
 */
export const deleteBackendProgramTemplate = async (templateId: string): Promise<boolean> => {
  try {
    // Call the backend API to delete the template
    const response = await fetch(`/api/programmes/${templateId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    return response.ok;
  } catch (error) {
    console.error('Error deleting backend program template:', error);
    return false;
  }
};
