import { API_BASE_URL } from '../lib/constants';
import { getProgram } from './programService';
import { getTeamIdForUser } from './userTeamMappingService';
import { useAuth } from '@/context/AuthContext';

/**
 * Checks if a program is terminated
 * @param programId The ID of the program to check
 * @returns true if the program is terminated, false otherwise
 */
export async function isProgramTerminated(programId: string | number): Promise<boolean> {
  try {
    const program = await getProgram(programId);
    return program?.status === 'completed';
  } catch (error) {
    console.error('Error checking if program is terminated:', error);
    return false;
  }
}

/**
 * Checks if a user has been removed from a program
 * @param userId The ID of the user
 * @param programId The ID of the program
 * @returns true if the user has been removed, false otherwise
 */
export async function isUserRemovedFromProgram(userId: string | number, programId: string | number): Promise<boolean> {
  try {
    if (!userId || !programId) return false;

    // Try to get the team ID for the user in the program
    const teamId = await getTeamIdForUser(userId, programId);

    // If no team ID is found, the user is not part of any team in the program
    // This could mean they were removed or never part of the program
    return teamId === null;
  } catch (error) {
    console.error('Error checking if user is removed from program:', error);
    return false;
  }
}

/**
 * Checks if a user has access to a program
 * @param programId The ID of the program to check
 * @param userId Optional user ID to check. If not provided, the current user will be used.
 * @returns An object with access status and a message if access is denied
 */
export async function checkProgramAccess(
  programId: string | number,
  userId?: string | number
): Promise<{
  hasAccess: boolean;
  message?: string;
}> {
  try {
    // Check if the program is terminated
    const isTerminated = await isProgramTerminated(programId);

    if (isTerminated) {
      return {
        hasAccess: false,
        message: "Ce programme est terminé. Vous n'avez plus accès à ce programme."
      };
    }

    // Get the current user ID if not provided
    let currentUserId = userId;
    if (!currentUserId) {
      // Try to get the current user from localStorage
      const userJson = localStorage.getItem('user');
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          currentUserId = user.id;
        } catch (e) {
          console.error('Error parsing user from localStorage:', e);
        }
      }
    }

    // If we have a user ID, check if they've been removed from the program
    if (currentUserId) {
      const isRemoved = await isUserRemovedFromProgram(currentUserId, programId);

      if (isRemoved) {
        return {
          hasAccess: false,
          message: "Vous avez été retiré de ce programme. Vous n'avez plus accès à ce programme."
        };
      }
    }

    // If all checks pass, the user has access
    return { hasAccess: true };
  } catch (error) {
    console.error('Error checking program access:', error);
    return {
      hasAccess: true // Default to allowing access in case of errors
    };
  }
}
