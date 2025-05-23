/**
 * Script to test the GET endpoint for retrieving winner information
 * 
 * This script:
 * 1. Finds a program with a winner
 * 2. Tests the GET endpoint to retrieve the winner information
 * 3. If no winner is found, sets a winner and then tests the endpoint
 * 
 * Usage: 
 * - Run with Node.js: node test-get-winner.js
 */

import fetch from 'node-fetch';
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './vrbl.env' });

// API base URL
const API_BASE_URL = 'http://localhost:8083/api';

// Database connection
const pool = new pg.Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'sarah2004',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'accelera',
});

// Helper function to make API requests
async function apiRequest(method, endpoint, data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  return response;
}

// Main test function
async function testGetWinner() {
  try {
    console.log('Starting test for GET winner endpoint...');
    
    // Step 1: Find a program with a winner
    console.log('\n1. Finding a program with a winner...');
    const { rows: programsWithWinners } = await pool.query(`
      SELECT p.id AS programme_id, p.nom AS programme_nom, ph.id AS phase_id, 
             ph.gagnant_candidature_id, c.nom_equipe AS candidature_nom
      FROM app_schema.programme p
      JOIN app_schema.phase ph ON p.id = ph.programme_id
      LEFT JOIN app_schema.candidatures c ON ph.gagnant_candidature_id = c.id
      WHERE ph.gagnant_candidature_id IS NOT NULL
      LIMIT 1
    `);
    
    let programId, phaseId, candidatureId;
    
    if (programsWithWinners.length > 0) {
      programId = programsWithWinners[0].programme_id;
      phaseId = programsWithWinners[0].phase_id;
      candidatureId = programsWithWinners[0].gagnant_candidature_id;
      console.log(`Found program with ID: ${programId} that has a winner: ${programsWithWinners[0].candidature_nom} (ID: ${candidatureId})`);
    } else {
      console.log('No programs with winners found. Finding a program and setting a winner...');
      
      // Find any program with phases
      const { rows: programs } = await pool.query(`
        SELECT p.id AS programme_id, p.nom AS programme_nom, ph.id AS phase_id
        FROM app_schema.programme p
        JOIN app_schema.phase ph ON p.id = ph.programme_id
        LIMIT 1
      `);
      
      if (programs.length === 0) {
        throw new Error('No programs with phases found in the database.');
      }
      
      programId = programs[0].programme_id;
      phaseId = programs[0].phase_id;
      
      console.log(`Found program with ID: ${programId} and phase with ID: ${phaseId}`);
      
      // Find or create a candidature for this program
      const { rows: candidatures } = await pool.query(`
        SELECT id, nom_equipe FROM app_schema.candidatures
        WHERE programme_id = $1
        LIMIT 1
      `, [programId]);
      
      if (candidatures.length > 0) {
        candidatureId = candidatures[0].id;
        console.log(`Found candidature with ID: ${candidatureId} (${candidatures[0].nom_equipe})`);
      } else {
        console.log('No candidatures found for this program. Creating a test candidature...');
        
        const { rows: newCandidature } = await pool.query(`
          INSERT INTO app_schema.candidatures (nom_equipe, description_equipe, programme_id, type)
          VALUES ($1, $2, $3, $4)
          RETURNING id, nom_equipe
        `, [
          `Test Winner Candidature ${Date.now()}`,
          'A test candidature for testing winner retrieval',
          programId,
          'startup_individuelle'
        ]);
        
        candidatureId = newCandidature[0].id;
        console.log(`Created test candidature with ID: ${candidatureId} (${newCandidature[0].nom_equipe})`);
        
        // Find a startup user
        const { rows: startupUsers } = await pool.query(`
          SELECT u.id, u.email
          FROM app_schema.utilisateur u
          WHERE u.role = 'startup'
          LIMIT 1
        `);
        
        if (startupUsers.length > 0) {
          const startupUserId = startupUsers[0].id;
          
          // Create a submission
          const { rows: submission } = await pool.query(`
            INSERT INTO app_schema.soumissions (formulaire_id, utilisateur_id, role, created_at)
            VALUES (1, $1, 'startup', CURRENT_TIMESTAMP)
            RETURNING id
          `, [startupUserId]);
          
          // Associate the submission with the candidature
          await pool.query(`
            INSERT INTO app_schema.candidatures_membres (candidatures_id, soumission_id)
            VALUES ($1, $2)
          `, [candidatureId, submission[0].id]);
          
          console.log(`Associated startup user ${startupUserId} with candidature ${candidatureId}.`);
        }
      }
      
      // Set the candidature as the winner of the phase
      console.log(`Setting candidature ${candidatureId} as winner of phase ${phaseId}...`);
      await pool.query(`
        UPDATE app_schema.phase
        SET gagnant_candidature_id = $1
        WHERE id = $2
      `, [candidatureId, phaseId]);
      
      console.log(`Set candidature ${candidatureId} as winner of phase ${phaseId}.`);
    }
    
    // Step 2: Test the GET endpoint
    console.log('\n2. Testing GET /CandidaturePhase/programme/:programmeId/gagnant endpoint...');
    const getWinnerResponse = await apiRequest('GET', `/CandidaturePhase/programme/${programId}/gagnant`);
    
    if (!getWinnerResponse.ok) {
      const error = await getWinnerResponse.json();
      console.log(`❌ GET endpoint failed: ${JSON.stringify(error)}`);
      
      // Check if the candidaturePhase.getProgrammeWinner method is working correctly
      console.log('\nChecking the database query directly...');
      const { rows } = await pool.query(`
        SELECT
          c.id AS candidature_id,
          c.nom_equipe,
          c.type,
          p.nom AS phase_nom
        FROM app_schema.phase p
        JOIN app_schema.candidatures c ON p.gagnant_candidature_id = c.id
        WHERE p.programme_id = $1
        ORDER BY p.date_fin DESC
        LIMIT 1
      `, [programId]);
      
      if (rows.length === 0) {
        console.log('❌ No winner found in the database using the direct query.');
      } else {
        console.log('✅ Winner found in the database using the direct query:');
        console.log(rows[0]);
        
        console.log('\nThe issue is likely in the controller or route implementation.');
      }
    } else {
      const winnerInfo = await getWinnerResponse.json();
      console.log('✅ GET endpoint successful. Winner information:');
      console.log(JSON.stringify(winnerInfo, null, 2));
    }
    
    // Step 3: Check if the candidaturePhase model has the correct method
    console.log('\n3. Checking if the candidaturePhase model has the correct method...');
    
    // Get the source code of the candidaturePhase model
    const { rows: modelSource } = await pool.query(`
      SELECT pg_read_file('src/models/candidaturePhase.js') AS source
    `);
    
    if (modelSource.length > 0 && modelSource[0].source) {
      const source = modelSource[0].source;
      if (source.includes('getProgrammeWinner')) {
        console.log('✅ candidaturePhase model has the getProgrammeWinner method.');
      } else {
        console.log('❌ candidaturePhase model does not have the getProgrammeWinner method.');
      }
    } else {
      console.log('Could not read the source code of the candidaturePhase model.');
    }
    
    console.log('\nTest completed!');
    
  } catch (error) {
    console.error('Test failed with error:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the test
testGetWinner();
