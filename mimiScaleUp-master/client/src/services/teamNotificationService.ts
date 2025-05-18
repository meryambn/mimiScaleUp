import { API_BASE_URL } from '../lib/constants';
import { apiRequest } from './mentorService';

export interface TeamMember {
  id: string | number;
  name: string;
  role: string;
  email?: string;
  avatar?: string;
}

export interface TeamDetails {
  id: number;
  name: string;
  description: string;
  programId: number;
  programName: string;
  members: TeamMember[];
  reason?: string;
}

// Get team details by team ID
export async function getTeamDetails(teamId: number): Promise<TeamDetails | null> {
  try {
    const url = `${API_BASE_URL}/cand/${teamId}`;

    const response = await apiRequest<any>(url, {
      method: 'GET'
    });

    // Log the raw response for debugging
    console.log('Raw team details response:', response);

    if (response.error) {
      console.error('Error fetching team details:', response.message);
      return null;
    }

    // Transform the response into the expected format
    const teamDetails: TeamDetails = {
      id: response.id || teamId,
      name: response.nom || 'Équipe',
      description: response.description || 'Description non disponible',
      programId: response.programme_id,
      programName: response.programme_nom || 'Programme',
      members: Array.isArray(response.membres)
        ? response.membres.map((membre: any) => ({
            id: membre.id,
            name: membre.nom || membre.nom_entreprise || 'Membre',
            role: membre.role || 'Participant',
            email: membre.email
          }))
        : [],
      reason: response.raison || 'Cette équipe a été formée pour combiner des compétences complémentaires et maximiser les chances de succès du projet.'
    };

    // Log the transformed team details
    console.log('Transformed team details:', teamDetails);
    console.log('Team members after transformation:', teamDetails.members);

    return teamDetails;
  } catch (error) {
    console.error('Error fetching team details:', error);
    return null;
  }
}

// Get team members by team ID
export async function getTeamMembers(teamId: number): Promise<TeamMember[]> {
  try {
    const url = `${API_BASE_URL}/cand/${teamId}/membres`;

    const response = await apiRequest<any>(url, {
      method: 'GET'
    });

    // Log the raw response for debugging
    console.log('Raw team members response:', response);

    if (response.error || !Array.isArray(response)) {
      console.error('Error fetching team members:', response.message || 'Invalid response format');
      return [];
    }

    // Make sure we have an array to work with
    const membresArray = Array.isArray(response) ? response : [];

    // Transform the response into the expected format
    const members: TeamMember[] = membresArray.map((membre: any) => ({
      id: membre.id,
      name: membre.nom || membre.nom_entreprise || 'Membre',
      role: membre.role || 'Participant',
      email: membre.email
    }));

    // Log the transformed members
    console.log('Transformed team members:', members);

    return members;
  } catch (error) {
    console.error('Error fetching team members:', error);
    return [];
  }
}
