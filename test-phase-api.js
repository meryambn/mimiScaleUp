// This is a simple script to test the creation of entities for a phase
// To run this, you'll need to:
// 1. Replace the phaseId with a valid phase ID from your database
// 2. Ensure the API_BASE_URL matches your backend URL

// API Base URL - adjust as needed
let API_BASE_URL = "http://localhost:8083/api";

// Valid phase ID to test with - REPLACE THIS with a real phase ID
let phaseId = 1; 

// Allow these to be updated from the HTML page
if (typeof window !== 'undefined') {
  if (window.API_BASE_URL) API_BASE_URL = window.API_BASE_URL;
  
  // Parse as integer to avoid sending HTML element object
  if (window.phaseId) {
    const parsedId = parseInt(window.phaseId, 10);
    // Make sure we have a valid number, not NaN
    if (!isNaN(parsedId) && parsedId > 0) {
      phaseId = parsedId;
    } else {
      console.error("Invalid Phase ID provided. Using default Phase ID:", phaseId);
    }
  }
  console.log("Using phaseId:", phaseId, "Type:", typeof phaseId);
}

// Helper function to parse response content
async function parseResponseContent(response) {
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch (e) {
      return await response.text();
    }
  } else {
    return await response.text();
  }
}

// Validate if we can run the tests
function canRunTests() {
  if (isNaN(phaseId) || phaseId <= 0) {
    console.error("❌ Cannot run tests: Invalid Phase ID. Please enter a valid positive number for the Phase ID.");
    return false;
  }
  return true;
}

// Test functions
async function testCreateCritere() {
  console.log('\n----- TESTING CRITERIA CREATION -----');
  
  const criteriaData = {
    nom_critere: 'Test Criterion ' + new Date().toISOString().substring(0, 19),
    type: 'etoiles', 
    poids: 10,
    accessible_mentors: true,
    accessible_equipes: false,
    rempli_par: 'mentors',
    necessite_validation: false
  };
  
  console.log('Criteria data:', criteriaData);
  
  try {
    const response = await fetch(`${API_BASE_URL}/critere/create/${phaseId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(criteriaData),
      credentials: 'include'
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const result = await parseResponseContent(response);
      console.log('Criteria created successfully:', result);
      return true;
    } else {
      const error = await parseResponseContent(response);
      console.error('Failed to create criteria:', error);
      
      // Special handling for missing phase error
      if (error && error.details && error.details.includes("invalid input syntax for type integer")) {
        console.error("❗ The Phase ID may not exist in the database. Please verify it's a valid phase ID.");
      }
      
      return false;
    }
  } catch (error) {
    console.error('Error testing criteria creation:', error);
    return false;
  }
}

async function testCreateReunion() {
  console.log('\n----- TESTING MEETING CREATION -----');
  
  // Create a meeting for tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  
  const reunionData = {
    nom_reunion: 'Test Meeting ' + new Date().toISOString().substring(0, 19),
    date: dateStr,
    heure: '14:00',
    lieu: 'Conference Room A'
  };
  
  console.log('Reunion data:', reunionData);
  
  try {
    // Using phaseId parameter for the URL
    const response = await fetch(`${API_BASE_URL}/reunion/create/${phaseId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(reunionData),
      credentials: 'include'
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const result = await parseResponseContent(response);
      console.log('Reunion created successfully:', result);
      return true;
    } else {
      const error = await parseResponseContent(response);
      console.error('Failed to create reunion:', error);
      
      // Additional error information
      if (response.status === 500) {
        console.error("❗ Server error - The Phase ID may not exist in the database or there may be other database constraints.");
      }
      
      return false;
    }
  } catch (error) {
    console.error('Error testing reunion creation:', error);
    return false;
  }
}

async function testCreateLivrable() {
  console.log('\n----- TESTING DELIVERABLE CREATION -----');
  
  // Create a deliverable due in 2 weeks
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);
  const dateStr = dueDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  
  const livrableData = {
    nom: 'Test Deliverable ' + new Date().toISOString().substring(0, 19),
    description: 'This is a test deliverable created on ' + new Date().toISOString(),
    date_echeance: dateStr,
    types_fichiers: '.pdf, .docx, .pptx'  // Comma-separated string format
  };
  
  console.log('Livrable data:', livrableData);
  
  try {
    const response = await fetch(`${API_BASE_URL}/liverable/create/${phaseId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(livrableData),
      credentials: 'include'
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const result = await parseResponseContent(response);
      console.log('Livrable created successfully:', result);
      return true;
    } else {
      const error = await parseResponseContent(response);
      console.error('Failed to create livrable:', error);
      
      // Additional error information
      if (response.status === 500) {
        console.error("❗ Server error - The Phase ID may not exist in the database or there may be other database constraints.");
      }
      
      return false;
    }
  } catch (error) {
    console.error('Error testing livrable creation:', error);
    return false;
  }
}

async function runTests() {
  console.log('===== TESTING PHASE ENTITY CREATION =====');
  console.log('Using Phase ID:', phaseId);
  console.log('API Base URL:', API_BASE_URL);
  
  // Check if we can run the tests
  if (!canRunTests()) {
    return;
  }
  
  const criteriaResult = await testCreateCritere();
  const reunionResult = await testCreateReunion();
  const livrableResult = await testCreateLivrable();
  
  console.log('\n===== TEST RESULTS =====');
  console.log('Criteria creation:', criteriaResult ? 'SUCCESS' : 'FAILED');
  console.log('Reunion creation:', reunionResult ? 'SUCCESS' : 'FAILED');
  console.log('Livrable creation:', livrableResult ? 'SUCCESS' : 'FAILED');
  
  if (criteriaResult && reunionResult && livrableResult) {
    console.log('\n✅ All tests passed! Your functions appear to be working correctly.');
  } else {
    console.log('\n❌ Some tests failed. Check the error messages above for details.');
    console.log('\nTroubleshooting tips:');
    console.log('1. Verify that the Phase ID exists in your database');
    console.log('2. Check database table constraints and relationships');
    console.log('3. Ensure your API server is running correctly');
    console.log('4. Make sure you\'re authenticated if the API requires it');
  }
}

// Run the tests when this script is loaded
console.log('Starting tests...');

// In a browser environment:
if (typeof window !== 'undefined') {
  // Add a button to the page to run the tests
  const button = document.createElement('button');
  button.textContent = 'Run API Tests';
  button.style.padding = '10px';
  button.style.margin = '20px';
  button.style.backgroundColor = '#3498db';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '4px';
  button.style.cursor = 'pointer';
  button.onclick = runTests;
  
  // Create a results div
  const resultsDiv = document.createElement('div');
  resultsDiv.id = 'api-test-results';
  resultsDiv.style.whiteSpace = 'pre';
  resultsDiv.style.fontFamily = 'monospace';
  resultsDiv.style.padding = '10px';
  resultsDiv.style.margin = '20px';
  resultsDiv.style.border = '1px solid #ddd';
  resultsDiv.style.borderRadius = '4px';
  resultsDiv.style.backgroundColor = '#f5f5f5';
  
  // Replace console.log with a function that also outputs to the results div
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  
  console.log = function(...args) {
    originalConsoleLog.apply(console, args);
    
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    
    resultsDiv.innerHTML += message + '<br>';
  };
  
  console.error = function(...args) {
    originalConsoleError.apply(console, args);
    
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    
    resultsDiv.innerHTML += '<span style="color:red;">' + message + '</span><br>';
  };
  
  document.body.appendChild(button);
  document.body.appendChild(resultsDiv);
} else {
  // In Node.js environment, run tests immediately
  runTests();
}
