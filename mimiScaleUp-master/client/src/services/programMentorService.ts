import { API_BASE_URL } from '../lib/constants';
import { Mentor, apiRequest } from './mentorService';

// Get all mentors for a specific program
export async function getProgramMentors(programId: number): Promise<Mentor[]> {
  try {
    // Use our apiRequest helper function to get program details
    const programData = await apiRequest<any>(`${API_BASE_URL}/programmes/${programId}`, {
      method: 'GET'
    });

    // Extract mentors from program data and map to the expected format
    if (programData && programData.mentors && Array.isArray(programData.mentors)) {
      return programData.mentors.map((mentor: any) => ({
        id: mentor.utilisateur_id,
        nom: mentor.nom,
        prenom: mentor.prenom,
        profession: mentor.profession,
        email: mentor.email || ""
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching program mentors:', error);
    // Return empty array instead of throwing to prevent UI from breaking
    return [];
  }
}

// Add a mentor to a program
export async function addMentorToProgram(programId: number, mentorId: number): Promise<boolean> {
  try {
    // Use our apiRequest helper function
    await apiRequest<{message: string}>(`${API_BASE_URL}/programmes/${programId}/add-mentor`, {
      method: 'POST',
      body: JSON.stringify({ mentorId })
    });

    return true;
  } catch (error) {
    console.error('Error adding mentor to program:', error);
    return false;
  }
}

// Remove a mentor from a program
export async function removeMentorFromProgram(programId: number, mentorId: number): Promise<boolean> {
  try {
    // Use our apiRequest helper function
    await apiRequest<{message: string}>(`${API_BASE_URL}/programmes/${programId}/mentors/${mentorId}`, {
      method: 'DELETE'
    });

    return true;
  } catch (error) {
    console.error('Error removing mentor from program:', error);
    return false;
  }
}
