import { API_BASE_URL } from "@/lib/constants";

/**
 * Interface for the request to move an entity to a phase
 */
interface MoveToPhaseRequest {
  entiteType: 'startup' | 'equipe';
  entiteId: number | string;
  phaseNextId: number | string;
  programmeId: number | string;
  // Optional name field to ensure the startup name is passed to the backend
  nom_entreprise?: string;
  // Optional soumission object to pass the name in the format the backend expects
  soumission?: {
    nom_entreprise: string;
  };
}

/**
 * Interface for the response from moving an entity to a phase
 */
interface MoveToPhaseResponse {
  message: string;
  nom: string;
  entiteType: 'startup' | 'equipe';
  entiteId: number | string;
  phase_precedente: string;
  nouvelle_phase: string;
  candidature_id: number;
  teamName?: string; // Optional team name to use instead of the backend's default name
}

/**
 * Moves a startup or team to a specific phase
 * @param request The request data containing entity type, entity ID, phase ID, and program ID
 * @returns A promise that resolves to the response from the server
 */
export async function moveToPhase(request: MoveToPhaseRequest): Promise<MoveToPhaseResponse> {
  console.log('Moving entity to phase:', request);

  // Log if we have a name to send
  if (request.nom_entreprise) {
    console.log(`Including entity name: ${request.nom_entreprise}`);
  } else {
    console.log('No entity name provided, backend will use default naming');
  }

  try {
    // Prepare the request body
    const requestBody = {
      ...request
    };

    // If this is a startup and we have a name, make sure it's in the correct format for the backend
    if (request.entiteType === 'startup' && request.nom_entreprise) {
      // The backend expects soumission.nom_entreprise, so we need to make sure it's set correctly
      // Add the soumission object if it doesn't exist
      if (!requestBody.soumission) {
        requestBody.soumission = {
          nom_entreprise: request.nom_entreprise
        };
      }
      console.log(`Sending startup name '${request.nom_entreprise}' to backend in soumission object`);
    }

    // Call the backend API to move the entity to the phase
    console.log('Final request body:', requestBody);
    const response = await fetch(`${API_BASE_URL}/CandidaturePhase/phases/avancer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody),
      credentials: 'include'
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      console.error('Error moving entity to phase:', errorData);
      throw new Error(errorData.error || `HTTP Error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Entity moved to phase successfully:', result);

    // If we sent a name but the backend still used "Startup X", override the name in the result
    if (request.nom_entreprise && result.nom && result.nom.startsWith('Startup ')) {
      console.log(`Backend used default name "${result.nom}" instead of "${request.nom_entreprise}". Overriding in frontend.`);
      result.nom = request.nom_entreprise;

      // Also set the teamName property
      result.teamName = request.nom_entreprise;
    }

    return result;
  } catch (error) {
    console.error('Exception during moving entity to phase:', error);
    throw error;
  }
}
