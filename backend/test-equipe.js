import fetch from 'node-fetch';

// First, let's check if we can get a list of startups to find a valid ID
async function getStartups() {
  try {
    const response = await fetch('http://localhost:8083/api/auth/startups');
    if (response.ok) {
      const data = await response.json();
      console.log('Available startups:', data);
      return data;
    } else {
      console.log('Could not get startups list');
      return [];
    }
  } catch (error) {
    console.error('Error getting startups:', error);
    return [];
  }
}

// Test adding a team member to a startup
async function testAddEquipe() {
  try {
    // Try to get a valid startup ID first
    const startups = await getStartups();
    let userId = 6; // Use ID 6 which we know exists from our debug script

    if (startups && startups.length > 0) {
      // Use the ID of the first startup in the list
      userId = startups[0].id || startups[0].utilisateur_id;
      console.log(`Using startup ID: ${userId}`);
    } else {
      console.log(`Using default startup ID: ${userId}`);
    }

    console.log(`Sending request to: http://localhost:8083/api/profile/startup/${userId}/equipe`);
    console.log('Request body:', {
      matricule: 12345,
      nom: 'Doe',
      prenom: 'John'
    });

    const response = await fetch(`http://localhost:8083/api/profile/startup/${userId}/equipe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        matricule: 12345,
        nom: 'Doe',
        prenom: 'John'
      })
    });

    console.log('Response status:', response.status);

    const data = await response.json();
    console.log('Response data:', data);

    if (response.ok) {
      console.log('✅ Test passed: Successfully added team member');
    } else {
      console.log('❌ Test failed: Could not add team member');
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
testAddEquipe();
