// We're using fetch directly instead of apiRequest for better error handling

// Define interfaces for the program data
export interface CreateProgramRequest {
  type: string;
  nom: string;
  description: string;
  date_debut: string;
  date_fin: string;
  phases_requises: string[];
  industries_requises: string[];
  documents_requis: string[];
  taille_equipe_min: number;
  taille_equipe_max: number;
  ca_min: number;
  ca_max: number;
  admin_id?: number;
  status?: string;
  is_template?: string;
  backendStatus?: string; // Added for status mapping
}

export interface CreateProgramResponse {
  id: number;
  message: string;
}

export interface AddMentorRequest {
  mentorId: number;
}

export interface AddMentorResponse {
  message: string;
}

export interface CreatePhaseRequest {
  nom: string;
  description: string;
  date_debut: string;
  date_fin: string;
  gagnant: boolean;
}

export interface CreatePhaseResponse {
  message: string;
}

export interface CreateTaskRequest {
  nom: string;
  description: string;
  date_decheance: string;
}

export interface CreateTaskResponse {
  message: string;
}

export interface CreateReunionRequest {
  nom_reunion: string;
  date: string;
  heure: string;
  lieu: string;
}

export interface CreateReunionResponse {
  message: string;
}

export interface CreateCritereRequest {
  nom_critere: string;
  type: string; // 'numerique', 'etoiles', 'oui_non', 'liste_deroulante'
  poids: number;
  accessible_mentors: boolean;
  accessible_equipes: boolean;
  rempli_par: string;
  necessite_validation: boolean;
  phase_id?: number | string; // Optional phase_id field
}

export interface CreateCritereResponse {
  message: string;
}

export interface CreateLivrableRequest {
  nom: string;
  description: string;
  date_echeance: string;
  types_fichiers: string[] | string; // Array of file extensions or comma-separated string
}

export interface CreateLivrableResponse {
  message: string;
}

export interface UpdateProgramStatusRequest {
  status: string;
  is_template?: string;
}

export interface UpdateProgramStatusResponse {
  message: string;
  programme: any;
}

// Base URL for the API
// Using relative URL to leverage Vite's proxy
import { API_BASE_URL } from '@/lib/constants';
import { mapToBackendStatus, FrontendStatus } from '@/utils/statusMapping';

// Base URL for the API endpoints

// Valid phase types in the backend (commented out for now)
// const validPhaseTypes = ["Pre-seed", "Seed", "Series A", "Series B", "Series C", "Growth"];

// Translation map for phase types (French to English)
const phaseTranslations: Record<string, string> = {
  "Pré-amorçage": "Pre-seed",
  "Amorçage": "Seed",
  "Series A": "Series A",
  "Series B": "Series B",
  "Series C": "Series C",
  "Croissance": "Growth",
  "Expansion": "Growth", // Map to a valid type
  "Maturité": "Growth", // Map to a valid type
  "MVP": "Pre-seed", // Map to a valid type
  "Idéation": "Pre-seed", // Map to a valid type
  "Prototype": "Pre-seed", // Map to a valid type
  "Validation": "Seed", // Map to a valid type
  "Scaling": "Growth" // Map to a valid type
};

// Valid industry types in the backend (commented out for now)
// const validIndustryTypes = ["Technology", "Healthcare", "Fintech", "Education", "Retail", "Food", "Transportation", "Energy", "Real Estate", "Media", "Social Impact"];

// Translation map for industries (French to English)
const industryTranslations: Record<string, string> = {
  "Technologie": "Technology",
  "Santé": "Healthcare",
  "Fintech": "Fintech",
  "Éducation": "Education",
  "Commerce": "Retail",
  "Alimentation": "Food",
  "Transport": "Transportation",
  "Énergie": "Energy",
  "Immobilier": "Real Estate",
  "Médias": "Media",
  "Impact social": "Social Impact",
  "Logiciel d'entreprise": "Technology", // Map to a valid type
  "Industrie 4.0": "Technology", // Map to a valid type
  "Analyse de données": "Technology" // Map to a valid type
};

// Valid document types in the backend (commented out for now)
// const validDocumentTypes = ["Pitch Deck", "Financial Projections", "Team Bios", "Business Plan", "Prototype", "Demo", "References"];

// Translation map for documents (French to English)
const documentTranslations: Record<string, string> = {
  "Présentation": "Pitch Deck",
  "Projections financières": "Financial Projections",
  "Biographies de l'équipe": "Team Bios",
  "Business Plan": "Business Plan",
  "Prototype": "Prototype",
  "Démonstration": "Demo",
  "Références": "References",
  "Résumé de la solution": "Pitch Deck", // Map to a valid type
  "Profil de l'entreprise": "Team Bios", // Map to a valid type
  "Plan de mise en œuvre": "Business Plan" // Map to a valid type
};

/**
 * Create a new program
 * @param programData The program data to create
 * @returns A promise with the created program ID and success message
 */
export async function createProgram(programData: CreateProgramRequest): Promise<CreateProgramResponse> {
  try {
    // Create a copy of the program data to avoid modifying the original
    const translatedData = { ...programData };

    // Exact valid types from the backend (line 29 in programmeController.js) with escaped apostrophe
    const validTypes = ['Accélération', 'Incubation', 'Hackathon', 'Défi d\'innovation', 'Personnalisé'];

    // Map program names to their corresponding types with escaped apostrophe
    const programTypeMap: Record<string, string> = {
      "Programme d'accélération": "Accélération",
      "Programme d'incubation": "Incubation",
      "Hackathon": "Hackathon",
      "Défi d'innovation": "Défi d'innovation", // Use the exact format from the backend
      "Programme personnalisé": "Personnalisé"
    };

    // If the program name matches a known template, set the type accordingly
    if (programTypeMap[translatedData.nom]) {
      translatedData.type = programTypeMap[translatedData.nom];
    }

    // Special case for "Défi d'innovation"
    if (translatedData.nom === "Défi d'innovation") {
      translatedData.type = "Défi d'innovation"; // Use the exact format from the backend
    }

    // Validate the program type
    if (!validTypes.includes(translatedData.type)) {
      translatedData.type = 'Accélération'; // Default to a valid type
    }

    // Log the program type for debugging
    console.log(`Program type after mapping: "${translatedData.type}"`);

    // Double-check that the type is exactly as expected by the backend
    if (translatedData.type === "Défi d'innovation") {
      console.log("Using exact type from backend: Défi d'innovation");
    }

    // Log the original data for debugging
    console.log("Original data before translation:", {
      phases: translatedData.phases_requises,
      industries: translatedData.industries_requises,
      documents: translatedData.documents_requis
    });

    // Only include phases_requises if they are explicitly set
    if (translatedData.phases_requises && translatedData.phases_requises.length > 0) {
      // Translate phases from French to English and ensure they are valid
      const translatedPhases = translatedData.phases_requises.map(phase =>
        phaseTranslations[phase] || phase // Keep original if no translation found
      );

      // Remove duplicates
      translatedData.phases_requises = translatedPhases.filter((phase, index, self) =>
        self.indexOf(phase) === index
      );
    } else {
      // If no phases are specified, use an empty array
      translatedData.phases_requises = [];
    }

    // Only include industries_requises if they are explicitly set
    if (translatedData.industries_requises && translatedData.industries_requises.length > 0) {
      // Translate industries from French to English
      const translatedIndustries = translatedData.industries_requises.map(industry =>
        industryTranslations[industry] || industry // Keep original if no translation found
      );

      // Remove duplicates
      translatedData.industries_requises = translatedIndustries.filter((industry, index, self) =>
        self.indexOf(industry) === index
      );
    } else {
      // If no industries are specified, use an empty array
      translatedData.industries_requises = [];
    }

    // Only include documents_requis if they are explicitly set
    if (translatedData.documents_requis && translatedData.documents_requis.length > 0) {
      // Translate documents from French to English
      const translatedDocuments = translatedData.documents_requis.map(document =>
        documentTranslations[document] || document // Keep original if no translation found
      );

      // Remove duplicates
      translatedData.documents_requis = translatedDocuments.filter((document, index, self) =>
        self.indexOf(document) === index
      );
    } else {
      // If no documents are specified, use an empty array
      translatedData.documents_requis = [];
    }

    // Log the translated data for debugging
    console.log("Translated data after processing:", {
      phases: translatedData.phases_requises,
      industries: translatedData.industries_requises,
      documents: translatedData.documents_requis
    });

    // IMPORTANT: Ensure admin_id is explicitly set to 1
    // The backend needs this value even though it's not used in the SQL query
    translatedData.admin_id = 1;

    // Double-check that admin_id is set correctly
    console.log("Final admin_id value:", translatedData.admin_id);

    // Make sure admin_id is not undefined or null
    if (translatedData.admin_id === undefined || translatedData.admin_id === null) {
      console.error("admin_id is not set properly!");
      translatedData.admin_id = 1;
    }

    console.log("Sending program data to API (after translation):", JSON.stringify(translatedData, null, 2));

    // Log the backendStatus for debugging
    console.log("Backend status from translatedData:", translatedData.backendStatus);
    console.log("Frontend status from translatedData:", translatedData.status);

    // Check if backendStatus is explicitly set
    if (translatedData.backendStatus) {
      console.log("backendStatus is explicitly set to:", translatedData.backendStatus);
    } else {
      console.log("backendStatus is not set, will use default 'Brouillon'");
    }

    // Create a clean object with exactly the fields needed by the backend
    // Ensure arrays are properly formatted as single-line arrays
    const cleanData = {
      type: translatedData.type,
      nom: translatedData.nom,
      description: translatedData.description,
      date_debut: translatedData.date_debut,
      date_fin: translatedData.date_fin,
      phases_requises: Array.isArray(translatedData.phases_requises) ? [...translatedData.phases_requises] : [],
      industries_requises: Array.isArray(translatedData.industries_requises) ? [...translatedData.industries_requises] : [],
      documents_requis: Array.isArray(translatedData.documents_requis) ? [...translatedData.documents_requis] : [],
      taille_equipe_min: translatedData.taille_equipe_min,
      taille_equipe_max: translatedData.taille_equipe_max,
      ca_min: translatedData.ca_min,
      ca_max: translatedData.ca_max,
      admin_id: 1, // Explicitly set admin_id to 1
      status: translatedData.backendStatus || (translatedData.status ? mapToBackendStatus(translatedData.status as FrontendStatus) : 'Brouillon'), // Use backendStatus if provided, otherwise map from frontend status
      is_template: translatedData.is_template || 'Non-Modèle' // Default to 'Non-Modèle' if not provided
    };

    console.log("Final program data to send to backend:", {
      ...cleanData,
      phases_requises: cleanData.phases_requises.length,
      industries_requises: cleanData.industries_requises.length,
      documents_requis: cleanData.documents_requis.length
    });

    // Create a FormData object to send the data
    const formData = new FormData();

    // Add each field to the FormData object
    formData.append('type', cleanData.type);
    formData.append('nom', cleanData.nom);
    formData.append('description', cleanData.description);
    formData.append('date_debut', cleanData.date_debut);
    formData.append('date_fin', cleanData.date_fin);
    formData.append('taille_equipe_min', String(cleanData.taille_equipe_min));
    formData.append('taille_equipe_max', String(cleanData.taille_equipe_max));
    formData.append('ca_min', String(cleanData.ca_min));
    formData.append('ca_max', String(cleanData.ca_max));
    formData.append('admin_id', String(cleanData.admin_id));
    formData.append('status', cleanData.status);
    formData.append('is_template', cleanData.is_template);

    // Add arrays as JSON strings
    formData.append('phases_requises', JSON.stringify(cleanData.phases_requises));
    formData.append('industries_requises', JSON.stringify(cleanData.industries_requises));
    formData.append('documents_requis', JSON.stringify(cleanData.documents_requis));

    console.log("Sending FormData to API");

    // Also try the regular JSON approach as a backup
    const jsonString = JSON.stringify(cleanData);
    // JSON string is not logged to avoid cluttering the console

    // Use fetch directly with proper headers
    const response = await fetch(`${API_BASE_URL}/programmes/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: jsonString,
      credentials: 'include'
    });

    if (!response.ok) {
      let errorMessage = 'Unknown error';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || `HTTP error ${response.status}`;
      } catch (e) {
        errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
      }
      console.error("Error creating program:", errorMessage);
      throw new Error(`Failed to create program: ${errorMessage}`);
    }

    const result = await response.json();
    console.log("Program created successfully:", result);

    // Save the program ID to localStorage for persistence across refreshes
    try {
      // Get existing program IDs
      const programIdsJson = localStorage.getItem('programIds') || '[]';
      const programIds = JSON.parse(programIdsJson);

      // Add the new program ID if it doesn't exist
      if (result.id && !programIds.includes(result.id)) {
        programIds.push(result.id);
        localStorage.setItem('programIds', JSON.stringify(programIds));
        console.log('Saved program ID to localStorage:', result.id);
      }
    } catch (error) {
      console.error('Error saving program ID to localStorage:', error);
    }

    return result;
  } catch (error) {
    console.error("Exception during program creation:", error);
    throw error;
  }
}

/**
 * Get all programs
 * @returns A promise with all programs data
 */
export async function getAllPrograms(): Promise<any[]> {
  try {
    console.log("Getting all programs");

    const response = await fetch(`${API_BASE_URL}/programmes/all`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    console.log(`Get all programs response status: ${response.status}`);

    if (!response.ok) {
      let errorMessage = 'Unknown error';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || `HTTP error ${response.status}`;
      } catch (e) {
        errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
      }
      console.error("Error getting all programs:", errorMessage);
      return []; // Return empty array instead of throwing
    }

    const result = await response.json();
    console.log(`Retrieved ${result.length} programs successfully`);
    return result;
  } catch (error) {
    console.error("Exception during getting all programs:", error);
    return []; // Return empty array instead of throwing
  }
}

/**
 * Get a program by ID
 * @param programId The ID of the program to get
 * @returns A promise with the program data
 */
export async function getProgram(programId: number | string): Promise<any> {
  try {
    console.log(`Getting program with ID ${programId}`);

    const response = await fetch(`${API_BASE_URL}/programmes/${programId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    console.log(`Get program response status: ${response.status}`);

    if (!response.ok) {
      // For 404 errors, just return null instead of throwing an error
      // This helps with the program search algorithm
      if (response.status === 404) {
        console.log(`Program with ID ${programId} not found (404)`);
        return null;
      }

      let errorMessage = 'Unknown error';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || `HTTP error ${response.status}`;
      } catch (e) {
        errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
      }
      console.error("Error getting program:", errorMessage);
      return null; // Return null instead of throwing to avoid breaking the program search
    }

    const result = await response.json();
    console.log("Program retrieved successfully:", result);

    // Log template status
    if (result && result.is_template) {
      console.log(`Program ${programId} is a template: ${result.is_template}`);
    } else {
      console.log(`Program ${programId} is not a template or template status not set`);
    }

    return result;
  } catch (error) {
    console.error("Exception during getting program:", error);
    return null; // Return null instead of throwing to avoid breaking the program search
  }
}

/**
 * Add a mentor to a program
 * @param programId The ID of the program
 * @param mentorData The mentor data to add
 * @returns A promise with the success message
 */
export async function addMentorToProgram(programId: number | string, mentorData: AddMentorRequest): Promise<AddMentorResponse> {
  try {
    console.log(`Adding mentor to program ${programId}:`, mentorData);

    const response = await fetch(`${API_BASE_URL}/programmes/${programId}/add-mentor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(mentorData),
      credentials: 'include'
    });

    if (!response.ok) {
      let errorMessage = 'Unknown error';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || `HTTP error ${response.status}`;
      } catch (e) {
        errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
      }
      console.error("Error adding mentor to program:", errorMessage);
      throw new Error(`Failed to add mentor to program: ${errorMessage}`);
    }

    const result = await response.json();
    console.log("Mentor added successfully:", result);
    return result;
  } catch (error) {
    console.error("Exception during adding mentor to program:", error);
    throw error;
  }
}

/**
 * Create a phase for a program
 * @param programId The ID of the program
 * @param phaseData The phase data to create
 * @returns A promise with the success message
 */
export async function createPhase(programId: number | string, phaseData: CreatePhaseRequest): Promise<CreatePhaseResponse> {
  try {
    console.log(`Creating phase for program ${programId}:`, phaseData);

    const response = await fetch(`${API_BASE_URL}/phase/create/${programId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(phaseData),
      credentials: 'include'
    });

    if (!response.ok) {
      let errorMessage = 'Unknown error';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || `HTTP error ${response.status}`;
      } catch (e) {
        errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
      }
      console.error("Error creating phase:", errorMessage);
      throw new Error(`Failed to create phase: ${errorMessage}`);
    }

    const result = await response.json();
    console.log("Phase created successfully:", result);
    return result;
  } catch (error) {
    console.error("Exception during phase creation:", error);
    throw error;
  }
}

/**
 * Get phases for a program
 * @param programId The ID of the program
 * @returns A promise with the phases data
 */
export async function getPhases(programId: number | string): Promise<any[]> {
  try {
    console.log(`Getting phases for program ${programId}`);

    const response = await fetch(`${API_BASE_URL}/phase/${programId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      let errorMessage = 'Unknown error';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || `HTTP error ${response.status}`;
      } catch (e) {
        errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
      }
      console.error("Error getting phases:", errorMessage);
      throw new Error(`Failed to get phases: ${errorMessage}`);
    }

    const result = await response.json();
    console.log("Phases retrieved successfully:", result);
    return result;
  } catch (error) {
    console.error("Exception during getting phases:", error);
    throw error;
  }
}

/**
 * Create a task for a phase
 * @param phaseId The ID of the phase
 * @param taskData The task data to create
 * @returns A promise with the success message
 */
export async function createTask(phaseId: number, taskData: CreateTaskRequest): Promise<CreateTaskResponse> {
  try {
    console.log(`Creating task for phase ${phaseId}:`, taskData);

    const response = await fetch(`${API_BASE_URL}/tache/create/${phaseId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(taskData),
      credentials: 'include'
    });

    if (!response.ok) {
      let errorMessage = 'Unknown error';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || `HTTP error ${response.status}`;
      } catch (e) {
        errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
      }
      console.error("Error creating task:", errorMessage);
      throw new Error(`Failed to create task: ${errorMessage}`);
    }

    const result = await response.json();
    console.log("Task created successfully:", result);
    return result;
  } catch (error) {
    console.error("Exception during task creation:", error);
    throw error;
  }
}

/**
 * Get tasks for a phase
 * @param phaseId The ID of the phase
 * @returns A promise with the tasks data
 */
export async function getTasks(phaseId: number | string): Promise<any[]> {
  try {
    // Make sure we're using a valid phase ID (numeric)
    let validPhaseId;
    if (typeof phaseId === 'string') {
      // Try to extract a numeric ID if it's a string
      const numericMatch = phaseId.toString().match(/\d+/);
      if (numericMatch) {
        validPhaseId = numericMatch[0];
      } else {
        validPhaseId = phaseId;
      }
    } else {
      validPhaseId = phaseId;
    }

    // Check if this is a temporary phase ID (not yet saved to backend)
    if (isNaN(Number(validPhaseId))) {
      return [];
    }
    const response = await fetch(`${API_BASE_URL}/tache/get/${validPhaseId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      let errorMessage = 'Unknown error';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || `HTTP error ${response.status}`;
      } catch (e) {
        errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
      }
      console.error("Error getting tasks:", errorMessage);
      throw new Error(`Failed to get tasks: ${errorMessage}`);
    }

    const result = await response.json();

    // Check if the result is an array
    if (!Array.isArray(result)) {
      // If it's not an array but has a data property that is an array, use that
      if (result && Array.isArray(result.data)) {
        return result.data;
      }
      // If it's an object with task properties, convert to array
      if (result && typeof result === 'object') {
        return Object.values(result);
      }
      return [];
    }

    return result;
  } catch (error) {
    console.error("Exception during getting tasks:", error);
    return [];
  }
}

/**
 * Create a reunion (meeting) for a phase
 * @param phaseId The ID of the phase
 * @param reunionData The reunion data to create
 * @returns A promise with the success message
 */
export async function createReunion(phaseId: number | string, reunionData: CreateReunionRequest): Promise<CreateReunionResponse> {
  try {
    console.log(`Creating reunion for phase ${phaseId}:`, reunionData);

    // Make sure we're using a valid phase ID (numeric)
    let validPhaseId;
    if (typeof phaseId === 'string') {
      // Try to extract a numeric ID if it's a string
      const numericMatch = phaseId.toString().match(/\d+/);
      if (numericMatch) {
        validPhaseId = numericMatch[0];
      } else {
        validPhaseId = phaseId;
      }
    } else {
      validPhaseId = phaseId;
    }

    console.log(`Using phase_id: ${validPhaseId} for reunion creation`);

    // Use the correct API endpoint with phase_id as expected by the backend
    const apiEndpoint = `${API_BASE_URL}/reunion/create/${validPhaseId}`;
    console.log(`Calling reunion API endpoint: ${apiEndpoint}`);
    console.log(`Request body:`, JSON.stringify(reunionData, null, 2));

    // Make sure all required fields are present
    if (!reunionData.nom_reunion) {
      console.error("nom_reunion is required for reunion creation");
      throw new Error("nom_reunion is required for reunion creation");
    }
    if (!reunionData.date) {
      console.error("date is required for reunion creation");
      throw new Error("date is required for reunion creation");
    }

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(reunionData),
      credentials: 'include'
    });

    // Log the response status for debugging
    console.log(`Reunion API response status: ${response.status}`);

    if (!response.ok) {
      let errorMessage = 'Unknown error';
      try {
        const errorText = await response.text();
        console.log('Error response text:', errorText);

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || `HTTP error ${response.status}`;
        } catch (parseError) {
          errorMessage = errorText || `HTTP error ${response.status}: ${response.statusText}`;
        }
      } catch (e) {
        errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
      }
      console.error("Error creating reunion:", errorMessage);
      throw new Error(`Failed to create reunion: ${errorMessage}`);
    }

    const result = await response.json();
    console.log("Reunion created successfully:", result);
    return result;
  } catch (error) {
    console.error("Exception during reunion creation:", error);
    throw error;
  }
}

/**
 * Get reunions for a phase
 * @param phaseId The ID of the phase
 * @returns A promise with the reunions data
 */
export async function getReunions(phaseId: number | string): Promise<any[]> {
  try {
    console.log(`Getting reunions for phase ${phaseId}`);

    // Make sure we're using a valid phase ID (numeric)
    let validPhaseId;
    if (typeof phaseId === 'string' && phaseId.startsWith('phase-')) {
      validPhaseId = phaseId.replace('phase-', '');
    } else {
      validPhaseId = phaseId;
    }

    // Check if this is a temporary phase ID (not yet saved to backend)
    if (isNaN(Number(validPhaseId))) {
      console.log(`Phase ID ${validPhaseId} is not a valid numeric ID, returning empty array`);
      return [];
    }

    console.log(`Fetching reunions from: ${API_BASE_URL}/reunion/get/${validPhaseId}`);
    const response = await fetch(`${API_BASE_URL}/reunion/get/${validPhaseId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    console.log(`Reunions API response status: ${response.status}`);

    if (!response.ok) {
      let errorMessage = 'Unknown error';
      try {
        const errorText = await response.text();
        console.log('Error response text:', errorText);

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || `HTTP error ${response.status}`;
        } catch (parseError) {
          errorMessage = errorText || `HTTP error ${response.status}: ${response.statusText}`;
        }
      } catch (e) {
        errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
      }
      console.error("Error getting reunions:", errorMessage);
      return [];
    }

    const result = await response.json();
    console.log("Reunions retrieved successfully:", result);

    // Check if the result is an array
    if (!Array.isArray(result)) {
      console.error("Reunions API did not return an array:", result);
      // If it's not an array but has a data property that is an array, use that
      if (result && Array.isArray(result.data)) {
        console.log("Using result.data as the reunions array");
        return result.data;
      }
      // If it's an object with reunion properties, convert to array
      if (result && typeof result === 'object') {
        console.log("Converting object to array of reunions");
        return Object.values(result);
      }
      return [];
    }

    return result;
  } catch (error) {
    console.error("Exception during getting reunions:", error);
    return [];
  }
}

/**
 * Create a critere (evaluation criterion) for a phase
 * @param phaseId The ID of the phase
 * @param critereData The critere data to create
 * @returns A promise with the success message
 */
export async function createCritere(phaseId: number | string, critereData: CreateCritereRequest): Promise<CreateCritereResponse> {
  try {
    console.log(`Creating critere for phase ${phaseId}:`, critereData);

    // Make sure we're using a valid phase ID (numeric)
    let validPhaseId;
    if (typeof phaseId === 'string') {
      // Try to extract a numeric ID if it's a string
      const numericMatch = phaseId.toString().match(/\d+/);
      if (numericMatch) {
        validPhaseId = numericMatch[0];
      } else {
        validPhaseId = phaseId;
      }
    } else {
      validPhaseId = phaseId;
    }

    console.log(`Using phaseId: ${validPhaseId} for critere creation`);

    // Verify the data has all required fields
    if (!critereData.nom_critere) {
      console.error("nom_critere is required");
      throw new Error("nom_critere is required for critere creation");
    }

    if (!critereData.type) {
      console.error("type is required");
      throw new Error("type is required for critere creation");
    }

    if (!['numerique', 'etoiles', 'oui_non', 'liste_deroulante'].includes(critereData.type)) {
      console.error(`Invalid type: ${critereData.type}`);
      console.log("Setting type to 'etoiles' (default)");
      critereData.type = 'etoiles';
    }

    if (critereData.poids === undefined || critereData.poids === null) {
      console.error("poids is required");
      console.log("Setting poids to 10 (default)");
      critereData.poids = 10;
    }

    if (critereData.rempli_par === undefined) {
      console.error("rempli_par is required");
      console.log("Setting rempli_par to 'mentors' (default)");
      critereData.rempli_par = 'mentors';
    }

    // Create a clean copy of the data with all required fields
    const processedData = {
      nom_critere: critereData.nom_critere,
      type: critereData.type,
      poids: critereData.poids,
      accessible_mentors: critereData.accessible_mentors !== undefined ? critereData.accessible_mentors : true,
      accessible_equipes: critereData.accessible_equipes !== undefined ? critereData.accessible_equipes : false,
      rempli_par: critereData.rempli_par,
      necessite_validation: critereData.necessite_validation !== undefined ? critereData.necessite_validation : false,
      phase_id: validPhaseId
    };

    console.log(`Final critere data:`, JSON.stringify(processedData, null, 2));

    // Use the correct API endpoint
    const apiEndpoint = `${API_BASE_URL}/critere/create/${validPhaseId}`;
    console.log(`Calling critere API endpoint: ${apiEndpoint}`);

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(processedData),
      credentials: 'include'
    });

    // Log the response status for debugging
    console.log(`Critere API response status: ${response.status}`);

    if (!response.ok) {
      let errorMessage = 'Unknown error';
      try {
        const errorText = await response.text();
        console.log('Error response text:', errorText);

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || `HTTP error ${response.status}`;
        } catch (parseError) {
          errorMessage = errorText || `HTTP error ${response.status}: ${response.statusText}`;
        }
      } catch (e) {
        errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
      }
      console.error("Error creating critere:", errorMessage);
      throw new Error(`Failed to create critere: ${errorMessage}`);
    }

    const result = await response.json();
    console.log("Critere created successfully:", result);
    return result;
  } catch (error) {
    console.error("Exception during critere creation:", error);
    throw error;
  }
}

/**
 * Get criteres for a phase
 * @param phaseId The ID of the phase
 * @returns A promise with the criteres data
 */
export async function getCriteres(phaseId: number | string): Promise<any[]> {
  try {
    console.log(`Getting criteres for phase ${phaseId}`);

    // Make sure we're using a valid phase ID (numeric)
    let validPhaseId;
    if (typeof phaseId === 'string' && phaseId.startsWith('phase-')) {
      validPhaseId = phaseId.replace('phase-', '');
    } else {
      validPhaseId = phaseId;
    }

    // Check if this is a temporary phase ID (not yet saved to backend)
    if (isNaN(Number(validPhaseId))) {
      console.log(`Phase ID ${validPhaseId} is not a valid numeric ID, returning empty array`);
      return [];
    }

    console.log(`Fetching criteres from: ${API_BASE_URL}/critere/get/${validPhaseId}`);
    const response = await fetch(`${API_BASE_URL}/critere/get/${validPhaseId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    console.log(`Criteres API response status: ${response.status}`);

    if (!response.ok) {
      let errorMessage = 'Unknown error';
      try {
        const errorText = await response.text();
        console.log('Error response text:', errorText);

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || `HTTP error ${response.status}`;
        } catch (parseError) {
          errorMessage = errorText || `HTTP error ${response.status}: ${response.statusText}`;
        }
      } catch (e) {
        errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
      }
      console.error("Error getting criteres:", errorMessage);
      return [];
    }

    const result = await response.json();
    console.log("Criteres retrieved successfully:", result);

    // Check if the result is an array
    if (!Array.isArray(result)) {
      console.error("Criteres API did not return an array:", result);
      // If it's not an array but has a data property that is an array, use that
      if (result && Array.isArray(result.data)) {
        console.log("Using result.data as the criteria array");
        return result.data;
      }
      // If it's an object with criteria properties, convert to array
      if (result && typeof result === 'object') {
        console.log("Converting object to array of criteria");
        return Object.values(result);
      }
      return [];
    }

    return result;
  } catch (error) {
    console.error("Exception during getting criteres:", error);
    return [];
  }
}

/**
 * Create a livrable (deliverable) for a phase
 * @param phaseId The ID of the phase
 * @param livrableData The livrable data to create
 * @returns A promise with the success message
 */
export async function createLivrable(phaseId: number | string, livrableData: CreateLivrableRequest): Promise<CreateLivrableResponse> {
  try {
    console.log(`Creating livrable for phase ${phaseId}:`, livrableData);

    // Make sure we're using a valid phase ID (numeric)
    let validPhaseId;
    if (typeof phaseId === 'string') {
      // Try to extract a numeric ID if it's a string
      const numericMatch = phaseId.toString().match(/\d+/);
      if (numericMatch) {
        validPhaseId = numericMatch[0];
      } else {
        validPhaseId = phaseId;
      }
    } else {
      validPhaseId = phaseId;
    }

    console.log(`Using phaseId: ${validPhaseId} for livrable creation`);

    // Verify the data has all required fields
    if (!livrableData.nom) {
      console.error("nom is required for livrable creation");
      throw new Error("nom is required for livrable creation");
    }

    if (!livrableData.description) {
      console.error("description is required for livrable creation");
      throw new Error("description is required for livrable creation");
    }

    if (!livrableData.date_echeance) {
      console.error("date_echeance is required for livrable creation");
      throw new Error("date_echeance is required for livrable creation");
    }

    // Ensure types_fichiers is provided
    if (!livrableData.types_fichiers) {
      console.error("types_fichiers is required for livrable creation");
      console.log("Using default file types: .pdf, .docx, .pptx");
      livrableData.types_fichiers = ['.pdf', '.docx', '.pptx'];
    }

    // Process types_fichiers to ensure it's in the correct format
    // The backend expects a comma-separated string
    let typesFichiersString: string;
    if (Array.isArray(livrableData.types_fichiers)) {
      // Ensure each type has a dot prefix
      const processedTypes = livrableData.types_fichiers.map(
        type => type.startsWith('.') ? type : `.${type}`
      );
      // Join into a comma-separated string
      typesFichiersString = processedTypes.join(', ');
    } else if (typeof livrableData.types_fichiers === 'string') {
      // If already a string, split and process to ensure proper format
      typesFichiersString = livrableData.types_fichiers
        .split(',')
        .map(type => {
          const trimmed = type.trim();
          return trimmed.startsWith('.') ? trimmed : `.${trimmed}`;
        })
        .join(', ');
    } else {
      // Default file types if none provided
      typesFichiersString = '.pdf, .docx, .pptx';
    }

    console.log(`Processed types_fichiers: ${typesFichiersString}`);

    // Create a clean copy of the data with all required fields
    const processedData = {
      nom: livrableData.nom,
      description: livrableData.description,
      date_echeance: livrableData.date_echeance,
      types_fichiers: typesFichiersString
    };

    console.log(`Final livrable data:`, JSON.stringify(processedData, null, 2));

    // Note: The backend route is "liverable" not "livrable" - ensure the correct endpoint
    const apiEndpoint = `${API_BASE_URL}/liverable/create/${validPhaseId}`;
    console.log(`Calling livrable API endpoint: ${apiEndpoint}`);

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(processedData),
      credentials: 'include'
    });

    // Log the response status for debugging
    console.log(`Livrable API response status: ${response.status}`);

    if (!response.ok) {
      let errorMessage = 'Unknown error';
      try {
        const errorText = await response.text();
        console.log('Error response text:', errorText);

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || `HTTP error ${response.status}`;
        } catch (parseError) {
          errorMessage = errorText || `HTTP error ${response.status}: ${response.statusText}`;
        }
      } catch (e) {
        errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
      }
      console.error("Error creating livrable:", errorMessage);
      throw new Error(`Failed to create livrable: ${errorMessage}`);
    }

    const result = await response.json();
    console.log("Livrable created successfully:", result);
    return result;
  } catch (error) {
    console.error("Exception during livrable creation:", error);
    throw error;
  }
}

/**
 * Get livrables for a phase
 * @param phaseId The ID of the phase
 * @returns A promise with the livrables data
 */
export async function getLivrables(phaseId: number | string): Promise<any[]> {
  try {
    console.log(`Getting livrables for phase ${phaseId}`);

    // Make sure we're using a valid phase ID (numeric)
    let validPhaseId;
    if (typeof phaseId === 'string' && phaseId.startsWith('phase-')) {
      validPhaseId = phaseId.replace('phase-', '');
    } else {
      validPhaseId = phaseId;
    }

    // Check if this is a temporary phase ID (not yet saved to backend)
    if (isNaN(Number(validPhaseId))) {
      console.log(`Phase ID ${validPhaseId} is not a valid numeric ID, returning empty array`);
      return [];
    }

    // Note: The backend route is "liverable" not "livrable"
    const apiEndpoint = `${API_BASE_URL}/liverable/get/${validPhaseId}`;
    console.log(`Fetching livrables from: ${apiEndpoint}`);

    const response = await fetch(apiEndpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    console.log(`Livrables API response status: ${response.status}`);

    if (!response.ok) {
      let errorMessage = 'Unknown error';
      try {
        const errorText = await response.text();
        console.log('Error response text:', errorText);

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || `HTTP error ${response.status}`;
        } catch (parseError) {
          errorMessage = errorText || `HTTP error ${response.status}: ${response.statusText}`;
        }
      } catch (e) {
        errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
      }
      console.error("Error getting livrables:", errorMessage);
      return [];
    }

    const result = await response.json();
    console.log("Livrables retrieved successfully:", result);

    // Check if the result is an array
    if (!Array.isArray(result)) {
      console.error("Livrables API did not return an array:", result);
      // If it's not an array but has a data property that is an array, use that
      if (result && Array.isArray(result.data)) {
        console.log("Using result.data as the livrables array");
        return result.data;
      }
      // If it's an object with livrable properties, convert to array
      if (result && typeof result === 'object') {
        console.log("Converting object to array of livrables");
        return Object.values(result);
      }
      return [];
    }

    return result;
  } catch (error) {
    console.error("Exception during getting livrables:", error);
    return [];
  }
}

/**
 * Update a program's status
 * @param programId The ID of the program
 * @param status The new status (draft, active, completed)
 * @param isTemplate Whether the program is a template (true/false)
 * @returns A promise with the updated program data
 */
export async function updateProgramStatus(
  programId: number | string,
  status: FrontendStatus,
  isTemplate?: boolean
): Promise<UpdateProgramStatusResponse> {
  try {
    console.log(`Updating program ${programId} status to ${status}, isTemplate: ${isTemplate}`);

    // Map frontend status to backend status
    const backendStatus = mapToBackendStatus(status);
    console.log(`Mapped frontend status "${status}" to backend status "${backendStatus}"`);

    // Prepare request body
    const requestBody: UpdateProgramStatusRequest = {
      status: backendStatus
    };

    // Add is_template if provided
    if (isTemplate !== undefined) {
      requestBody.is_template = isTemplate ? 'Modèle' : 'Non-Modèle';
      console.log(`Setting is_template to "${requestBody.is_template}"`);
    }

    console.log(`Sending request to ${API_BASE_URL}/programmes/${programId}/status with body:`, JSON.stringify(requestBody, null, 2));

    // Call the backend endpoint
    const response = await fetch(`${API_BASE_URL}/programmes/${programId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody),
      credentials: 'include'
    });

    console.log(`Status update response status: ${response.status}`);

    if (!response.ok) {
      let errorMessage = 'Unknown error';
      let errorDetails = '';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || `HTTP error ${response.status}`;
        errorDetails = JSON.stringify(errorData, null, 2);
      } catch (e) {
        errorMessage = `HTTP error ${response.status}: ${response.statusText}`;
      }
      console.error("Error updating program status:", errorMessage);
      console.error("Error details:", errorDetails);
      throw new Error(`Failed to update program status: ${errorMessage}`);
    }

    const result = await response.json();
    console.log("Program status updated successfully:", result);
    return result;
  } catch (error) {
    console.error("Exception during program status update:", error);
    throw error;
  }
}

/**
 * Delete a program
 * @param programId The ID of the program to delete
 * @returns A promise with the success message
 */
export async function deleteProgram(programId: number | string): Promise<{ message: string }> {
  try {
    console.log(`Deleting program ${programId}`);

    // Call the actual backend endpoint for program deletion
    const response = await fetch(`${API_BASE_URL}/programmes/delete/${programId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete program: ${errorText}`);
    }

    // Try to parse the response as JSON, but handle the case where it might be empty
    try {
      return await response.json();
    } catch (jsonError) {
      // If the response is empty or not valid JSON, return a default success message
      return { message: "Programme supprimé avec succès" };
    }
  } catch (error) {
    console.error("Error deleting program:", error);
    throw error;
  }
}
