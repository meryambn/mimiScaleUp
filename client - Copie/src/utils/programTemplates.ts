import { Program, SavedProgramTemplate } from "@/types/program";
import { v4 as uuidv4 } from 'uuid';

// Clé de stockage local pour les modèles de programme
const PROGRAM_TEMPLATES_STORAGE_KEY = 'program_templates';

/**
 * Récupère tous les modèles de programme enregistrés
 */
export const getSavedProgramTemplates = (): SavedProgramTemplate[] => {
  try {
    const templatesJson = localStorage.getItem(PROGRAM_TEMPLATES_STORAGE_KEY);
    if (!templatesJson) return [];
    return JSON.parse(templatesJson);
  } catch (error) {
    console.error('Error loading program templates:', error);
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

  // Récupérer les modèles existants
  const existingTemplates = getSavedProgramTemplates();

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
    const templates = getSavedProgramTemplates();
    const updatedTemplates = templates.filter(template => template.id !== templateId);
    localStorage.setItem(PROGRAM_TEMPLATES_STORAGE_KEY, JSON.stringify(updatedTemplates));
    return true;
  } catch (error) {
    console.error('Error deleting program template:', error);
    return false;
  }
};
