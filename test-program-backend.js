import fetch from 'node-fetch';

// Test data with minimal fields to identify the issue
// Format exactly as needed
const testProgram = {
  "type": "Accélération",
  "nom": "Test Program",
  "description": "Test description",
  "date_debut": "2025-04-27",
  "date_fin": "2025-07-26",
  "phases_requises": ["Pre-seed"],
  "industries_requises": ["Technology"],
  "documents_requis": ["Pitch Deck"],
  "taille_equipe_min": 1,
  "taille_equipe_max": 5,
  "ca_min": 0,
  "ca_max": 100000,
  "admin_id": 1
};

// Function to test program creation
async function testProgramCreation() {
  try {
    console.log('Testing program creation with the following data:');
    console.log(JSON.stringify(testProgram, null, 2));

    // Use the exact JSON string format
    const jsonString = JSON.stringify(testProgram);
    console.log('JSON string being sent:', jsonString);

    const response = await fetch('http://localhost:8083/api/programmes/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: jsonString,
    });

    // Log the raw response
    const responseText = await response.text();
    console.log('Raw response:', responseText);

    // Try to parse the response as JSON if possible
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('Parsed response:', data);
    } catch (e) {
      console.log('Response is not valid JSON');
    }

    if (response.ok) {
      console.log('Program created successfully!');
    } else {
      console.error('Failed to create program');
      console.error('Status:', response.status);
    }
  } catch (error) {
    console.error('Error during test:', error.message);
  }
}

// Run the test
testProgramCreation();
