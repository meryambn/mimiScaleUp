import { API_BASE_URL } from '@/lib/constants';

export interface DeliverableSubmission {
  id: number;
  livrable_id: number;
  candidature_id: number;
  nom_fichier: string;
  chemin_fichier: string;
  date_soumission: string;
  statut: 'en attente' | 'valide' | 'rejete';
  // Additional properties that might be returned by the backend
  nom_livrable?: string;
  description_livrable?: string;
  date_echeance?: string;
  // Handle any other properties that might be returned
  [key: string]: any;
}

export interface Deliverable {
  id: number;
  nom: string;
  description: string;
  date_echeance: string;
  types_fichiers: string[];
  phase_id: number;
}

/**
 * Récupère toutes les soumissions de livrables pour une équipe spécifique
 * @param candidatureId ID de l'équipe
 * @returns Liste des soumissions de livrables
 */
export const getTeamDeliverableSubmissions = async (candidatureId: string): Promise<DeliverableSubmission[]> => {
  try {
    console.log('getTeamDeliverableSubmissions - candidatureId:', candidatureId);

    // Ensure candidatureId is valid
    if (!candidatureId) {
      console.error('Invalid candidatureId:', candidatureId);
      return [];
    }

    // Construct the API URL
    const apiUrl = `${API_BASE_URL}/livrable-soumissions/equipe/${candidatureId}`;
    console.log('API URL:', apiUrl);

    // Make the API request
    console.log('Making API request to fetch team deliverable submissions');
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    console.log('Response status:', response.status);
    // Log a few important headers instead of all headers
    console.log('Response content-type:', response.headers.get('content-type'));

    // Handle error responses
    if (!response.ok) {
      let errorMessage = `HTTP Error: ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('Error response data:', errorData);
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
        errorMessage = response.statusText || errorMessage;
      }
      console.error('Error response:', errorMessage);
      throw new Error(errorMessage);
    }

    // Parse the response data
    console.log('Parsing response data');
    const data = await response.json();
    console.log('Response data (detailed):', JSON.stringify(data, null, 2));

    // Check if data is an array
    if (!Array.isArray(data)) {
      console.error('Expected array but got:', typeof data);
      return [];
    }

    // Map the data to match the expected DeliverableSubmission interface
    console.log('Mapping response data to DeliverableSubmission interface');
    const submissions = data.map((item: any) => {
      // Log each item for debugging
      console.log('Processing submission item:', item);

      return {
        id: item.id,
        livrable_id: item.livrable_id,
        candidature_id: item.candidature_id,
        nom_fichier: item.nom_fichier,
        chemin_fichier: item.chemin_fichier,
        date_soumission: item.date_soumission,
        statut: item.statut || 'en attente',
        // Include additional properties if they exist in the response
        nom_livrable: item.nom_livrable,
        description_livrable: item.description_livrable,
        date_echeance: item.date_echeance
      };
    });

    console.log('Mapped submissions:', submissions);
    return submissions;
  } catch (error) {
    console.error('Error fetching team deliverable submissions:', error);
    // Return empty array instead of throwing to prevent component crashes
    return [];
  }
};

/**
 * Récupère toutes les soumissions pour un livrable spécifique
 * @param livrableId ID du livrable
 * @returns Liste des soumissions pour ce livrable
 */
export const getLivrableSubmissions = async (livrableId: string): Promise<DeliverableSubmission[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/livrable-soumissions/livrable/${livrableId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || `HTTP Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching livrable submissions:', error);
    throw error;
  }
};

/**
 * Télécharge un fichier soumis
 * @param soumissionId ID de la soumission
 */
export const downloadSubmissionFile = (soumissionId: string): void => {
  // Ouvrir une nouvelle fenêtre pour télécharger le fichier
  window.open(`${API_BASE_URL}/livrable-soumissions/telecharger/${soumissionId}`, '_blank');
};

/**
 * Met à jour le statut d'une soumission de livrable
 * @param soumissionId ID de la soumission
 * @param statut Nouveau statut ('en attente', 'valide', 'rejete')
 * @returns Soumission mise à jour
 */
export const updateSubmissionStatus = async (
  soumissionId: string,
  statut: 'en attente' | 'valide' | 'rejete'
): Promise<DeliverableSubmission> => {
  try {
    const response = await fetch(`${API_BASE_URL}/livrable-soumissions/statut/${soumissionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ statut }),
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || `HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    return data.soumission;
  } catch (error) {
    console.error('Error updating submission status:', error);
    throw error;
  }
};

/**
 * Soumet un livrable (télécharge un fichier)
 * @param formData FormData contenant le fichier et les métadonnées
 * @returns Résultat de la soumission
 */
export const submitDeliverable = async (formData: FormData): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/livrable-soumissions/soumettre`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || `HTTP Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting deliverable:', error);
    throw error;
  }
};

/**
 * Récupère tous les livrables pour une phase spécifique
 * @param phaseId ID de la phase
 * @returns Liste des livrables
 */
export const getPhaseDeliverables = async (phaseId: string): Promise<Deliverable[]> => {
  try {
    console.log('getPhaseDeliverables - phaseId:', phaseId);
    console.log('API URL:', `${API_BASE_URL}/liverable/get/${phaseId}`);

    if (!phaseId) {
      console.error('Phase ID is undefined or empty');
      return [];
    }

    const response = await fetch(`${API_BASE_URL}/liverable/get/${phaseId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      console.error('Error response:', errorData);
      throw new Error(errorData.error || `HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Phase deliverables data:', JSON.stringify(data, null, 2));

    // Check if data is an array
    if (!Array.isArray(data)) {
      console.error('Expected array but got:', typeof data);
      return [];
    }

    return data;
  } catch (error) {
    console.error('Error fetching phase deliverables:', error);
    return []; // Return empty array instead of throwing to prevent component crashes
  }
};
