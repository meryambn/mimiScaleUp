import { API_BASE_URL } from '../lib/constants';
import { apiRequest } from './mentorService';

// Interface for program data
export interface MentorProgram {
  id: number;
  nom: string;
  description: string;
  date_debut: string;
  date_fin: string;
  type: string;
  admin_id: number;
  mentors: Array<{
    utilisateur_id: number;
    nom: string;
    prenom: string;
    profession: string;
  }>;
}

/**
 * Get all programs that a mentor is assigned to
 * @param mentorId The ID of the mentor
 * @returns A promise with the programs data
 */
export async function getMentorPrograms(mentorId: number): Promise<MentorProgram[]> {
  try {
    // Use our apiRequest helper function
    const data = await apiRequest<MentorProgram[]>(`${API_BASE_URL}/programmes/mentor/${mentorId}`, {
      method: 'GET'
    });

    return data || [];
  } catch (error) {
    console.error('Error fetching mentor programs:', error);
    // Return empty array instead of throwing to prevent UI from breaking
    return [];
  }
}
