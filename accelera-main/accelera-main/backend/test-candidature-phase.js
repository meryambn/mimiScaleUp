// Test script to diagnose issues with team current phase for program ID 197
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import pool from './db.js';

dotenv.config({ path: './vrbl.env' });

// Use the same host as the running server
const API_BASE_URL = 'http://localhost:5173/api';

// Function to get program teams directly from database
async function getProgramTeams(programId) {
  try {
    console.log(`Fetching teams for program ID: ${programId} directly from database`);

    // Get teams (candidatures) for this program
    const { rows: teams } = await pool.query(
      `SELECT * FROM app_schema.candidatures
       WHERE programme_id = $1`,
      [programId]
    );

    console.log(`Found ${teams.length} teams for program ${programId}`);

    // Get individual startups for this program
    const { rows: individualStartups } = await pool.query(
      `SELECT ps.soumission_id as id, s.nom_entreprise as nom
       FROM app_schema.programme_soumissions ps
       JOIN app_schema.soumissions sm ON ps.soumission_id = sm.id
       JOIN app_schema.startups s ON sm.utilisateur_id = s.utilisateur_id
       WHERE ps.programme_id = $1
       AND NOT EXISTS (
         SELECT 1 FROM app_schema.candidatures_membres cm
         WHERE cm.soumission_id = ps.soumission_id
       )`,
      [programId]
    );

    console.log(`Found ${individualStartups.length} individual startups for program ${programId}`);

    // Get team members
    const teamsWithMembers = await Promise.all(
      teams.map(async (team) => {
        const { rows: members } = await pool.query(
          `SELECT soumission_id FROM app_schema.candidatures_membres
           WHERE candidatures_id = $1`,
          [team.id]
        );

        return {
          id: team.id,
          nom_equipe: team.nom_equipe,
          membres: members.map(m => m.soumission_id)
        };
      })
    );

    const result = {
      equipes: teamsWithMembers,
      startups_individuelles: individualStartups
    };

    console.log('Teams fetched successfully:', result);
    return result;
  } catch (error) {
    console.error('Exception during fetching program teams from database:', error);
    return { startups_individuelles: [], equipes: [] };
  }
}

// Function to get team current phase
async function getTeamCurrentPhase(candidatureId) {
  try {
    console.log(`Fetching current phase for team ID: ${candidatureId}`);
    const response = await fetch(`${API_BASE_URL}/CandidaturePhase/current/${candidatureId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      console.error('Error fetching team current phase:', errorData);
      throw new Error(errorData.error || `HTTP Error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Team current phase fetched successfully:', result);
    return result;
  } catch (error) {
    console.error('Exception during fetching team current phase:', error);
    return null;
  }
}

// Function to check if candidature exists in database directly
async function checkCandidatureExists(candidatureId) {
  try {
    console.log(`Checking if candidature ID ${candidatureId} exists in database`);
    const { rows } = await pool.query(
      "SELECT * FROM app_schema.candidatures WHERE id = $1",
      [candidatureId]
    );

    const exists = rows.length > 0;
    console.log(`Candidature ID ${candidatureId} exists: ${exists}`);

    if (exists) {
      console.log(`Candidature details:`, rows[0]);
    }

    return exists;
  } catch (error) {
    console.error('Exception during checking candidature:', error);
    return false;
  }
}

// Function to check if candidature has phases directly
async function checkCandidaturePhases(candidatureId) {
  try {
    console.log(`Checking phases for candidature ID ${candidatureId}`);
    const { rows } = await pool.query(
      `SELECT cp.phase_id, p.nom, p.description, cp.date_passage
       FROM app_schema.candidatures_phases cp
       JOIN app_schema.phase p ON cp.phase_id = p.id
       WHERE cp.candidature_id = $1
       ORDER BY cp.date_passage`,
      [candidatureId]
    );

    console.log(`Found ${rows.length} phases for candidature ID ${candidatureId}`);

    if (rows.length > 0) {
      console.log(`Phase details:`, rows);
    }

    return rows;
  } catch (error) {
    console.error('Exception during checking candidature phases:', error);
    return [];
  }
}

// Function to check if the candidatures_phases table exists and its structure
async function checkCandidaturePhasesTable() {
  try {
    console.log(`Checking candidatures_phases table structure`);
    const { rows } = await pool.query(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_schema = 'app_schema'
       AND table_name = 'candidatures_phases'`
    );

    console.log(`candidatures_phases table columns:`, rows);

    // Check if the table has any rows
    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) FROM app_schema.candidatures_phases`
    );

    console.log(`candidatures_phases table has ${countRows[0].count} rows`);

    return rows;
  } catch (error) {
    console.error('Exception during checking candidatures_phases table:', error);
    return [];
  }
}

// Function to check if the candidature is linked to a program
async function checkCandidatureProgram(candidatureId) {
  try {
    console.log(`Checking program for candidature ID ${candidatureId}`);
    const { rows } = await pool.query(
      `SELECT c.id, c.nom_equipe, c.programme_id, p.nom as programme_nom
       FROM app_schema.candidatures c
       JOIN app_schema.programme p ON c.programme_id = p.id
       WHERE c.id = $1`,
      [candidatureId]
    );

    if (rows.length > 0) {
      console.log(`Candidature ${candidatureId} is linked to program:`, rows[0]);
    } else {
      console.log(`Candidature ${candidatureId} is not linked to any program`);
    }

    return rows[0];
  } catch (error) {
    console.error('Exception during checking candidature program:', error);
    return null;
  }
}

// Main test function
async function runTest() {
  const programId = 197;

  console.log(`\n=== TESTING PROGRAM ID: ${programId} ===\n`);

  // First check the candidatures_phases table structure
  await checkCandidaturePhasesTable();

  // Step 1: Get all teams for the program
  const teams = await getProgramTeams(programId);

  // Step 2: Test each team's current phase
  if (teams.equipes && teams.equipes.length > 0) {
    console.log(`\n=== TESTING ${teams.equipes.length} TEAMS ===\n`);

    for (const team of teams.equipes) {
      console.log(`\n--- Testing team: ${team.nom_equipe} (ID: ${team.id}) ---`);

      // Check if candidature exists
      const candidatureExists = await checkCandidatureExists(team.id);

      if (candidatureExists) {
        // Check candidature program
        await checkCandidatureProgram(team.id);

        // Check candidature phases
        const phases = await checkCandidaturePhases(team.id);

        if (phases.length === 0) {
          console.log(`WARNING: No phases found for candidature ID ${team.id}!`);
        }

        // Get current phase
        const phaseData = await getTeamCurrentPhase(team.id);
        console.log(`Current phase result:`, phaseData);
      } else {
        console.log(`ERROR: Candidature ID ${team.id} does not exist in the database!`);
      }
    }
  } else {
    console.log('No teams found for this program');
  }

  // Step 3: Test each individual startup's current phase
  if (teams.startups_individuelles && teams.startups_individuelles.length > 0) {
    console.log(`\n=== TESTING ${teams.startups_individuelles.length} INDIVIDUAL STARTUPS ===\n`);

    for (const startup of teams.startups_individuelles) {
      console.log(`\n--- Testing startup: ${startup.nom} (ID: ${startup.id}) ---`);

      // Check if candidature exists
      const candidatureExists = await checkCandidatureExists(startup.id);

      if (candidatureExists) {
        // Check candidature program
        await checkCandidatureProgram(startup.id);

        // Check candidature phases
        const phases = await checkCandidaturePhases(startup.id);

        if (phases.length === 0) {
          console.log(`WARNING: No phases found for candidature ID ${startup.id}!`);
        }

        // Get current phase
        const phaseData = await getTeamCurrentPhase(startup.id);
        console.log(`Current phase result:`, phaseData);
      } else {
        console.log(`ERROR: Candidature ID ${startup.id} does not exist in the database!`);
      }
    }
  } else {
    console.log('No individual startups found for this program');
  }

  // Close the database connection
  await pool.end();
}

// Run the test
runTest().catch(error => {
  console.error('Test failed with error:', error);
  pool.end();
});
