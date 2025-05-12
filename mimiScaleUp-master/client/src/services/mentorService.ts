import { API_BASE_URL } from '../lib/constants';

// Helper function to make API requests with better error handling
export async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    // Set default options
    const defaultOptions: RequestInit = {
      credentials: 'include',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    // Merge with provided options
    const fetchOptions = { ...defaultOptions, ...options };

    // Make the request
    const response = await fetch(url, fetchOptions);

    // Handle error responses
    if (!response.ok) {
      let errorMessage = '';
      try {
        const errorData = await response.text();
        errorMessage = errorData;
      } catch (e) {
        errorMessage = response.statusText;
      }
      throw new Error(`API request failed: ${response.status} ${errorMessage}`);
    }

    // Parse JSON response
    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

export interface Mentor {
  id: number;
  nom: string;
  prenom: string;
  profession: string;
  email?: string;
}

// Get all mentors in the admin's pool
export async function getAdminMentors(): Promise<Mentor[]> {
  try {
    // Use our apiRequest helper function
    const data = await apiRequest<Mentor[]>(`${API_BASE_URL}/mentor/admin-mentors`, {
      method: 'GET'
    });

    return data || [];
  } catch (error) {
    console.error('Error fetching admin mentors:', error);
    // Return empty array instead of throwing to prevent UI from breaking
    return [];
  }
}

// Get all available mentors (not in the admin's pool)
export async function getAvailableMentors(): Promise<Mentor[]> {
  try {
    // Use our apiRequest helper function
    const data = await apiRequest<Mentor[]>(`${API_BASE_URL}/mentor/available`, {
      method: 'GET'
    });

    return data || [];
  } catch (error) {
    console.error('Error fetching available mentors:', error);
    // Return empty array instead of throwing to prevent UI from breaking
    return [];
  }
}

// Add a mentor to the admin's pool
export async function addMentorToAdminPool(mentorId: number): Promise<boolean> {
  try {
    // Use our apiRequest helper function
    await apiRequest<{message: string}>(`${API_BASE_URL}/mentor/add`, {
      method: 'POST',
      body: JSON.stringify({ mentor_id: mentorId })
    });

    return true;
  } catch (error) {
    console.error('Error adding mentor to admin pool:', error);
    return false;
  }
}

// Remove a mentor from the admin's pool
export async function removeMentorFromAdminPool(mentorId: number): Promise<boolean> {
  try {
    // Use our apiRequest helper function
    await apiRequest<{message: string}>(`${API_BASE_URL}/mentor/remove/${mentorId}`, {
      method: 'DELETE'
    });

    return true;
  } catch (error) {
    console.error('Error removing mentor from admin pool:', error);
    return false;
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
