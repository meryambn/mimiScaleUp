// Utilitaire pour le stockage direct des formulaires et autres données
import { InsertApplicationForm } from "@shared/schema";
import { ApplicationForm } from "./formStorage";

// Utiliser la même clé de stockage que dans formStorage.ts
const STORAGE_KEY = 'applicationForms';

// Sauvegarder un formulaire directement
export const saveFormDirect = (formData: InsertApplicationForm, programId: number | string): ApplicationForm => {
  try {
    // Créer un nouvel objet de formulaire complet
    const newForm: ApplicationForm = {
      id: Date.now(),
      name: formData.name as string,
      description: formData.description as string,
      programId: programId, // Utiliser l'ID original sans conversion
      formSchema: formData.formSchema,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: Array.isArray(formData.questions) ? formData.questions : [],
      settings: formData.settings
    };

    // Récupérer les formulaires existants
    let existingForms: ApplicationForm[] = [];
    const storedForms = localStorage.getItem(STORAGE_KEY);

    if (storedForms) {
      existingForms = JSON.parse(storedForms);
    }

    // Ajouter le nouveau formulaire
    existingForms.push(newForm);

    // Sauvegarder dans localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingForms));

    // Déclencher un événement pour notifier les autres composants
    const event = new CustomEvent('application-form-updated', {
      detail: { form: newForm, action: 'create', programId: programId }
    });
    document.dispatchEvent(event);

    // Déclencher également l'événement application-form-created pour la rétrocompatibilité
    const legacyEvent = new CustomEvent('application-form-created', {
      detail: { form: newForm, programId: programId }
    });
    document.dispatchEvent(legacyEvent);

    return newForm;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du formulaire:', error);
    throw error;
  }
};

// Récupérer tous les formulaires directement
export const getAllFormsDirect = (): ApplicationForm[] => {
  try {
    const storedForms = localStorage.getItem(STORAGE_KEY);
    return storedForms ? JSON.parse(storedForms) : [];
  } catch (error) {
    console.error('Erreur lors de la récupération des formulaires:', error);
    return [];
  }
};

// Récupérer les formulaires pour un programme spécifique
export const getFormsByProgramDirect = (programId: number | string): ApplicationForm[] => {
  try {
    const allForms = getAllFormsDirect();

    // Vérifier si le programId est un UUID (chaîne de caractères avec des tirets)
    const isUuid = typeof programId === 'string' && programId.includes('-');

    const filteredForms = allForms.filter(form => {
      let match = false;

      if (isUuid) {
        // Si le programId est un UUID, faire une comparaison de chaînes
        match = String(form.programId) === String(programId);
      } else {
        // Sinon, faire une comparaison numérique
        const targetProgramIdNum = Number(programId);
        const formProgramIdNum = Number(form.programId);
        match = formProgramIdNum === targetProgramIdNum;
      }

      return match;
    });
    return filteredForms;
  } catch (error) {
    console.error(`Erreur lors de la récupération des formulaires pour le programme ${programId}:`, error);
    return [];
  }
};

// Vérifier et réparer le stockage local si nécessaire
export const checkAndRepairStorage = (): void => {
  try {
    // Vérifier si le stockage local existe
    const storedForms = localStorage.getItem(STORAGE_KEY);
    let forms: ApplicationForm[] = [];

    if (storedForms) {
      try {
        forms = JSON.parse(storedForms);
      } catch (parseError) {
        console.error("Erreur lors de l'analyse des formulaires:", parseError);
        forms = [];
      }
    }

    // Vérifier si le tableau est valide
    if (!Array.isArray(forms)) {
      forms = [];
    }

    // Si aucun formulaire n'est trouvé, créer un formulaire de test
    if (forms.length === 0) {

      // Créer un formulaire de test avec un programId normalisé (nombre)
      const testForm: ApplicationForm = {
        id: Date.now(),
        name: `Formulaire de test - ${new Date().toLocaleTimeString()}`,
        description: "Formulaire créé automatiquement pour tester l'application",
        programId: 1, // Programme par défaut (déjà un nombre)
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
          title: "Formulaire de test",
          description: "Ce formulaire est créé automatiquement pour tester l'application",
          submitButtonText: "Soumettre",
          showProgressBar: true,
          allowSaveDraft: true,
          confirmationMessage: "Merci pour votre candidature!"
        }
      };

      forms.push(testForm);

      // Sauvegarder dans localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(forms));

      // Déclencher un événement pour notifier les autres composants
      const event = new CustomEvent('application-form-updated', {
        detail: { form: testForm, action: 'create' }
      });
      document.dispatchEvent(event);
    }
  } catch (error) {
    console.error("Erreur lors de la vérification et réparation du stockage local:", error);
  }
};

// Créer un formulaire de test (pour le développement)
export const createTestFormDirect = (programId: number | string): ApplicationForm => {
  const testForm: ApplicationForm = {
    id: Date.now(),
    name: `Formulaire de test AUTO - ${new Date().toLocaleTimeString()}`,
    description: "Formulaire créé automatiquement pour tester l'application",
    programId: programId, // Utiliser l'ID original sans conversion
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
      title: "Formulaire de test",
      description: "Ce formulaire est créé automatiquement pour tester l'application",
      submitButtonText: "Soumettre",
      showProgressBar: true,
      allowSaveDraft: true,
      confirmationMessage: "Merci pour votre candidature!"
    }
  };

  return saveFormDirect({
    name: testForm.name,
    description: testForm.description,
    programId: programId,
    questions: testForm.questions,
    settings: testForm.settings
  }, programId);
};
