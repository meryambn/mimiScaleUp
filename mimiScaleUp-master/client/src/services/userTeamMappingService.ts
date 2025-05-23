/**
 * Service to handle mapping between users and teams
 *
 * This service provides functions to:
 * 1. Map user IDs to soumission IDs
 * 2. Find the team ID for a user in a specific program
 */

import { API_BASE_URL } from '@/lib/constants';



/**
 * Maps a user ID to a team ID in a specific program
 * @param userId The ID of the user
 * @param programId The ID of the program
 * @returns The team ID if found, null otherwise
 */
export async function getTeamIdForUser(userId: number | string, programId: number | string): Promise<number | null> {
  try {
    console.log(`Finding team for user ${userId} in program ${programId}`);

    // Step 1: Get all teams in the program
    const teamsResponse = await fetch(`${API_BASE_URL}/programme-startups/get/${programId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    if (!teamsResponse.ok) {
      throw new Error(`Error fetching teams: ${teamsResponse.status}`);
    }

    const programTeams = await teamsResponse.json();
    console.log('Teams in program:', programTeams);

    // Step 2: First try to find the user's soumission ID
    // We need to get the soumission ID that corresponds to this user
    let soumissionId: number | null = null;

    try {
      // Try to get the user's submissions for this program
      const submissionsResponse = await fetch(`${API_BASE_URL}/soum/user/${userId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (submissionsResponse.ok) {
        const submissions = await submissionsResponse.json();
        console.log('User submissions:', submissions);

        // Find a submission for this program
        const programSubmission = Array.isArray(submissions) ?
          submissions.find((sub: any) => sub.programme_id === Number(programId)) : null;

        if (programSubmission) {
          soumissionId = programSubmission.id;
          console.log(`Found soumission ID ${soumissionId} for user ${userId} in program ${programId}`);
        }
      }
    } catch (error) {
      console.error('Error fetching user submissions:', error);
      // Continue with the process even if this fails
    }

    // Step 3: Try to get user details to check email
    let userEmail = null;
    try {
      const userResponse = await fetch(`${API_BASE_URL}/auth/user/${userId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        credentials: 'include'
      }).catch(() => null);

      if (userResponse && userResponse.ok) {
        const userData = await userResponse.json();
        if (userData && userData.email) {
          userEmail = userData.email;
          console.log(`Found user email: ${userEmail}`);
        }
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      // Continue with the process even if this fails
    }

    // Step 4: If we have a soumission ID, check if it's part of any team
    if (soumissionId) {
      // Look through all teams to find one that contains this soumission ID
      for (const team of programTeams.equipes || []) {
        if (team.membres && team.membres.some((membreId: number) => membreId === soumissionId)) {
          console.log(`Found team ${team.id} (${team.nom_equipe}) containing soumission ${soumissionId}`);
          return team.id;
        }
      }
    }

    // Step 5: Try to find the team by checking all teams' members
    // This is a more thorough approach that checks if the user is a member of any team
    try {
      // For each team in the program
      for (const team of programTeams.equipes || []) {
        // Get the team details to check members
        const teamDetailsResponse = await fetch(`${API_BASE_URL}/cand/${team.id}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          },
          credentials: 'include'
        });

        if (teamDetailsResponse.ok) {
          const teamDetails = await teamDetailsResponse.json();
          console.log(`Checking team ${team.id} (${team.nom_equipe}) members:`, teamDetails.membres);

          // Check if the user is a member of this team
          if (teamDetails.membres && Array.isArray(teamDetails.membres)) {
            const isMember = teamDetails.membres.some((member: any) => {
              // Check by user ID
              if (String(member.id) === String(userId)) {
                return true;
              }

              // Check by utilisateur_id (this is the key relationship)
              if (member.utilisateur_id && String(member.utilisateur_id) === String(userId)) {
                console.log(`Found match by utilisateur_id: ${member.utilisateur_id} matches user ${userId}`);
                return true;
              }

              // Check by email if we have it
              if (userEmail && member.email === userEmail) {
                return true;
              }

              return false;
            });

            if (isMember) {
              console.log(`User ${userId} is a member of team ${team.id} (${team.nom_equipe})`);
              return team.id;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking team members:', error);
      // Continue with the process even if this fails
    }

    // Step 5: Check if the user ID matches any individual startup ID
    // This is for the case where the user is an individual startup
    const individualStartup = (programTeams.startups_individuelles || []).find(
      (startup: any) => Number(startup.id) === Number(userId)
    );

    if (individualStartup) {
      console.log(`User ${userId} is an individual startup in program ${programId}`);
      return Number(userId); // For individual startups, the ID is the same as the user ID
    }

    // If we get here, we couldn't find a team for this user
    console.log('No team found for user. Available teams:',
      programTeams.equipes.map((t: any) => ({
        id: t.id,
        name: t.nom_equipe,
        members: t.membres
      }))
    );

    // Return null to indicate no team was found
    return null;
  } catch (error) {
    console.error('Error finding team for user:', error);
    return null;
  }
}

/**
 * Gets the candidature ID (team ID) for the current user in a specific program
 * This function handles all the logic to find the correct team ID
 *
 * @param userId The ID of the user
 * @param programId The ID of the program
 * @returns The candidature ID (team ID) if found, the user ID as fallback
 */
export async function getCandidatureIdForUser(userId: number | string, programId: number | string): Promise<number | string> {
  try {

    // Try to get the team ID using the mapping service
    const teamId = await getTeamIdForUser(userId, programId);

    if (teamId) {
      console.log(`Found team ID ${teamId} for user ${userId} in program ${programId}`);
      return teamId;
    }

    // If no team ID found, use the user ID as fallback
    console.log(`No team found for user ${userId}, using user ID as fallback`);
    return userId;
  } catch (error) {
    console.error('Error getting candidature ID:', error);
    return userId; // Fallback to user ID
  }
}
