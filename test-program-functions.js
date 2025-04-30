const { createCritere, createReunion, createLivrable } = require('./mimiScaleUp-master/client/src/services/programService.ts');

// Sample phase ID - replace with a real phase ID from your database
const phaseId = 1; // Change this to a valid phase ID

// Test evaluation criteria creation
async function testCreateCritere() {
  try {
    console.log('Testing evaluation criteria creation...');
    const criteriaData = {
      nom_critere: 'Test Criterion',
      type: 'etoiles', // Valid types: 'numerique', 'etoiles', 'oui_non', 'liste_deroulante'
      poids: 10,
      accessible_mentors: true,
      accessible_equipes: false,
      rempli_par: 'mentors',
      necessite_validation: false
    };

    console.log('Criteria data:', criteriaData);
    const result = await createCritere(phaseId, criteriaData);
    console.log('Criteria creation result:', result);
    return result;
  } catch (error) {
    console.error('Error testing criteria creation:', error);
  }
}

// Test reunion (meeting) creation
async function testCreateReunion() {
  try {
    console.log('Testing reunion creation...');
    const reunionData = {
      nom_reunion: 'Test Meeting',
      date: '2025-05-15',
      heure: '14:00',
      lieu: 'Conference Room A'
    };

    console.log('Reunion data:', reunionData);
    const result = await createReunion(phaseId, reunionData);
    console.log('Reunion creation result:', result);
    return result;
  } catch (error) {
    console.error('Error testing reunion creation:', error);
  }
}

// Test deliverable creation
async function testCreateLivrable() {
  try {
    console.log('Testing deliverable creation...');
    const livrableData = {
      nom: 'Test Deliverable',
      description: 'This is a test deliverable',
      date_echeance: '2025-05-30',
      types_fichiers: ['.pdf', '.docx', '.pptx']
    };

    console.log('Livrable data:', livrableData);
    const result = await createLivrable(phaseId, livrableData);
    console.log('Livrable creation result:', result);
    return result;
  } catch (error) {
    console.error('Error testing livrable creation:', error);
  }
}

// Run all tests
async function runTests() {
  console.log('===== TESTING PROGRAM FUNCTIONS =====');
  
  console.log('\n----- TESTING CRITERIA -----');
  await testCreateCritere();
  
  console.log('\n----- TESTING REUNION -----');
  await testCreateReunion();
  
  console.log('\n----- TESTING LIVRABLE -----');
  await testCreateLivrable();
  
  console.log('\n===== TESTS COMPLETED =====');
}

runTests();
