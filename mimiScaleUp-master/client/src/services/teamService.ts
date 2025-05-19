import { API_BASE_URL } from "@/lib/constants";
import { ApplicationSubmission } from "@/components/application/ApplicationSubmissionCard";

interface TeamCreationData {
  name: string;
  description: string;
  members: ApplicationSubmission[];
}

interface BackendTeamData {
  nom: string;
  description: string;
  programmeId: string | number;
  soumissionId: (string | number)[];
}

interface TeamCreationResponse {
  message: string;
  candidature: {
    id: number;
    nom_equipe: string;
    description_equipe: string;
    programme_id: number;
  };
}

interface AddToProgramResponse {
  success: boolean;
  message: string;
}

export interface BackendTeam {
  id: number;
  nom_equipe: string;
  membres: number[];
}

export interface BackendStartup {
  id: number;
  nom: string;
}

export interface ProgramTeamsResponse {
  startups_individuelles: BackendStartup[];
  equipes: BackendTeam[];
}

export interface TeamPhaseResponse {
  phase_id: number | null;
  nom: string;
  description: string;
  teamName?: string; // Optional team name to use instead of the backend's default name
}

export interface TeamDetailsResponse {
  id: number;
  nom_equipe: string;
  description_equipe?: string;
  programme_id: number;
  membres?: any[];
}

/**
 * Creates a team from selected submissions
 * @param teamData The team data including name, description, and members
 * @param programId The ID of the program to create the team for
 * @param assignToPhase Whether to automatically assign the team to the first phase (default: true)
 * @returns A promise that resolves to the created team
 */
export async function createTeam(
  teamData: TeamCreationData,
  programId: string | number,
  assignToPhase: boolean = true
): Promise<TeamCreationResponse> {
  console.log('Creating team with data:', teamData);
  console.log('Program ID:', programId);

  // Create a team object for the backend
  const backendTeamData: BackendTeamData = {
    nom: teamData.name,
    description: teamData.description,
    programmeId: programId,
    soumissionId: teamData.members.map(m => m.id) // Array of submission IDs
  };

  console.log('Sending data to backend:', backendTeamData);

  // Call the backend API to create a team
  const response = await fetch(`${API_BASE_URL}/cand/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(backendTeamData),
    credentials: 'include'
  });

  console.log('Response status:', response.status);

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Error creating team:', errorData);
    throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
  }

  const result = await response.json();
  console.log('Team created successfully:', result);

  // If assignToPhase is true, assign the team to the first phase
  if (assignToPhase && result.candidature && result.candidature.id) {
    try {
      console.log(`Assigning newly created team ${result.candidature.id} to a phase...`);
      await ensureTeamHasPhase(result.candidature.id, programId, 'equipe');
    } catch (error) {
      console.error(`Error assigning team ${result.candidature.id} to a phase:`, error);
      // Continue even if phase assignment fails
    }
  }

  return result;
}

/**
 * Adds a single submission to a program as a team
 * @param submission The submission to add as a team
 * @param programId The ID of the program to add the team to
 * @param assignToPhase Whether to automatically assign the team to the first phase (default: true)
 * @returns A promise that resolves to the created team
 */
export async function addSubmissionAsTeam(
  submission: ApplicationSubmission,
  programId: string | number,
  assignToPhase: boolean = true
): Promise<TeamCreationResponse> {
  console.log('Adding submission as team:', submission);
  console.log('Program ID:', programId);

  // Create a team object for the backend
  const backendTeamData: BackendTeamData = {
    nom: submission.teamName,
    description: `Équipe créée à partir de la soumission #${submission.id}`,
    programmeId: programId,
    soumissionId: [submission.id] // Array with a single submission ID
  };

  console.log('Sending data to backend:', backendTeamData);

  // Call the backend API to create a team
  const response = await fetch(`${API_BASE_URL}/cand/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(backendTeamData),
    credentials: 'include'
  });

  console.log('Response status:', response.status);

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Error adding submission as team:', errorData);
    throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
  }

  const result = await response.json();
  console.log('Submission added as team successfully:', result);

  // If assignToPhase is true, assign the team to the first phase
  if (assignToPhase && result.candidature && result.candidature.id) {
    try {
      console.log(`Assigning newly created team ${result.candidature.id} to a phase...`);
      await ensureTeamHasPhase(result.candidature.id, programId, 'equipe');
    } catch (error) {
      console.error(`Error assigning team ${result.candidature.id} to a phase:`, error);
      // Continue even if phase assignment fails
    }
  }

  return result;
}

/**
 * Adds a submission to a program without creating a team
 * @param submissionId The ID of the submission to add to the program
 * @param programId The ID of the program to add the submission to
 * @param assignToPhase Whether to automatically assign the startup to the first phase (default: true)
 * @returns A promise that resolves to the response from the server
 */
export async function addSubmissionToProgram(
  submissionId: string | number,
  programId: string | number,
  assignToPhase: boolean = true,
  startupName?: string
): Promise<AddToProgramResponse> {
  console.log('Adding submission to program:', submissionId);
  console.log('Program ID:', programId);

  // If no startup name was provided, try to get it from the submission data
  if (!startupName) {
    try {
      // Try to get the startup name from the application submissions
      const { getSubmissionsByProgram } = await import('@/services/formService');
      const submissionsResult = await getSubmissionsByProgram(programId);

      if (submissionsResult && submissionsResult.submissions) {
        const submission = submissionsResult.submissions.find(
          (s: any) => String(s.id) === String(submissionId)
        );

        if (submission && submission.teamName && submission.teamName !== 'utilisateur') {
          console.log(`Found submission name: ${submission.teamName} for ID: ${submissionId}`);
          startupName = submission.teamName;
        } else if (submission && submission.teamEmail) {
          // Use email username as fallback
          const emailUsername = submission.teamEmail.split('@')[0];
          console.log(`Using email username as startup name: ${emailUsername} for ID: ${submissionId}`);
          startupName = emailUsername;
        }
      }
    } catch (error) {
      console.error(`Error fetching startup name:`, error);
    }
  }

  // Create the request data
  const requestData = {
    soumissionId: submissionId,
    programmeId: programId,
    // Include the startup name if we have it
    ...(startupName && { nom_entreprise: startupName })
  };

  console.log('Sending data to backend:', requestData);

  // Call the backend API to add the submission to the program
  const response = await fetch(`${API_BASE_URL}/programme-startups/ajouter`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(requestData),
    credentials: 'include'
  });

  console.log('Response status:', response.status);

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Error adding submission to program:', errorData);
    throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
  }

  const result = await response.json();
  console.log('Submission added to program successfully:', result);

  // If assignToPhase is true, try to assign the startup to the first phase
  // This will create a candidature record if it doesn't exist
  if (assignToPhase) {
    try {
      console.log(`Ensuring startup ${submissionId} has a phase assigned...`);
      await ensureTeamHasPhase(submissionId, programId, 'startup');
    } catch (error) {
      console.error(`Error ensuring startup ${submissionId} has a phase:`, error);
      // Continue even if phase assignment fails
    }
  }

  return result;
}

/**
 * Fetches all teams and individual startups for a program
 * @param programId The ID of the program to fetch teams for
 * @param ensurePhases Whether to automatically ensure all teams have phases assigned (default: false)
 * @returns A promise that resolves to the teams and startups in the program
 */
export async function getProgramTeams(
  programId: string | number,
  ensurePhases: boolean = false
): Promise<ProgramTeamsResponse> {
  console.log('Fetching teams for program:', programId);

  try {
    // Call the backend API to get teams and startups
    const response = await fetch(`${API_BASE_URL}/programme-startups/get/${programId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      console.error('Error fetching program teams:', errorData);
      throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    console.log('Teams fetched successfully:', result);

    // If ensurePhases is true, ensure all teams have phases assigned
    if (ensurePhases) {
      console.log('Ensuring all teams have phases assigned...');

      // Process teams
      if (result.equipes && result.equipes.length > 0) {
        for (const team of result.equipes) {
          try {
            await ensureTeamHasPhase(team.id, programId, 'equipe');
          } catch (error) {
            console.error(`Error ensuring team ${team.id} has a phase:`, error);
          }
        }
      }

      // Process individual startups
      if (result.startups_individuelles && result.startups_individuelles.length > 0) {
        for (const startup of result.startups_individuelles) {
          try {
            await ensureTeamHasPhase(startup.id, programId, 'startup');
          } catch (error) {
            console.error(`Error ensuring startup ${startup.id} has a phase:`, error);
          }
        }
      }

      console.log('Phase assignment completed for all teams and startups');
    }

    return result;
  } catch (error) {
    console.error('Exception during fetching program teams:', error);
    // Return empty arrays instead of throwing to prevent UI from breaking
    return { startups_individuelles: [], equipes: [] };
  }
}

/**
 * Gets the current phase for a team (candidature)
 * @param candidatureId The ID of the team/candidature
 * @param teamName Optional team name to use instead of the backend's default name
 * @returns A promise that resolves to the current phase information
 */
export async function getTeamCurrentPhase(
  candidatureId: string | number,
  teamName?: string
): Promise<TeamPhaseResponse | null> {
  console.log('Fetching current phase for team:', candidatureId);

  try {
    // Call the backend API to get the current phase
    const response = await fetch(`${API_BASE_URL}/CandidaturePhase/current/${candidatureId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      console.error('Error fetching team current phase:', errorData);

      // Return a default phase object instead of throwing an error
      return {
        phase_id: null,
        nom: "Non assigné",
        description: "Aucune phase n'est assignée à cette équipe",
        teamName: teamName
      };
    }

    const result = await response.json();
    console.log('Team current phase fetched successfully:', result);

    // Add the team name to the result if provided
    if (teamName) {
      result.teamName = teamName;
    }

    return result;
  } catch (error) {
    console.error('Exception during fetching team current phase:', error);
    // Return a default phase object instead of null
    return {
      phase_id: null,
      nom: "Non assigné",
      description: "Impossible de récupérer la phase"
    };
  }
}

/**
 * Gets the details for a specific team
 * @param teamId The ID of the team to fetch details for
 * @returns A promise that resolves to the team details
 */
export async function getTeamDetails(teamId: string | number): Promise<TeamDetailsResponse | null> {
  console.log('Fetching details for team:', teamId);

  try {
    // Call the backend API to get the team details
    const response = await fetch(`${API_BASE_URL}/cand/get/${teamId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      credentials: 'include'
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      console.error('Error fetching team details:', errorData);
      throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
    }

    const result = await response.json();
    console.log('Team details fetched successfully:', result);

    return result;
  } catch (error) {
    console.error('Exception during fetching team details:', error);
    // Return null instead of throwing to prevent UI from breaking
    return null;
  }
}

/**
 * Ensures a team has a phase assigned by checking current phase and assigning to first phase if needed
 * @param teamId The ID of the team/candidature
 * @param programId The ID of the program
 * @param entityType Whether this is a 'startup' or 'equipe'
 * @returns A promise that resolves to the current phase information
 */
export async function ensureTeamHasPhase(
  teamId: string | number,
  programId: string | number,
  entityType: 'startup' | 'equipe' = 'equipe'
): Promise<TeamPhaseResponse> {
  console.log(`Ensuring team ${teamId} has a phase assigned in program ${programId}`);

  try {
    // If this is a startup, try to get its name first
    let startupName = undefined;

    if (entityType === 'startup') {
      try {
        // Get all teams for the program to find the startup
        const programTeams = await getProgramTeams(programId);

        // Find the startup in the individual startups list
        const startup = programTeams.startups_individuelles?.find(
          s => String(s.id) === String(teamId)
        );

        if (startup && startup.nom) {
          console.log(`Found startup name: ${startup.nom} for ID: ${teamId}`);
          startupName = startup.nom;
        } else {
          // Try to get the startup name from the application submissions
          try {
            const { getSubmissionsByProgram } = await import('@/services/formService');
            const submissionsResult = await getSubmissionsByProgram(programId);

            if (submissionsResult && submissionsResult.submissions) {
              const submission = submissionsResult.submissions.find(
                (s: any) => String(s.id) === String(teamId)
              );

              if (submission && submission.teamName && submission.teamName !== 'utilisateur') {
                console.log(`Found submission name: ${submission.teamName} for ID: ${teamId}`);
                startupName = submission.teamName;
              } else if (submission && submission.teamEmail) {
                // Use email username as fallback
                const emailUsername = submission.teamEmail.split('@')[0];
                console.log(`Using email username as startup name: ${emailUsername} for ID: ${teamId}`);
                startupName = emailUsername;
              }
            }
          } catch (submissionError) {
            console.error(`Error fetching submissions for startup name:`, submissionError);
          }
        }
      } catch (nameError) {
        console.error(`Error fetching startup name:`, nameError);
      }
    }

    // Step 1: Try to get the current phase
    const currentPhase = await getTeamCurrentPhase(teamId, startupName);

    // If the team already has a phase, return it
    if (currentPhase && currentPhase.phase_id !== null) {
      console.log(`Team ${teamId} already has phase: ${currentPhase.nom}`);
      return currentPhase;
    }

    console.log(`Team ${teamId} has no phase assigned. Fetching program phases...`);

    // Step 2: If no phase is found, get the first phase of the program
    const { getPhases } = await import('@/services/programService');
    const { moveToPhase } = await import('@/services/phaseService');

    const phases = await getPhases(programId);

    if (!phases || phases.length === 0) {
      console.error(`No phases found for program ${programId}`);
      return {
        phase_id: null,
        nom: "Non assigné",
        description: "Le programme n'a pas de phases définies"
      };
    }

    // Get the first phase
    const firstPhase = phases[0];
    console.log(`Assigning team ${teamId} to first phase: ${firstPhase.nom} (ID: ${firstPhase.id})`);

    // Step 3: Move the team to the first phase
    try {
      // If this is a startup, try to get its name from the program teams
      let startupName = undefined;

      if (entityType === 'startup') {
        try {
          // Get all teams for the program to find the startup
          const programTeams = await getProgramTeams(programId);

          // Find the startup in the individual startups list
          const startup = programTeams.startups_individuelles?.find(
            s => String(s.id) === String(teamId)
          );

          if (startup && startup.nom) {
            console.log(`Found startup name: ${startup.nom} for ID: ${teamId}`);
            startupName = startup.nom;
          } else {
            // Try to get the startup name from the application submissions
            try {
              const { getSubmissionsByProgram } = await import('@/services/formService');
              const submissionsResult = await getSubmissionsByProgram(programId);

              if (submissionsResult && submissionsResult.submissions) {
                const submission = submissionsResult.submissions.find(
                  (s: any) => String(s.id) === String(teamId)
                );

                if (submission && submission.teamName && submission.teamName !== 'utilisateur') {
                  console.log(`Found submission name: ${submission.teamName} for ID: ${teamId}`);
                  startupName = submission.teamName;
                } else if (submission && submission.teamEmail) {
                  // Use email username as fallback
                  const emailUsername = submission.teamEmail.split('@')[0];
                  console.log(`Using email username as startup name: ${emailUsername} for ID: ${teamId}`);
                  startupName = emailUsername;
                }
              }
            } catch (submissionError) {
              console.error(`Error fetching submissions for startup name:`, submissionError);
            }
          }
        } catch (nameError) {
          console.error(`Error fetching startup name:`, nameError);
        }
      }

      // Create the request object with the startup name if available
      const moveRequest = {
        entiteType: entityType,
        entiteId: teamId,
        phaseNextId: firstPhase.id,
        programmeId: programId,
        // The backend expects the name in the soumission object
        ...(startupName && {
          nom_entreprise: startupName,
          // Also include it in the format the backend is looking for
          soumission: {
            nom_entreprise: startupName
          }
        })
      };

      console.log(`Moving entity to phase with request:`, moveRequest);
      const result = await moveToPhase(moveRequest);

      // If we sent a name but the backend still used "Startup X", make sure we use our name
      if (startupName && result.nom && result.nom.startsWith('Startup ')) {
        console.log(`Using our name "${startupName}" instead of backend name "${result.nom}"`);
        result.nom = startupName;

        // Also add the team name to the result
        result.teamName = startupName;
      }

      console.log(`Team ${teamId} successfully assigned to phase:`, result);

      // Return the updated phase information
      return {
        phase_id: firstPhase.id,
        nom: firstPhase.nom,
        description: firstPhase.description
      };
    } catch (moveError) {
      console.error(`Error assigning team ${teamId} to phase:`, moveError);
      return {
        phase_id: null,
        nom: "Non assigné",
        description: "Erreur lors de l'assignation à une phase"
      };
    }
  } catch (error) {
    console.error(`Error ensuring team ${teamId} has a phase:`, error);
    return {
      phase_id: null,
      nom: "Non assigné",
      description: "Erreur lors de la vérification de phase"
    };
  }
}

/**
 * Gets a specific team by ID from the program teams
 * @param programId The ID of the program
 * @param teamId The ID of the team to find
 * @returns A promise that resolves to the team if found, or null if not found
 */
export async function getTeamFromProgram(programId: string | number, teamId: string | number): Promise<BackendTeam | null> {
  console.log(`Looking for team ${teamId} in program ${programId}`);

  try {
    // Get all teams for the program
    const programTeams = await getProgramTeams(programId);

    // Find the specific team by ID
    const team = programTeams.equipes.find(team => String(team.id) === String(teamId));

    if (team) {
      console.log('Team found:', team);
      return team;
    } else {
      console.log(`Team ${teamId} not found in program ${programId}`);
      return null;
    }
  } catch (error) {
    console.error('Error finding team in program:', error);
    return null;
  }
}

/**
 * Checks if a submission has been accepted and updates its status to 'approved'
 * @param submissionId The ID of the submission to check
 * @param programId The ID of the program
 * @returns A promise that resolves to an object with acceptance status and team information
 */
export async function checkSubmissionAccepted(
  submissionId: string | number,
  programId: string | number
): Promise<{
  accepted: boolean;
  teamInfo?: {
    id: number;
    name: string;
    type: 'team' | 'individual';
  }
}> {
  console.log(`Checking if submission ${submissionId} has been accepted in program ${programId}`);

  try {
    // Get all teams and individual startups for the program
    const programTeams = await getProgramTeams(programId);

    // Check if the submission is in any team
    const teamWithSubmission = programTeams.equipes.find(team =>
      team.membres && team.membres.some(membreId => String(membreId) === String(submissionId))
    );

    if (teamWithSubmission) {
      console.log(`Submission ${submissionId} is part of team ${teamWithSubmission.nom_equipe} (ID: ${teamWithSubmission.id})`);
      return {
        accepted: true,
        teamInfo: {
          id: teamWithSubmission.id,
          name: teamWithSubmission.nom_equipe,
          type: 'team'
        }
      };
    }

    // Check if the submission is an individual startup in the program
    const individualStartup = programTeams.startups_individuelles.find(
      startup => String(startup.id) === String(submissionId)
    );

    if (individualStartup) {
      console.log(`Submission ${submissionId} is an individual startup: ${individualStartup.nom}`);
      // For individual startups, we don't include teamInfo
      return {
        accepted: true
        // No teamInfo for individual startups
      };
    }

    // If we get here, the submission is not accepted
    console.log(`Submission ${submissionId} is not accepted in program ${programId}`);
    return { accepted: false };
  } catch (error) {
    console.error(`Error checking if submission ${submissionId} is accepted:`, error);
    return { accepted: false };
  }
}

/**
 * Checks if a team is a winner in a program
 * @param teamId The ID of the team to check
 * @param programId The ID of the program
 * @returns A promise that resolves to true if the team is a winner, false otherwise
 */
export async function checkIfTeamIsWinner(teamId: string | number, programId: string | number): Promise<boolean> {
  console.log(`Checking if team ${teamId} is a winner in program ${programId}`);

  try {
    // First, get the phases for the program
    const { getPhases } = await import('@/services/programService');
    const phases = await getPhases(programId);

    if (!phases || phases.length === 0) {
      console.log(`No phases found for program ${programId}`);
      return false;
    }

    // Get the last phase
    const lastPhase = phases[phases.length - 1];
    console.log(`Last phase for program ${programId} is ${lastPhase.nom} (ID: ${lastPhase.id})`);

    // Check if the last phase has a winner
    if (lastPhase.gagnant_candidature_id) {
      console.log(`Last phase has a winner: ${lastPhase.gagnant_candidature_id}`);

      // Check if the winner is the team we're looking for
      const isWinner = String(lastPhase.gagnant_candidature_id) === String(teamId);
      console.log(`Team ${teamId} is ${isWinner ? '' : 'not '}the winner`);

      return isWinner;
    } else {
      console.log(`Last phase does not have a winner yet`);
      return false;
    }
  } catch (error) {
    console.error(`Error checking if team ${teamId} is a winner:`, error);
    return false;
  }
}