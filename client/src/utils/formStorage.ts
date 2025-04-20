// Utilitaire pour gérer le stockage et la récupération des formulaires de candidature

// Type pour les formulaires de candidature
export interface ApplicationForm {
  id: number;
  name: string;
  description: string;
  programId: number | string;
  formSchema?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  settings?: any;
  questions?: any[];
}

// Clé de stockage dans localStorage
const STORAGE_KEY = 'applicationForms';

// Sauvegarder un formulaire
export const saveForm = (form: ApplicationForm): ApplicationForm => {
  try {
    // Récupérer les formulaires existants
    const existingForms = getForms();

    // Vérifier si le formulaire existe déjà
    const existingIndex = existingForms.findIndex(f => f.id === form.id);

    if (existingIndex >= 0) {
      // Mettre à jour le formulaire existant
      existingForms[existingIndex] = form;
    } else {
      // Ajouter le nouveau formulaire
      existingForms.push(form);
    }

    // Sauvegarder dans localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingForms));
    console.log(`Formulaire ${form.id} sauvegardé avec succès. Total: ${existingForms.length} formulaires.`);

    // Déclencher un événement pour notifier les autres composants
    const event = new CustomEvent('application-form-updated', {
      detail: { form, action: existingIndex >= 0 ? 'update' : 'create' }
    });
    document.dispatchEvent(event);
    return form;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du formulaire:', error);
    throw error;
  }
};

// Récupérer tous les formulaires
export const getForms = (): ApplicationForm[] => {
  try {
    const storedForms = localStorage.getItem(STORAGE_KEY);
    return storedForms ? JSON.parse(storedForms) : [];
  } catch (error) {
    console.error('Erreur lors de la récupération des formulaires:', error);
    return [];
  }
};

// Récupérer les formulaires pour un programme spécifique
export const getFormsByProgram = (programId: number | string): ApplicationForm[] => {
  try {
    const allForms = getForms();

    // Filtrer les formulaires par programId
    return allForms.filter(form => {
      // Convertir les deux valeurs en chaînes pour la comparaison
      const formProgramId = String(form.programId);
      const targetProgramId = String(programId);

      return formProgramId === targetProgramId;
    });
  } catch (error) {
    console.error(`Erreur lors de la récupération des formulaires pour le programme ${programId}:`, error);
    return [];
  }
};

// Récupérer un formulaire par son ID
export const getFormById = (formId: number): ApplicationForm | undefined => {
  try {
    const allForms = getForms();
    return allForms.find(form => form.id === formId);
  } catch (error) {
    console.error(`Erreur lors de la récupération du formulaire ${formId}:`, error);
    return undefined;
  }
};

// Supprimer un formulaire
export const deleteForm = (formId: number): void => {
  try {
    const existingForms = getForms();
    const updatedForms = existingForms.filter(form => form.id !== formId);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedForms));
    console.log(`Formulaire ${formId} supprimé avec succès.`);

    // Déclencher un événement pour notifier les autres composants
    const event = new CustomEvent('application-form-updated', {
      detail: { formId, action: 'delete' }
    });
    document.dispatchEvent(event);
  } catch (error) {
    console.error(`Erreur lors de la suppression du formulaire ${formId}:`, error);
  }
};
