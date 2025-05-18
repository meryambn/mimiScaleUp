import { API_BASE_URL } from '@/lib/constants';
import { FormQuestion, QuestionType } from '@/components/application/SimpleApplicationFormBuilder';
import { FormSettings } from '@/components/application/ApplicationFormTabs';

// Type mapping from frontend to backend
const questionTypeMapping: Record<QuestionType, string> = {
  short_text: 'Single-Line',
  long_text: 'Multi-Line',
  single_choice: 'RadioButtons',
  multiple_choice: 'Checkboxes',
  dropdown: 'liste_deroulante',
  file_upload: 'telechargement_fichier',
  rating: 'evaluation'
};

// Interface for form creation request
export interface CreateFormRequest {
  titre: string;
  url_formulaire: string; // Keep as url_formulaire to match backend
  description?: string;
  message_confirmation?: string;
  programme_id: number | string;
}

// Interface for form creation response
export interface CreateFormResponse {
  message: string;
  id?: number;
}

// Interface for question creation request
export interface CreateQuestionRequest {
  texte_question: string;
  description?: string;
  type: string;
  obligatoire: boolean;
  programmeid?: number | string; // Added programmeid field
  options?: { text: string }[];
  evaluation_min?: number;
  evaluation_max?: number;
}

// Interface for question creation response
export interface CreateQuestionResponse {
  message: string;
  id?: number;
}

/**
 * Create a form for a program
 * @param programId The ID of the program
 * @param formData The form data to create
 * @returns A promise with the success message and form ID
 */
export async function createForm(programId: number | string, formData: Omit<CreateFormRequest, 'programme_id'>): Promise<CreateFormResponse> {
  try {
    // Add the programme_id to the form data
    const completeFormData: CreateFormRequest = {
      ...formData,
      programme_id: programId
    };

    console.log(`Creating form for program ${programId}:`, completeFormData);

    // Check if a form already exists for this program
    try {
      const checkResponse = await fetch(`${API_BASE_URL}/form/programmes/${programId}/form`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (checkResponse.ok) {
        const existingForm = await checkResponse.json();
        console.log('Found existing form for program:', existingForm);
        return { message: 'Form already exists', id: existingForm.formulaire?.id };
      }
    } catch (error) {
      console.log('No existing form found, creating new one');
    }

    const response = await fetch(`${API_BASE_URL}/form/create/${programId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(completeFormData),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error creating form:', errorData);
      throw new Error(errorData.error || 'Failed to create form');
    }

    const result = await response.json();
    console.log('Form created successfully:', result);
    return result;
  } catch (error) {
    console.error('Error in createForm:', error);
    throw error;
  }
}

/**
 * Create a question for a program
 * @param programId The ID of the program
 * @param questionData The question data to create
 * @returns A promise with the success message and question ID
 */
export async function createQuestion(programId: number | string, questionData: Omit<CreateQuestionRequest, 'programmeid'>): Promise<CreateQuestionResponse> {
  try {
    // Add the programmeid to the question data
    const completeQuestionData: CreateQuestionRequest = {
      ...questionData,
      programmeid: programId
    };

    console.log(`Creating question for program ${programId}:`, completeQuestionData);

    // Map question type to backend expected format
    const mappedType = questionData.type;

    // Prepare options if needed
    let options = questionData.options;
    if (mappedType === 'RadioButtons' || mappedType === 'Checkboxes' || mappedType === 'liste_deroulante') {
      if (!options || options.length === 0) {
        // Add default options if none provided for these types
        options = [{ text: 'Option 1' }, { text: 'Option 2' }];
      }
    }

    // Ensure evaluation_min and evaluation_max are set for evaluation type
    let evaluation_min = questionData.evaluation_min;
    let evaluation_max = questionData.evaluation_max;

    if (mappedType === 'evaluation') {
      // Set default values if not provided or invalid
      if (evaluation_min === undefined || isNaN(evaluation_min)) {
        evaluation_min = 1;
        console.log('Setting default evaluation_min to 1 (was undefined or NaN)');
      }

      if (evaluation_max === undefined || isNaN(evaluation_max)) {
        evaluation_max = 5;
        console.log('Setting default evaluation_max to 5 (was undefined or NaN)');
      }

      // Convert to numbers to ensure they're valid
      evaluation_min = Number(evaluation_min);
      evaluation_max = Number(evaluation_max);

      // Final check to ensure they're valid numbers
      if (isNaN(evaluation_min)) evaluation_min = 1;
      if (isNaN(evaluation_max)) evaluation_max = 5;

      // Ensure min is less than max
      if (evaluation_min >= evaluation_max) {
        console.warn('evaluation_min must be less than evaluation_max, adjusting values');
        evaluation_min = 1;
        evaluation_max = 5;
      }

      console.log(`Final evaluation values: min=${evaluation_min}, max=${evaluation_max}`);
    }

    const response = await fetch(`${API_BASE_URL}/question/create/${programId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        ...completeQuestionData,
        options: options,
        evaluation_min: evaluation_min,
        evaluation_max: evaluation_max
      }),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error creating question:', errorData);
      throw new Error(errorData.error || 'Failed to create question');
    }

    const result = await response.json();
    console.log('Question created successfully:', result);
    return result;
  } catch (error) {
    console.error('Error in createQuestion:', error);
    throw error;
  }
}

/**
 * Create a form with questions for a program
 * @param programId The ID of the program
 * @param formTitle The title of the form
 * @param formDescription The description of the form
 * @param questions The questions for the form
 * @param settings The form settings
 * @returns A promise with the success message and form ID
 */
export async function createFormWithQuestions(
  programId: number | string,
  formTitle: string,
  formDescription: string,
  questions: FormQuestion[],
  settings: FormSettings
): Promise<{ formId: number; success: boolean }> {
  try {
    // Check if programId is valid (not 0 or undefined)
    if (!programId || programId === 0) {
      console.error('Invalid program ID for form creation:', programId);
      return {
        formId: 0,
        success: false
      };
    }

    // Generate a unique URL for the form using the correct format
    const formUrl = `${window.location.origin}/apply/${programId}`;

    // Create the form first
    const formData = {
      titre: formTitle,
      url_formulaire: formUrl, // Keep as url_formulaire to match backend
      description: formDescription,
      message_confirmation: settings.confirmationMessage
    };

    console.log('Creating form with data:', formData);

    let formResponse;
    try {
      formResponse = await createForm(programId, formData);
      console.log('Form creation response:', formResponse);
    } catch (formError) {
      console.error('Error creating form:', formError);
      // If we can't create the form, don't try to create questions
      return {
        formId: 0,
        success: false
      };
    }

    // Now create each question
    let createdQuestions = 0;
    for (const question of questions) {
      try {
        // Prepare question data
        let minRating = question.minRating;
        let maxRating = question.maxRating;

        // Set default values for rating questions
        if (question.type === 'rating') {
          // Set default values if not provided or invalid
          if (minRating === undefined || isNaN(minRating)) {
            minRating = 1;
            console.log(`Setting default minRating to 1 for question ${question.id} (was undefined or NaN)`);
          }

          if (maxRating === undefined || isNaN(maxRating)) {
            maxRating = 5;
            console.log(`Setting default maxRating to 5 for question ${question.id} (was undefined or NaN)`);
          }

          // Convert to numbers to ensure they're valid
          minRating = Number(minRating);
          maxRating = Number(maxRating);

          // Final check to ensure they're valid numbers
          if (isNaN(minRating)) minRating = 1;
          if (isNaN(maxRating)) maxRating = 5;

          // Ensure min is less than max
          if (minRating >= maxRating) {
            console.warn(`minRating must be less than maxRating for question ${question.id}, adjusting values`);
            minRating = 1;
            maxRating = 5;
          }

          console.log(`Final rating values for question ${question.id}: min=${minRating}, max=${maxRating}`);
        }

        const questionData = {
          texte_question: question.text,
          description: question.description,
          type: questionTypeMapping[question.type],
          obligatoire: question.required,
          options: question.options?.map(opt => ({ text: opt.text })),
          evaluation_min: minRating,
          evaluation_max: maxRating
        };

        await createQuestion(programId, questionData);
        createdQuestions++;
      } catch (questionError) {
        console.error(`Error creating question ${question.id}:`, questionError);
        // Continue with other questions even if one fails
      }
    }

    console.log(`Created ${createdQuestions} out of ${questions.length} questions`);

    return {
      formId: formResponse.id || 0,
      success: true
    };
  } catch (error) {
    console.error('Error in createFormWithQuestions:', error);
    // Return a failure object instead of throwing
    return {
      formId: 0,
      success: false
    };
  }
}

/**
 * Get a form with its questions for a program
 * @param programId The ID of the program
 * @returns A promise with the form and its questions
 */
export async function getFormWithQuestions(programId: number | string) {
  try {
    console.log(`Fetching form for program ID: ${programId}`);

    const response = await fetch(`${API_BASE_URL}/form/programmes/${programId}/form`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    // Log the raw response for debugging
    console.log(`Form API response status: ${response.status}`);

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Non-JSON response received:', await response.text());
      return {
        error: true,
        message: 'Le serveur a retourné une réponse non-JSON',
        formulaire: null,
        questions: []
      };
    }

    const result = await response.json();

    if (!response.ok) {
      console.error('Error getting form:', result);
      return {
        error: true,
        message: result.error || 'Échec de récupération du formulaire',
        formulaire: null,
        questions: []
      };
    }

    // Handle the specific "Question is not defined" error
    if (result.error && result.error.includes("Question is not defined")) {
      console.warn('Backend returned "Question is not defined" error - this might be a backend issue');
      // Try to return a valid structure even with this error
      return {
        error: false,
        message: '',
        formulaire: result.formulaire || null,
        questions: []  // Return empty questions array since questions couldn't be loaded
      };
    }

    // Check if the result has the expected structure
    if (!result.formulaire) {
      console.warn('Form API returned unexpected structure:', result);
      return {
        error: true,
        message: 'Structure de formulaire inattendue',
        formulaire: null,
        questions: []
      };
    }

    // Check if we need to extract questions from the response
    if (!result.questions && result.formulaire) {
      // Try to get questions from the formulaire object
      const formulaireObj = result.formulaire;

      // Check if questions are in the formulaire object
      if (formulaireObj.questions && Array.isArray(formulaireObj.questions)) {
        console.log('Found questions in formulaire object, moving to top level');
        result.questions = formulaireObj.questions;
      } else {
        console.warn('No questions found in response or formulaire object');
        // Initialize an empty questions array
        result.questions = [];
      }
    }

    console.log('Form retrieved successfully:', result);

    // Debug the structure of the response
    console.log('Form structure details:');
    console.log('- Has formulaire:', !!result.formulaire);
    if (result.formulaire) {
      console.log('- formulaire properties:', Object.keys(result.formulaire));
      console.log('- Has formulaire.questions:', !!result.formulaire.questions);
      if (result.formulaire.questions) {
        console.log('- formulaire.questions is array:', Array.isArray(result.formulaire.questions));
        console.log('- formulaire.questions length:', result.formulaire.questions.length);
      }
    }
    console.log('- Has questions at top level:', !!result.questions);
    if (result.questions) {
      console.log('- questions is array:', Array.isArray(result.questions));
      console.log('- questions length:', result.questions.length);
    }

    return result;
  } catch (error) {
    console.error('Error in getFormWithQuestions:', error);
    // Return an error object instead of throwing
    return {
      error: true,
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      formulaire: null,
      questions: []
    };
  }
}

/**
 * Delete a form and its questions for a program
 * @param programId The ID of the program
 * @returns A promise with the success message
 */
export async function deleteForm(programId: number | string): Promise<{ message: string }> {
  try {
    console.log(`Deleting form for program ${programId}`);

    const response = await fetch(`${API_BASE_URL}/form/delete/${programId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error deleting form:', errorData);
      throw new Error(errorData.error || 'Failed to delete form');
    }

    const result = await response.json();
    console.log('Form deleted successfully:', result);
    return result;
  } catch (error) {
    console.error('Error in deleteForm:', error);
    throw error;
  }
}

/**
 * Get all submissions for a program
 * @param programId The ID of the program
 * @returns A promise with the submissions for the program
 */
export async function getSubmissionsByProgram(programId: number | string) {
  try {
    console.log(`Fetching submissions for program ID: ${programId}`);

    // Utiliser l'URL relative avec API_BASE_URL pour être cohérent avec les autres appels
    const response = await fetch(`${API_BASE_URL}/soum/programme/${programId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    // Log the raw response for debugging
    console.log(`Submissions API response status: ${response.status}`);

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Non-JSON response received:', await response.text());
      return {
        error: true,
        message: 'Le serveur a retourné une réponse non-JSON',
        submissions: []
      };
    }

    const result = await response.json();

    if (!response.ok) {
      console.error('Error getting submissions:', result);
      return {
        error: true,
        message: result.error || 'Échec de récupération des soumissions',
        submissions: []
      };
    }

    console.log('Submissions retrieved successfully:', result);
    return {
      error: false,
      message: '',
      submissions: result
    };
  } catch (error) {
    console.error('Error in getSubmissionsByProgram:', error);
    // Return an error object instead of throwing
    return {
      error: true,
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      submissions: []
    };
  }
}
