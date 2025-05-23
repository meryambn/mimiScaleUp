// This script uses ES modules
// Run with: node test-contacts.js
import fetch from 'node-fetch';

// Configuration
const API_BASE_URL = 'http://localhost:8083/api'; // Adjust if your API is on a different port
const USERS = [
  { email: 'startup@example.com', id: 8, role: 'startup' },
  { email: 'mentor@example.com', id: 5, role: 'mentor' }, // Changed from ID 7 to ID 5
  { email: 'admin@example.com', id: 1, role: 'admin' }
];

// Helper function to make API requests
async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`API request failed: ${response.status} ${JSON.stringify(data)}`);
      return { error: data, status: response.status };
    }

    return { data, status: response.status };
  } catch (error) {
    console.error(`API request error: ${error.message}`);
    return { error: error.message, status: 500 };
  }
}

// Function to get contacts for a user
async function getContacts(userId, userRole) {
  console.log(`\n--- Testing contacts for ${userRole} (ID: ${userId}) ---`);

  try {
    const url = `${API_BASE_URL}/messages/contacts/${userId}/${userRole}`;
    console.log(`Making request to: ${url}`);

    const result = await apiRequest(url);

    if (result.error) {
      console.error(`Failed to get contacts for ${userRole} (ID: ${userId})`);
      console.error(`Error: ${JSON.stringify(result.error)}`);
      return null;
    }

    console.log(`Success! Found ${result.data.length} contacts for ${userRole} (ID: ${userId})`);

    if (result.data.length > 0) {
      console.log('Contacts:');
      result.data.forEach((contact, index) => {
        console.log(`  ${index + 1}. ${contact.name} (${contact.role}, ID: ${contact.id})`);
      });
    } else {
      console.log('No contacts found.');
    }

    return result.data;
  } catch (error) {
    console.error(`Unexpected error: ${error.message}`);
    return null;
  }
}

// Function to get conversations for a user
async function getConversations(userId, userRole) {
  console.log(`\n--- Testing conversations for ${userRole} (ID: ${userId}) ---`);

  try {
    const url = `${API_BASE_URL}/messages/conversations/${userId}/${userRole}`;
    console.log(`Making request to: ${url}`);

    const result = await apiRequest(url);

    if (result.error) {
      console.error(`Failed to get conversations for ${userRole} (ID: ${userId})`);
      console.error(`Error: ${JSON.stringify(result.error)}`);
      return null;
    }

    console.log(`Success! Found ${result.data.length} conversations for ${userRole} (ID: ${userId})`);

    if (result.data.length > 0) {
      console.log('Conversations:');
      result.data.forEach((conv, index) => {
        console.log(`  ${index + 1}. With: ${conv.other_participant.name || 'Unknown'} (${conv.other_participant.role}, ID: ${conv.other_participant.id})`);
        console.log(`     Last message: ${conv.last_message_content || 'No messages'}`);
        console.log(`     Unread: ${conv.unread_count}`);
      });
    } else {
      console.log('No conversations found.');
    }

    return result.data;
  } catch (error) {
    console.error(`Unexpected error: ${error.message}`);
    return null;
  }
}

// Function to test database queries directly
async function testDatabaseQueries() {
  console.log('\n--- Testing Database Queries Directly ---');

  // This would require connecting to the database directly
  // For now, we'll just print instructions
  console.log('To test database queries directly:');
  console.log('1. Connect to your database using a client like pgAdmin or psql');
  console.log('2. Run the following queries to check data integrity:');

  console.log('\n-- Check if startup user exists and has candidatures:');
  console.log(`
SELECT s.utilisateur_id, s.nom_entreprise, u.email, COUNT(c.id) as candidature_count
FROM app_schema.startups s
JOIN app_schema.utilisateur u ON s.utilisateur_id = u.id
LEFT JOIN app_schema.candidatures c ON s.utilisateur_id = c.utilisateur_id
WHERE u.email = 'startup@example.com'
GROUP BY s.utilisateur_id, s.nom_entreprise, u.email;
  `);

  console.log('\n-- Check if mentor user exists and is assigned to programs:');
  console.log(`
SELECT m.utilisateur_id, m.nom, m.prenom, u.email, COUNT(pm.programme_id) as program_count
FROM app_schema.mentors m
JOIN app_schema.utilisateur u ON m.utilisateur_id = u.id
LEFT JOIN app_schema.programme_mentors pm ON m.utilisateur_id = pm.mentor_id
WHERE u.email = 'mentor@example.com'
GROUP BY m.utilisateur_id, m.nom, m.prenom, u.email;
  `);

  console.log('\n-- Check if admin user exists:');
  console.log(`
SELECT a.utilisateur_id, u.email
FROM app_schema.admin a
JOIN app_schema.utilisateur u ON a.utilisateur_id = u.id
WHERE u.role = 'admin';
  `);
}

// Main function to run all tests
async function runTests() {
  console.log('=== Starting Contact API Tests ===');

  // Test for each user
  for (const user of USERS) {
    await getContacts(user.id, user.role);
    await getConversations(user.id, user.role);
  }

  // Test database queries
  await testDatabaseQueries();

  console.log('\n=== Tests Completed ===');
}

// Run the tests
runTests().catch(error => {
  console.error('Test script failed:', error);
});
