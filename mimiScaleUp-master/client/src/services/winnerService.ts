import { API_BASE_URL } from "@/lib/constants";

/**
 * Interface for the winner declaration request
 */
interface DeclareWinnerRequest {
  phaseId: number | string;
  candidatureId: number | string;
}

/**
 * Interface for the winner response
 */
export interface WinnerResponse {
  candidature_id: number;
  nom_equipe: string;
  type: string;
  phase_nom: string;
  membres: {
    soumission_id: number;
    utilisateur_id: number;
    email: string;
    nom_complet: string;
  }[];
  programme: {
    nom: string;
    description: string;
    date_debut: string;
    date_fin: string;
  };
}

/**
 * Declares a team as the winner of a program phase
 * @param phaseId The ID of the phase (should be the last phase of the program)
 * @param candidatureId The ID of the team/candidature to declare as winner
 * @returns A promise that resolves to the updated phase information
 */
export async function declareWinner(
  phaseId: number | string,
  candidatureId: number | string
): Promise<{ message: string; phase: any; candidature_id: number | string }> {
  console.log(`Declaring team ${candidatureId} as winner of phase ${phaseId}`);

  try {
    // Prepare the request body
    const requestBody: DeclareWinnerRequest = {
      phaseId,
      candidatureId
    };

    // Call the backend API to declare the winner
    const response = await fetch(`${API_BASE_URL}/CandidaturePhase/phases/declarer-gagnant`, {
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
      console.error('Error declaring winner:', errorData);
      throw new Error(errorData.error || `HTTP Error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Winner declared successfully:', result);
    return result;
  } catch (error) {
    console.error('Exception during winner declaration:', error);
    throw error;
  }
}

/**
 * Gets the winner of a program
 * @param programId The ID of the program
 * @returns A promise that resolves to the winner information
 */
export async function getProgramWinner(
  programId: number | string
): Promise<WinnerResponse | null> {
  console.log(`Getting winner for program ${programId}`);

  try {
    // Call the backend API to get the winner
    const response = await fetch(`${API_BASE_URL}/CandidaturePhase/programme/${programId}/gagnant`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    console.log('Response status:', response.status);

    if (response.status === 404) {
      // No winner found, return null
      console.log('No winner found for this program');
      return null;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      console.error('Error getting program winner:', errorData);
      throw new Error(errorData.error || `HTTP Error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Winner retrieved successfully:', result);
    return result;
  } catch (error) {
    console.error('Exception during getting program winner:', error);
    // Return null instead of throwing to prevent UI from breaking
    return null;
  }
}

/**
 * Checks if a team is a winner in a program
 * @param programId The ID of the program
 * @param teamId The ID of the team to check
 * @returns A promise that resolves to true if the team is a winner, false otherwise
 */
export async function isTeamWinner(
  programId: number | string,
  teamId: number | string
): Promise<boolean> {
  console.log(`Checking if team ${teamId} is a winner in program ${programId}`);

  try {
    // Get the winner of the program
    const winner = await getProgramWinner(programId);

    // If there's no winner, the team is not a winner
    if (!winner) {
      console.log(`No winner found for program ${programId}`);
      return false;
    }

    // Check if the winner is the team we're looking for
    const isWinner = String(winner.candidature_id) === String(teamId);
    console.log(`Team ${teamId} is ${isWinner ? '' : 'not '}the winner of program ${programId}`);

    return isWinner;
  } catch (error) {
    console.error(`Error checking if team ${teamId} is a winner:`, error);
    return false;
  }
}
