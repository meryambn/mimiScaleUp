/**
 * Advanced test script for the GET endpoints of the livrable_soumission module
 * 
 * This script tests:
 * 1. GET /api/livrable-soumissions/livrable/:livrableId - Get submissions by livrable ID
 * 2. GET /api/livrable-soumissions/equipe/:candidatureId - Get submissions by team ID
 * 3. GET /api/livrable-soumissions/telecharger/:soumissionId - Download a submitted file
 * 
 * Including error handling and edge cases:
 * - Invalid IDs
 * - Non-existent resources
 * - Unauthorized access (if applicable)
 * 
 * Usage: 
 * - Run with Node.js: node tests/livrable_soumission_get_advanced_test.js
 */

import { LivrableSoumission } from '../src/models/livrableSoumission.js';
import { liverable } from '../src/models/liverable.js';
import pool from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

// Obtenir le chemin du répertoire actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API base URL
const API_BASE_URL = 'http://localhost:8083/api';

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

// Fonction pour créer un livrable de test
async function createTestLivrable(phaseId) {
  const testLivrable = new liverable(
    null,
    'Livrable de test avancé pour GET',
    'Description du livrable de test avancé pour GET',
    '2024-12-31',
    ['.pdf', '.docx', '.txt'],
    phaseId
  );

  return await liverable.create(testLivrable);
}

// Fonction pour créer une soumission de test
async function createTestSoumission(livrableId, candidatureId) {
  // Créer un fichier de test
  const uploadsDir = path.join(__dirname, '../uploads/livrables');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const testFilePath = path.join(uploadsDir, 'test-get-advanced-file.txt');
  fs.writeFileSync(testFilePath, 'Contenu du fichier de test avancé pour GET');

  const testSoumission = new LivrableSoumission(
    null,
    livrableId,
    candidatureId,
    'test-get-advanced-file.txt',
    testFilePath,
    new Date()
  );

  return await LivrableSoumission.create(testSoumission);
}

// Test function for GET /api/livrable-soumissions/livrable/:livrableId
async function testGetSoumissionsByLivrable(livrableId) {
  console.log(`\nTesting GET /api/livrable-soumissions/livrable/${livrableId}...`);
  
  try {
    const response = await apiRequest('GET', `/livrable-soumissions/livrable/${livrableId}`);
    
    if (!response.ok) {
      const error = await response.text();
      console.log(`❌ GET endpoint failed: ${error}`);
      return false;
    }
    
    const soumissions = await response.json();
    console.log(`✅ GET endpoint successful. Found ${soumissions.length} submission(s).`);
    
    if (soumissions.length > 0) {
      console.log('First submission details:');
      console.log(`  - ID: ${soumissions[0].id}`);
      console.log(`  - Nom fichier: ${soumissions[0].nom_fichier}`);
      console.log(`  - Nom équipe: ${soumissions[0].nom_equipe}`);
      console.log(`  - Nom livrable: ${soumissions[0].nom_livrable}`);
    }
    
    return soumissions.length > 0;
  } catch (error) {
    console.error('❌ Error testing GET by livrable:', error);
    return false;
  }
}

// Test function for GET /api/livrable-soumissions/livrable/:livrableId with invalid ID
async function testGetSoumissionsByLivrableInvalidId() {
  console.log(`\nTesting GET /api/livrable-soumissions/livrable/invalid...`);
  
  try {
    const response = await apiRequest('GET', `/livrable-soumissions/livrable/invalid`);
    
    if (response.status === 400 || response.status === 404) {
      console.log(`✅ GET endpoint correctly rejected invalid livrable ID with status ${response.status}`);
      return true;
    } else {
      console.log(`❌ GET endpoint did not properly handle invalid livrable ID. Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing GET with invalid livrable ID:', error);
    return false;
  }
}

// Test function for GET /api/livrable-soumissions/livrable/:livrableId with non-existent ID
async function testGetSoumissionsByLivrableNonExistentId() {
  const nonExistentId = 999999;
  console.log(`\nTesting GET /api/livrable-soumissions/livrable/${nonExistentId}...`);
  
  try {
    const response = await apiRequest('GET', `/livrable-soumissions/livrable/${nonExistentId}`);
    
    if (response.ok) {
      const soumissions = await response.json();
      if (Array.isArray(soumissions) && soumissions.length === 0) {
        console.log(`✅ GET endpoint correctly returned empty array for non-existent livrable ID`);
        return true;
      } else {
        console.log(`❌ GET endpoint did not return empty array for non-existent livrable ID`);
        return false;
      }
    } else {
      console.log(`❌ GET endpoint failed for non-existent livrable ID with status ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing GET with non-existent livrable ID:', error);
    return false;
  }
}

// Test function for GET /api/livrable-soumissions/equipe/:candidatureId
async function testGetSoumissionsByEquipe(candidatureId) {
  console.log(`\nTesting GET /api/livrable-soumissions/equipe/${candidatureId}...`);
  
  try {
    const response = await apiRequest('GET', `/livrable-soumissions/equipe/${candidatureId}`);
    
    if (!response.ok) {
      const error = await response.text();
      console.log(`❌ GET endpoint failed: ${error}`);
      return false;
    }
    
    const soumissions = await response.json();
    console.log(`✅ GET endpoint successful. Found ${soumissions.length} submission(s).`);
    
    if (soumissions.length > 0) {
      console.log('First submission details:');
      console.log(`  - ID: ${soumissions[0].id}`);
      console.log(`  - Nom fichier: ${soumissions[0].nom_fichier}`);
      console.log(`  - Nom livrable: ${soumissions[0].nom_livrable}`);
    }
    
    return soumissions.length > 0;
  } catch (error) {
    console.error('❌ Error testing GET by équipe:', error);
    return false;
  }
}

// Test function for GET /api/livrable-soumissions/equipe/:candidatureId with invalid ID
async function testGetSoumissionsByEquipeInvalidId() {
  console.log(`\nTesting GET /api/livrable-soumissions/equipe/invalid...`);
  
  try {
    const response = await apiRequest('GET', `/livrable-soumissions/equipe/invalid`);
    
    if (response.status === 400 || response.status === 404) {
      console.log(`✅ GET endpoint correctly rejected invalid équipe ID with status ${response.status}`);
      return true;
    } else {
      console.log(`❌ GET endpoint did not properly handle invalid équipe ID. Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing GET with invalid équipe ID:', error);
    return false;
  }
}

// Test function for GET /api/livrable-soumissions/telecharger/:soumissionId
async function testTelechargerFichier(soumissionId) {
  console.log(`\nTesting GET /api/livrable-soumissions/telecharger/${soumissionId}...`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/livrable-soumissions/telecharger/${soumissionId}`);
    
    if (!response.ok) {
      const error = await response.text();
      console.log(`❌ GET download endpoint failed: ${error}`);
      return false;
    }
    
    const contentType = response.headers.get('content-type');
    const contentDisposition = response.headers.get('content-disposition');
    const buffer = await response.buffer();
    
    console.log(`✅ GET download endpoint successful.`);
    console.log(`  - Content-Type: ${contentType}`);
    console.log(`  - Content-Disposition: ${contentDisposition}`);
    console.log(`  - File size: ${buffer.length} bytes`);
    
    return true;
  } catch (error) {
    console.error('❌ Error testing file download:', error);
    return false;
  }
}

// Test function for GET /api/livrable-soumissions/telecharger/:soumissionId with non-existent ID
async function testTelechargerFichierNonExistentId() {
  const nonExistentId = 999999;
  console.log(`\nTesting GET /api/livrable-soumissions/telecharger/${nonExistentId}...`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/livrable-soumissions/telecharger/${nonExistentId}`);
    
    if (response.status === 404) {
      console.log(`✅ GET download endpoint correctly returned 404 for non-existent soumission ID`);
      return true;
    } else {
      console.log(`❌ GET download endpoint did not return 404 for non-existent soumission ID. Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing file download with non-existent ID:', error);
    return false;
  }
}

// Fonction principale de test
async function runTests() {
  try {
    console.log('Démarrage des tests GET avancés pour le module de soumission de livrables...');

    // 1. Vérifier si la table existe
    const { rows: tableCheck } = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'app_schema'
        AND table_name = 'livrable_soumissions'
      );
    `);

    if (!tableCheck[0].exists) {
      console.error('La table livrable_soumissions n\'existe pas. Veuillez exécuter la migration d\'abord.');
      process.exit(1);
    }

    console.log('✅ La table livrable_soumissions existe.');

    // 2. Récupérer ou créer une phase et une candidature pour les tests
    let phaseId;
    let candidatureId;
    let programmeId;

    // Vérifier si une phase existe
    const { rows: phases } = await pool.query('SELECT id, programme_id FROM app_schema.phase LIMIT 1');
    if (phases.length === 0) {
      console.error('Aucune phase trouvée. Veuillez exécuter le test principal d\'abord.');
      process.exit(1);
    }
    
    phaseId = phases[0].id;
    programmeId = phases[0].programme_id;
    console.log(`✅ Phase trouvée avec ID: ${phaseId}, Programme ID: ${programmeId}`);
    
    // Vérifier si une candidature existe
    const { rows: candidatures } = await pool.query('SELECT id FROM app_schema.candidatures LIMIT 1');
    if (candidatures.length === 0) {
      console.error('Aucune candidature trouvée. Veuillez exécuter le test principal d\'abord.');
      process.exit(1);
    }
    
    candidatureId = candidatures[0].id;
    console.log(`✅ Candidature trouvée avec ID: ${candidatureId}`);
    
    // 3. Créer un livrable de test
    const livrableId = await createTestLivrable(phaseId);
    console.log(`✅ Livrable de test créé avec ID: ${livrableId}`);
    
    // 4. Créer une soumission de test
    const soumission = await createTestSoumission(livrableId, candidatureId);
    console.log(`✅ Soumission de test créée avec ID: ${soumission.id}`);
    
    // 5. Tester les endpoints GET - Cas normaux
    let testResults = {
      getByLivrable: await testGetSoumissionsByLivrable(livrableId),
      getByEquipe: await testGetSoumissionsByEquipe(candidatureId),
      telecharger: await testTelechargerFichier(soumission.id),
      
      // 6. Tester les endpoints GET - Cas d'erreur
      getByLivrableInvalidId: await testGetSoumissionsByLivrableInvalidId(),
      getByLivrableNonExistentId: await testGetSoumissionsByLivrableNonExistentId(),
      getByEquipeInvalidId: await testGetSoumissionsByEquipeInvalidId(),
      telechargerNonExistentId: await testTelechargerFichierNonExistentId()
    };
    
    // 7. Afficher le résumé des tests
    console.log('\n=== Résumé des tests ===');
    console.log('Cas normaux:');
    console.log(`GET par livrable: ${testResults.getByLivrable ? '✅ Réussi' : '❌ Échoué'}`);
    console.log(`GET par équipe: ${testResults.getByEquipe ? '✅ Réussi' : '❌ Échoué'}`);
    console.log(`Téléchargement de fichier: ${testResults.telecharger ? '✅ Réussi' : '❌ Échoué'}`);
    
    console.log('\nCas d\'erreur:');
    console.log(`GET par livrable (ID invalide): ${testResults.getByLivrableInvalidId ? '✅ Réussi' : '❌ Échoué'}`);
    console.log(`GET par livrable (ID inexistant): ${testResults.getByLivrableNonExistentId ? '✅ Réussi' : '❌ Échoué'}`);
    console.log(`GET par équipe (ID invalide): ${testResults.getByEquipeInvalidId ? '✅ Réussi' : '❌ Échoué'}`);
    console.log(`Téléchargement (ID inexistant): ${testResults.telechargerNonExistentId ? '✅ Réussi' : '❌ Échoué'}`);
    
    // 8. Nettoyage (suppression des données de test)
    await pool.query('DELETE FROM app_schema.livrable_soumissions WHERE id = $1', [soumission.id]);
    await pool.query('DELETE FROM app_schema.livrables WHERE id = $1', [livrableId]);
    
    // Supprimer le fichier de test
    try {
      if (fs.existsSync(soumission.chemin_fichier)) {
        fs.unlinkSync(soumission.chemin_fichier);
        console.log(`✅ Fichier de test supprimé: ${soumission.chemin_fichier}`);
      }
    } catch (error) {
      console.error(`Erreur lors de la suppression du fichier de test: ${error.message}`);
    }
    
    console.log('✅ Nettoyage des données de test effectué');
    
    // Vérifier si tous les tests ont réussi
    const allTestsPassed = Object.values(testResults).every(result => result === true);
    
    if (allTestsPassed) {
      console.log('✅ Tous les tests GET avancés ont réussi!');
      process.exit(0);
    } else {
      console.log('❌ Certains tests ont échoué. Veuillez vérifier les résultats ci-dessus.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
    process.exit(1);
  } finally {
    // Fermer la connexion à la base de données
    await pool.end();
  }
}

// Exécuter les tests
runTests();
